import { NextRequest, NextResponse } from "next/server"
import { getBusinessContext } from "@/lib/get-business-context"

const PIPELINE_URL = process.env.PIPELINE_URL

/**
 * POST /api/onboarding/parse
 *
 * Accepts { file_id: string } — the Supabase storage path returned by /upload.
 * Forwards it to the pipeline /parse endpoint which fetches the file directly
 * from Supabase Storage. No file bytes travel through Next.js.
 */
export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!PIPELINE_URL) {
    return NextResponse.json({ error: "PIPELINE_URL is not configured" }, { status: 503 })
  }

  let body: { file_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Expected JSON body with file_id" }, { status: 400 })
  }

  if (!body.file_id) {
    return NextResponse.json({ error: "Missing file_id" }, { status: 400 })
  }

  const upstream = await fetch(`${PIPELINE_URL}/parse`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ file_id: body.file_id }),
  })

  const data = await upstream.json()

  if (!upstream.ok) {
    return NextResponse.json(
      { error: data.detail ?? "Pipeline parse failed" },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}