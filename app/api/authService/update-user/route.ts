import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { name, image } = body;

    const updated = await auth.api.updateUser({
      headers: req.headers,
      body: { name, image },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to update user" },
      { status: 400 }
    );
  }
}