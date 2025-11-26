import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth-routes";
import { cardRouter } from "./routes/card-routes";
import { logger } from "./config/logger";
import { logErrors, globalErrorHandler } from "./middlewares/error-handler";

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

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.method === "OPTIONS",
    message: "Too many requests from this IP, please try again later",
  });
  app.use(limiter);

  app.use("/api/auth", authRouter);
  app.use("/api/cards", cardRouter);

  app.get("/", (_req, res) => {
    res.status(200).json({
      status: "online",
      message: "MessageLove API",
      version: "2.0.0",
      environment: process.env.NODE_ENV || "development",
      docs: "https://github.com/pedrolucas167/messagelove",
    });
  });

  app.use((req, res, next) => {
    if (req.method === "OPTIONS") return next();
    res.status(404).json({
      error: "Endpoint não encontrado",
      availableEndpoints: { auth: "/api/auth", cards: "/api/cards" },
    });
  });

  app.use(logErrors);
  app.use(globalErrorHandler);

  return app;
}
