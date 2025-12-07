import { NextResponse } from "next/server";
import { EnvValidationError } from "@/lib/env";
import { loginUser } from "@/server/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    // Validate required fields
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Senha é obrigatória" },
        { status: 400 }
      );
    }

    const result = await loginUser({ email, password });

    return NextResponse.json({ success: true, token: result.token, user: result.user });
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error("Env validation failed on login", error.details);
      return NextResponse.json(
        { success: false, error: "Configuração do servidor indisponível. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    console.error("POST /api/auth/login", error);
    const message = error instanceof Error ? error.message : "Erro ao autenticar";
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
