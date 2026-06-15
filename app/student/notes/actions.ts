"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/profile/queries"
import { syncLinkedInProfile } from "@/lib/profile/linkedin"
import { verifyProofWithContext } from "@/lib/verify/proofs"
import type { ProofKind } from "@/lib/supabase/types"

const PATH = "/student/notes"
const PROOF_KINDS: ProofKind[] = ["github", "doi", "image", "link", "file"]

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/student/login?next=/student/notes")
  return { supabase, user }
}

export type ActionResult = { ok: boolean; error?: string }

export async function syncLinkedInIdentityAction(): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  const identity = await syncLinkedInProfile(supabase, user)
  if (!identity.connected) return { ok: false, error: "LinkedIn is not connected" }
  revalidatePath(PATH)
  return { ok: true }
}

// --- Header (the fixed top block) -------------------------------------------
export async function updateHeader(input: {
  full_name: string
  headline: string
  about: string
  tags: string[]
  target_role: string
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name.trim(),
      headline: input.headline.trim(),
      about: input.about.trim(),
      tags: input.tags.map((t) => t.trim()).filter(Boolean).slice(0, 12),
      target_role: input.target_role.trim(),
    })
    .eq("id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

export async function updateAvatar(input: { url: string | null }): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: input.url })
    .eq("id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

// --- Sections ---------------------------------------------------------------
export async function addSection(input: { type: string; title: string }): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  const { count } = await supabase
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
  const { error } = await supabase.from("sections").insert({
    profile_id: user.id,
    type: input.type.trim() || "custom",
    title: input.title.trim() || "Untitled section",
    position: count ?? 0,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

export async function deleteSection(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("sections").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

export async function renameSection(id: string, title: string): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("sections").update({ title: title.trim() }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

// --- Items ------------------------------------------------------------------
export async function addItem(input: { sectionId: string; title: string; body: string }): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("section_id", input.sectionId)
  const { error } = await supabase.from("items").insert({
    section_id: input.sectionId,
    title: input.title.trim(),
    body: input.body.trim(),
    position: count ?? 0,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

export async function updateItem(id: string, input: { title: string; body: string }): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("items")
    .update({ title: input.title.trim(), body: input.body.trim() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("items").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

// --- Proofs -----------------------------------------------------------------
export async function addProof(input: { itemId: string; kind: string; url: string }): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const kind = (PROOF_KINDS.includes(input.kind as ProofKind) ? input.kind : "link") as ProofKind
  const url = input.url.trim()
  if (!url) return { ok: false, error: "URL is required" }
  const { error } = await supabase.from("proofs").insert({ item_id: input.itemId, kind, url, status: "unverified" })
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

export async function deleteProof(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("proofs").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

// Run the verification engine on a single proof and persist the result.
export async function verifyProofAction(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const profile = await getCurrentProfile()
  if (!profile) return { ok: false, error: "No profile" }
  const item = profile.sections.flatMap((section) => section.items).find((entry) => entry.proofs.some((proof) => proof.id === id))
  const proof = item?.proofs.find((entry) => entry.id === id)
  if (!proof || !item) return { ok: false, error: "Proof not found" }

  const result = await verifyProofWithContext(proof.kind, proof.url, {
    profileName: profile.full_name,
    itemTitle: item.title,
    itemBody: item.body,
  })
  const { error: upErr } = await supabase
    .from("proofs")
    .update({ status: result.status, confidence: result.confidence, extracted: result.extracted })
    .eq("id", id)
  if (upErr) return { ok: false, error: upErr.message }
  revalidatePath(PATH)
  return { ok: true }
}

// Verify every not-yet-verified proof on the user's profile (capped for safety).
export async function verifyAllProofs(): Promise<
  ActionResult & { checked?: number; verified?: number; partial?: number; unverified?: number }
> {
  const { supabase } = await requireUser()
  const profile = await getCurrentProfile()
  if (!profile) return { ok: false, error: "No profile" }

  const pending = profile.sections
    .flatMap((section) => section.items.map((item) => ({ item, proofs: item.proofs })))
    .flatMap(({ item, proofs }) => proofs.map((proof) => ({ item, proof })))
    .filter(({ proof }) => proof.status !== "verified")
    .slice(0, 16)

  let verified = 0
  let partial = 0
  let unverified = 0
  for (const { item, proof } of pending) {
    try {
      const result = await verifyProofWithContext(proof.kind, proof.url, {
        profileName: profile.full_name,
        itemTitle: item.title,
        itemBody: item.body,
      })
      const { error } = await supabase
        .from("proofs")
        .update({ status: result.status, confidence: result.confidence, extracted: result.extracted })
        .eq("id", proof.id)
      if (error) {
        unverified += 1
      } else if (result.status === "verified") {
        verified += 1
      } else if (result.status === "partial") {
        partial += 1
      } else {
        unverified += 1
      }
    } catch {
      unverified += 1
    }
  }
  revalidatePath(PATH)
  return { ok: true, checked: pending.length, verified, partial, unverified }
}

// --- Session ----------------------------------------------------------------
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/student/login")
}
