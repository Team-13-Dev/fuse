// app/api/onboarding/clean/route.ts
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

  const body = await req.arrayBuffer()

  const upstream = await fetch(`${PIPELINE_URL}/clean`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  })

  const data = await upstream.json()

  // 202 = action_required: bubble it through with same status
  if (upstream.status === 202) {
    return NextResponse.json(data, { status: 202 })
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: data.detail ?? "Pipeline clean failed" },
      { status: upstream.status },
    )
  }

  return NextResponse.json(data)
}