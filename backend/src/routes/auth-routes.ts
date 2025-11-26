import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  generateAuthToken,
} from "../services/auth-service";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate-request";
import { logger } from "../config/logger";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Muitas tentativas. Por favor, tente novamente mais tarde.",
  skipSuccessfulRequests: true,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Muitas tentativas. Por favor, tente novamente mais tarde.",
});

router.get("/verify", authenticate, (req, res) => {
  return res.json({ ok: true, userId: req.userId });
});

router.post(
  "/register",
  authLimiter,
  body("name").trim().notEmpty().withMessage("Nome é obrigatório.").isLength({ max: 120 }),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Senha deve ter pelo menos 8 caracteres")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
    .withMessage("Senha deve conter letras maiúsculas, minúsculas e números"),
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await registerUser({
        name: String(req.body.name),
        email: String(req.body.email),
        password: String(req.body.password),
      });
      logger.info("Usuário registrado com sucesso", { userId: result.user?.id, email: result.user?.email });
      return res.status(201).json({ success: true, token: result.token, user: result.user });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Email já está em uso")) {
        return res.status(409).json({ success: false, error: error.message });
      }
      return next(error);
    }
  }
);

router.post(
  "/login",
  authLimiter,
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password").notEmpty().withMessage("Senha é obrigatória"),
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await loginUser({
        email: String(req.body.email),
        password: String(req.body.password),
      });
      logger.info("Login realizado com sucesso", { userId: result.user?.id, email: result.user?.email });
      return res.json({ success: true, token: result.token, user: result.user });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Credenciais inválidas")) {
        return res.status(401).json({ success: false, error: error.message });
      }
      return next(error);
    }
  }
);

router.post(
  "/forgot-password",
  forgotLimiter,
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await requestPasswordReset(String(req.body.email));
      if (result) {
        logger.info("Link de reset gerado", { email: result.email });
      } else {
        logger.info("Reset solicitado para email não cadastrado", { email: req.body.email });
      }
      return res.json({ success: true, message: "Se o email existir, enviaremos instruções." });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/reset-password",
  forgotLimiter,
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("token").notEmpty().withMessage("Token é obrigatório"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Senha deve ter pelo menos 8 caracteres")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
    .withMessage("Senha deve conter letras maiúsculas, minúsculas e números"),
  validateRequest,
  async (req, res, next) => {
    try {
      await resetPassword({
        email: String(req.body.email),
        token: String(req.body.token),
        newPassword: String(req.body.newPassword),
      });
      logger.info("Senha redefinida", { email: req.body.email });
      return res.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("token")) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return next(error);
    }
  }
);

router.post("/refresh", authenticate, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, error: "Token inválido" });
  }
  const token = generateAuthToken(req.userId);
  return res.json({ success: true, token });
});

export const authRouter = router;
