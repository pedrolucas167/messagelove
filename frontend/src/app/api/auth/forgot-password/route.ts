import { NextResponse } from "next/server";
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
    console.error("POST /api/auth/forgot-password", error);
    return NextResponse.json({ success: false, error: "Erro ao processar solicitação" }, { status: 400 });
  }
}
