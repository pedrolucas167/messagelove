import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  generateAuthToken,
  loginWithGoogle,
} from "../services/auth-service";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate-request";
import { logger } from "../config/logger";
import { env } from "../lib/env";
import {
  checkAccountLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
  generateOAuthState,
  validateOAuthState,
} from "../middlewares/security";

const router = Router();

// More aggressive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: "Muitas tentativas. Por favor, tente novamente mais tarde." },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Even stricter for login (brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Muitas tentativas de login. Por favor, tente novamente mais tarde." },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { success: false, error: "Muitas solicitações de reset. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
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
  loginLimiter,
  checkAccountLockout,
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password").notEmpty().withMessage("Senha é obrigatória"),
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await loginUser({
        email: String(req.body.email),
        password: String(req.body.password),
      });
      
      // Record successful login (clears lockout)
      recordSuccessfulLogin(req);
      
      logger.info("Login realizado com sucesso", { 
        userId: result.user?.id, 
        email: result.user?.email,
        ip: req.ip,
      });
      return res.json({ success: true, token: result.token, user: result.user });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Credenciais inválidas")) {
        // Record failed attempt
        recordFailedLogin(req);
        
        logger.warn("Failed login attempt", {
          email: req.body.email,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
        
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

// Google OAuth Routes
router.get("/google", authLimiter, (req, res) => {
  const clientId = env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).json({ error: "Google OAuth não está configurado" });
  }

  const redirectTo = (req.query.redirect as string) || "/";
  
  // Validate redirectTo to prevent open redirect attacks
  const allowedRedirects = ["/", "/dashboard", "/cards"];
  const sanitizedRedirect = allowedRedirects.includes(redirectTo) ? redirectTo : "/";
  
  const baseUrl = env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  // Generate secure state token to prevent CSRF
  const state = generateOAuthState(sanitizedRedirect);
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state: state,
    prompt: "consent",
  });
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(googleAuthUrl);
});

router.get("/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const state = req.query.state as string;
  
  const baseUrl = env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
  
  // Validate state to prevent CSRF attacks
  const redirectTo = validateOAuthState(state);
  if (!redirectTo) {
    logger.warn("OAuth state validation failed", { 
      ip: req.ip,
      state: state?.substring(0, 20),
    });
    return res.redirect(`${baseUrl}/?error=invalid_state`);
  }
  
  if (error) {
    logger.error("Google OAuth error:", { error, ip: req.ip });
    return res.redirect(`${baseUrl}/?error=oauth_error`);
  }
  
  if (!code) {
    return res.redirect(`${baseUrl}/?error=no_code`);
  }
  
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    logger.error("Google OAuth credentials not configured");
    return res.redirect(`${baseUrl}/?error=oauth_not_configured`);
  }
  
  try {
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error("Token exchange failed:", { error: errorText });
      return res.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }
    
    const tokens = await tokenResponse.json() as { access_token: string };
    
    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    if (!userInfoResponse.ok) {
      return res.redirect(`${baseUrl}/?error=user_info_failed`);
    }
    
    const userInfo = await userInfoResponse.json() as {
      sub: string;
      email: string;
      email_verified: boolean;
      name: string;
      picture?: string;
    };
    
    if (!userInfo.email_verified) {
      return res.redirect(`${baseUrl}/?error=email_not_verified`);
    }
    
    // Login or register user
    const result = await loginWithGoogle({
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.sub,
      picture: userInfo.picture,
    });
    
    logger.info("Google OAuth login successful", { 
      userId: result.user?.id, 
      email: userInfo.email,
      ip: req.ip,
    });
    
    // Redirect with token in URL (frontend will extract and store it)
    const redirectUrl = new URL(redirectTo, baseUrl);
    redirectUrl.searchParams.set("token", result.token);
    redirectUrl.searchParams.set("user", JSON.stringify({
      id: result.user?.id,
      email: result.user?.email,
      name: result.user?.name,
    }));
    
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error("Google OAuth callback error:", { error, ip: req.ip });
    return res.redirect(`${baseUrl}/?error=oauth_failed`);
  }
});

export const authRouter = router;
