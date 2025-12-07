import { NextResponse } from "next/server";
import { EnvValidationError } from "@/lib/env";
import { registerUser } from "@/server/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body ?? {};

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const result = await registerUser({ name, email, password });

    return NextResponse.json(
      { success: true, token: result.token, user: result.user },
      { status: 201 }
    );
  } catch (error) {
    // Log completo do erro para debug
    console.error("POST /api/auth/register error:", error);
    
    if (error instanceof EnvValidationError) {
      console.error("Env validation failed on register", error.details);
      return NextResponse.json(
        { success: false, error: "Configuração do servidor indisponível. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    // Verificar se é erro de env (pode vir como Error comum)
    const message = error instanceof Error ? error.message : "Erro ao registrar";
    if (message.includes("Invalid environment") || message.includes("env")) {
      console.error("Possible env error:", message);
      return NextResponse.json(
        { success: false, error: "Configuração do servidor indisponível. Tente novamente mais tarde." },
        { status: 500 }
      );
    }
    
    const status = message.includes("já está em uso") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
