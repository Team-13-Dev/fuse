import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user: session.user, session: session.session });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to get session" },
      { status: 401 }
    );
  }
}