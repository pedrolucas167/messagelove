import { NextRequest } from "next/server";
import { verifyToken } from "@/server/services/auth-service";

export function extractTokenFromHeader(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

export function requireUserId(request: NextRequest): string {
  const token = extractTokenFromHeader(request);
  if (!token) {
    throw new Error("Token ausente");
  }
  const payload = verifyToken(token);
  return payload.userId;
}
