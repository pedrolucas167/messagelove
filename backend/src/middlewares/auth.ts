import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/auth-service";
import { logger } from "../config/logger";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    logger.warn("Token ausente", { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({ success: false, error: "Token de autenticação ausente." });
  }

  const token = header.slice(7).trim();
  if (!token) {
    logger.warn("Bearer sem token", { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({ success: false, error: "Token inválido." });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.user = {
      id: payload.userId,
    };
    return next();
  } catch (error) {
    logger.warn("Falha na autenticação", {
      error: error instanceof Error ? error.message : "unknown",
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
    const message =
      error instanceof Error && error.name === "TokenExpiredError"
        ? "Token expirado."
        : "Token inválido.";
    return res.status(401).json({ success: false, error: message });
  }
}
