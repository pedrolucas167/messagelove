import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { extractTokenFromHeader } from "@/server/utils/auth";
import { EnvValidationError } from "@/lib/env";
import { verifyToken } from "@/server/services/auth-service";

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const payload = verifyToken(token);
    return NextResponse.json({ ok: true, userId: payload.userId });
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error("Env validation failed on auth/verify", error.details);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    console.error("GET /api/auth/verify", error);
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
