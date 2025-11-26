import { NextResponse } from "next/server";
import { loginUser } from "@/server/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};
    const result = await loginUser({ email, password });

    return NextResponse.json({ success: true, token: result.token, user: result.user });
  } catch (error) {
    console.error("POST /api/auth/login", error);
    const message = error instanceof Error ? error.message : "Erro ao autenticar";
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
