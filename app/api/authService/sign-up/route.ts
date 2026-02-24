import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email and password are required" },
        { status: 400 }
      );
    }

    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    return NextResponse.json({
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Sign up failed" },
      { status: 400 }
    );
  }
}