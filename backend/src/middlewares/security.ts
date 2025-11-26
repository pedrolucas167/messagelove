import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

// In-memory store for failed login attempts (use Redis in production for multi-instance)
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (value.lockedUntil && value.lockedUntil < now) {
      loginAttempts.delete(key);
    } else if (now - value.lastAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

function getClientIdentifier(req: Request): string {
  // Use IP + User-Agent hash for better identification
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  return `${ip}:${userAgent.substring(0, 50)}`;
}

export function checkAccountLockout(req: Request, res: Response, next: NextFunction) {
  const identifier = getClientIdentifier(req);
  const email = req.body?.email?.toLowerCase?.() || "";
  const key = `${identifier}:${email}`;
  
  const attempt = loginAttempts.get(key);
  
  if (attempt?.lockedUntil) {
    const remainingTime = Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60);
    
    if (attempt.lockedUntil > Date.now()) {
      logger.warn("Account locked - login attempt blocked", {
        email,
        ip: req.ip,
        remainingMinutes: remainingTime,
      });
      
      return res.status(429).json({
        success: false,
        error: `Conta temporariamente bloqueada. Tente novamente em ${remainingTime} minuto(s).`,
        lockedUntil: attempt.lockedUntil,
      });
    } else {
      // Lockout expired, reset
      loginAttempts.delete(key);
    }
  }
  
  return next();
}

export function recordFailedLogin(req: Request): void {
  const identifier = getClientIdentifier(req);
  const email = req.body?.email?.toLowerCase?.() || "";
  const key = `${identifier}:${email}`;
  
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, lastAttempt: now, lockedUntil: null };
  
  // Reset count if outside window
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    attempt.count = 0;
  }
  
  attempt.count++;
  attempt.lastAttempt = now;
  
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION;
    logger.warn("Account locked due to failed attempts", {
      email,
      ip: req.ip,
      attempts: attempt.count,
      lockedUntilMinutes: LOCKOUT_DURATION / 60000,
    });
  }
  
  loginAttempts.set(key, attempt);
}

export function recordSuccessfulLogin(req: Request): void {
  const identifier = getClientIdentifier(req);
  const email = req.body?.email?.toLowerCase?.() || "";
  const key = `${identifier}:${email}`;
  
  loginAttempts.delete(key);
}

// Suspicious activity detection
const suspiciousPatterns = [
  /[<>'"`;]/,  // XSS/SQL injection attempts
  /(\.\.|\/\/)/,  // Path traversal
  /(script|javascript|onerror|onload)/i,  // Script injection
  /union\s+select/i,  // SQL injection
  /(drop|delete|truncate)\s+table/i,  // SQL injection
];

export function detectSuspiciousActivity(req: Request, res: Response, next: NextFunction) {
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const params = JSON.stringify(req.params || {});
  
  const checkString = `${body}${query}${params}`;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logger.warn("Suspicious activity detected", {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.headers["user-agent"],
        pattern: pattern.toString(),
      });
      
      return res.status(400).json({
        success: false,
        error: "Requisição inválida detectada.",
      });
    }
  }
  
  return next();
}

// CSRF State validation for OAuth
const oauthStates = new Map<string, { createdAt: number; redirectTo: string }>();
const STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Cleanup expired states
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of oauthStates.entries()) {
    if (now - value.createdAt > STATE_EXPIRY) {
      oauthStates.delete(key);
    }
  }
}, 60 * 1000);

export function generateOAuthState(redirectTo: string): string {
  const state = require("crypto").randomBytes(32).toString("hex");
  oauthStates.set(state, { createdAt: Date.now(), redirectTo });
  return state;
}

export function validateOAuthState(state: string): string | null {
  const stored = oauthStates.get(state);
  
  if (!stored) {
    return null;
  }
  
  if (Date.now() - stored.createdAt > STATE_EXPIRY) {
    oauthStates.delete(state);
    return null;
  }
  
  oauthStates.delete(state);
  return stored.redirectTo;
}

// Request ID for tracing
export function addRequestId(req: Request, _res: Response, next: NextFunction) {
  req.requestId = require("crypto").randomBytes(8).toString("hex");
  return next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
