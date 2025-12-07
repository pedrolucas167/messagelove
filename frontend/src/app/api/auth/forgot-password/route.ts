import { NextResponse } from "next/server";
import { EnvValidationError } from "@/lib/env";
import { requestPasswordReset } from "@/server/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body ?? {};
    const result = await requestPasswordReset(email);

    return NextResponse.json({
      success: true,
      message: "Se o email existir, enviaremos instruções.",
      resetUrl: result?.resetUrl,
    });
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error("Env validation failed on forgot-password", error.details);
      return NextResponse.json(
        { success: false, error: "Configuração do servidor indisponível. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    console.error("POST /api/auth/forgot-password", error);
    return NextResponse.json({ success: false, error: "Erro ao processar solicitação" }, { status: 400 });
  }
}
