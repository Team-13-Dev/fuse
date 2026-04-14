import { NextRequest, NextResponse } from "next/server"
import { getBusinessContext } from "@/lib/get-business-context"

const PIPELINE_URL = process.env.PIPELINE_URL

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!PIPELINE_URL) {
    return NextResponse.json({ error: "PIPELINE_URL is not configured" }, { status: 503 })
  }

  const contentType = req.headers.get("content-type") ?? ""
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
  }

  // Forward the raw multipart body to the pipeline service unchanged
  const body = await req.arrayBuffer()

  const upstream = await fetch(`${PIPELINE_URL}/parse`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
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