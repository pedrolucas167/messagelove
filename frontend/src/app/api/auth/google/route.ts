import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  const clientId = env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth não está configurado" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const redirectTo = searchParams.get("redirect") || "/";
  
  // Get the base URL for the callback
  const baseUrl = env.FRONTEND_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  // Store the original redirect destination in a cookie
  const response = NextResponse.redirect(getGoogleAuthUrl(clientId, redirectUri, redirectTo));
  
  response.cookies.set("oauth_redirect", redirectTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  
  return response;
}

function getGoogleAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state: state,
    prompt: "consent",
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
