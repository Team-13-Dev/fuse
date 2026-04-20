// app/api/onboarding/upload/route.ts
//
// Accepts a multipart file upload, stores it in Supabase Storage,
// returns { file_id, filename, size_mb } for subsequent /parse and /clean calls.
//
// 413 fix: Next.js App Router route handlers don't support bodyParser config.

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 60  // seconds (raise to 300 on Vercel Pro for very large files)

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, key)
}

const BUCKET = "pipeline-imports"

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Could not parse form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
  if (![".xlsx", ".xls", ".csv"].includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type '${ext}'. Use .xlsx, .xls, or .csv` },
      { status: 400 }
    )
  }

  const sizeMb = file.size / (1024 * 1024)
  if (sizeMb > 50) {
    return NextResponse.json({ error: "File exceeds 50 MB limit" }, { status: 413 })
  }

  const supabase = getSupabase()
  const fileId   = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path     = `${fileId}${ext}`
  const bytes    = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  if (error) {
    console.error("Supabase upload error:", error)
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 })
  }

  return NextResponse.json({
    file_id:  path,
    filename: file.name,
    size_mb:  parseFloat(sizeMb.toFixed(2)),
  })
}