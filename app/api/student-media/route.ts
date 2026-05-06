import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse, type NextRequest } from "next/server"

const ALLOWED_FILES = new Set([
  "PROFILE-PHOTO.png",
  "WhatsApp Image 2026-05-05 at 4.40.54 AM (1).jpeg",
  "WhatsApp Image 2026-05-05 at 4.40.54 AM.jpeg",
  "WhatsApp Image 2026-05-05 at 4.40.55 AM.jpeg",
  "WhatsApp Image 2026-05-05 at 4.41.01 AM (1).jpeg",
  "WhatsApp Image 2026-05-05 at 4.41.01 AM.jpeg",
  "WhatsApp Video 2026-05-05 at 4.40.55 AM.mp4",
])

function contentTypeFor(fileName: string) {
  if (fileName.endsWith(".mp4")) return "video/mp4"
  if (fileName.endsWith(".jpeg") || fileName.endsWith(".jpg")) return "image/jpeg"
  if (fileName.endsWith(".png")) return "image/png"
  return "application/octet-stream"
}

export async function GET(request: NextRequest) {
  const requestedName = request.nextUrl.searchParams.get("name")
  if (!requestedName || !ALLOWED_FILES.has(requestedName)) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 })
  }

  try {
    const filePath = path.join(process.cwd(), "PHOTOS", requestedName)
    const bytes = await readFile(filePath)

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentTypeFor(requestedName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Unable to read media" }, { status: 500 })
  }
}
