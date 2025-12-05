import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth-routes";
import { cardRouter } from "./routes/card-routes";
import { logger } from "./config/logger";
import { logErrors, globalErrorHandler } from "./middlewares/error-handler";
import { detectSuspiciousActivity, addRequestId } from "./middlewares/security";

export const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://messagelove.com.br",
  "https://www.messagelove.com.br",
  "https://messagelove.onrender.com",
];

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn("Blocked CORS request", { origin });
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  // Request ID for tracing
  app.use(addRequestId);

  // CORS
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Security headers with enhanced configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...allowedOrigins],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding images from S3
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }));

  // Additional security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.removeHeader("X-Powered-By");
    next();
  });

  app.use(compression());
  app.use(express.json({ limit: "16mb" }));
  app.use(express.urlencoded({ extended: true, limit: "16mb" }));

  // Detect suspicious patterns in requests
  app.use(detectSuspiciousActivity);

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    skip: (req) => req.method === "OPTIONS",
    message: { success: false, error: "Too many requests from this IP, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip || req.socket.remoteAddress || "unknown";
    },
  });
  app.use(globalLimiter);

  // Strict rate limiter for sensitive endpoints
  const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: { success: false, error: "Muitas requisições. Tente novamente mais tarde." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth/register", strictLimiter);
  app.use("/api/auth/forgot-password", strictLimiter);

  app.use("/api/auth", authRouter);
  app.use("/api/cards", cardRouter);

  // Health check endpoint for Render
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/", (_req, res) => {
    res.status(200).json({
      status: "online",
      message: "MessageLove API",
      version: "2.0.0",
      // Don't expose environment in production
      ...(process.env.NODE_ENV !== "production" && { environment: process.env.NODE_ENV }),
    });
  });

  app.use((req, res, next) => {
    if (req.method === "OPTIONS") return next();
    res.status(404).json({
      error: "Endpoint não encontrado",
    });
  });

  app.use(logErrors);
  app.use(globalErrorHandler);

  return app;
}
