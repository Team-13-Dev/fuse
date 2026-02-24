import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await auth.api.listSessions({
      headers: req.headers,
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to list sessions" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (token) {
      await auth.api.revokeSession({
        headers: req.headers,
        body: { token },
      });
    } else {
      await auth.api.revokeOtherSessions({
        headers: req.headers,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to revoke session(s)" },
      { status: 400 }
    );
  }
}