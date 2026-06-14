"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const PATH = "/student/notes"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/student/login?next=/student/notes")
  return { supabase, user }
}

export type ActionResult = { ok: boolean; error?: string }

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

// --- Session ----------------------------------------------------------------
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/student/login")
}
