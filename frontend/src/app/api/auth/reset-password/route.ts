import { NextResponse } from "next/server";
import { EnvValidationError } from "@/lib/env";
import { resetPassword } from "@/server/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body ?? {};
    await resetPassword({ email, token, newPassword });
    return NextResponse.json({ success: true, message: "Senha alterada com sucesso" });
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error("Env validation failed on reset-password", error.details);
      return NextResponse.json(
        { success: false, error: "Configuração do servidor indisponível. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    console.error("POST /api/auth/reset-password", error);
    const message = error instanceof Error ? error.message : "Erro ao redefinir senha";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
