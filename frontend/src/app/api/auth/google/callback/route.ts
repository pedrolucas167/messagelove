import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { loginWithGoogle } from "@/server/services/auth-service";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  
  // Get stored redirect destination
  const redirectTo = request.cookies.get("oauth_redirect")?.value || state || "/";
  
  const baseUrl = env.FRONTEND_URL || request.nextUrl.origin;
  
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_error`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }
  
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("Google OAuth credentials not configured");
    return NextResponse.redirect(`${baseUrl}/?error=oauth_not_configured`);
  }
  
  try {
    // Exchange code for tokens
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const tokenResponse = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
    
    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokenResponse.access_token);
    
    if (!userInfo.email_verified) {
      return NextResponse.redirect(`${baseUrl}/?error=email_not_verified`);
    }
    
    // Login or register user with Google
    const result = await loginWithGoogle({
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.sub,
      picture: userInfo.picture,
    });

    if (!result.user) {
      console.error("Google OAuth: user creation failed");
      return NextResponse.redirect(`${baseUrl}/?error=user_creation_failed`);
    }
    
    // Create response with redirect
    const response = NextResponse.redirect(`${baseUrl}${redirectTo}`);
    
    // Set auth token cookie
    response.cookies.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    
    // Set user data cookie (non-httpOnly so JS can read it)
    response.cookies.set("user_data", JSON.stringify({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    
    // Clear oauth redirect cookie
    response.cookies.delete("oauth_redirect");
    
    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_failed`);
  }
}

async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token exchange failed:", errorText);
    throw new Error("Failed to exchange code for tokens");
  }
  
  return response.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to get user info from Google");
  }
  
  return response.json();
}
