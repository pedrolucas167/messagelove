import { NextResponse } from "next/server";
import { registerUser } from "@/server/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body ?? {};

    const result = await registerUser({ name, email, password });

    return NextResponse.json(
      { success: true, token: result.token, user: result.user },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/register", error);
    const message = error instanceof Error ? error.message : "Erro ao registrar";
    const status = message.includes("já está em uso") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
