import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (use Redis/Upstash in production for multi-instance)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // max requests per window for API routes

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.lastReset > RATE_LIMIT_WINDOW * 2) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }
  
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// Suspicious patterns to block
const suspiciousPatterns = [
  /(\.\.|\/\/)/,  // Path traversal
  /<script/i,     // XSS
  /javascript:/i, // XSS
  /union\s+select/i,  // SQL injection
  /;\s*drop\s+/i,     // SQL injection
];

function isSuspiciousRequest(request: NextRequest): boolean {
  const url = request.nextUrl.pathname + request.nextUrl.search;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return true;
    }
  }
  
  return false;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Block suspicious requests
  if (isSuspiciousRequest(request)) {
    console.warn(`Suspicious request blocked: ${pathname} from ${getClientIP(request)}`);
    return new NextResponse(
      JSON.stringify({ error: "Bad Request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(ip);
    
    if (!allowed) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": MAX_REQUESTS.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
    
    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Skip static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
