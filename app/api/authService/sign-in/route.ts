import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    return NextResponse.json({
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Invalid credentials" },
      { status: 401 }
    );
  }
}