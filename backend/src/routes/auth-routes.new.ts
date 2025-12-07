/**
 * Auth Routes - REST Level 2 Maturity
 * 
 * Endpoints:
 * - POST /auth/register - Registra novo usuário
 * - POST /auth/login - Faz login
 * - POST /auth/logout - Faz logout (client-side)
 * - POST /auth/refresh - Renova token
 * - POST /auth/forgot-password - Solicita reset de senha
 * - POST /auth/reset-password - Reseta senha com token
 * - GET /auth/verify - Verifica token atual
 * - GET /auth/google - Inicia OAuth com Google
 * - GET /auth/google/callback - Callback do Google OAuth
 */

import { Router, type CookieOptions } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.new';
import { validate, getValidatedData } from '../middlewares/validation';
import { asyncHandler } from '../middlewares/error-handler.new';
import { authService } from '../services/auth.service.new';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  GoogleLoginSchema,
  toUserResponseDTO,
} from '../dtos/auth.dto';
import { env } from '../lib/env';
import { logger } from '../config/logger';
import {
  checkAccountLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
  generateOAuthState,
  validateOAuthState,
} from '../middlewares/security';

const router = Router();

const isProduction = env.NODE_ENV === 'production';
const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: AUTH_COOKIE_MAX_AGE,
  path: '/',
};

const userDataCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: AUTH_COOKIE_MAX_AGE,
  path: '/',
};

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Tente novamente mais tarde.' } },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas de login. Tente novamente mais tarde.' } },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas solicitações. Tente novamente em 1 hora.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /auth/register
 * Registra um novo usuário
 * 
 * Response: 201 Created | 400 Bad Request | 409 Conflict
 */
router.post(
  '/register',
  authLimiter,
  validate({ body: RegisterSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidatedData<z.infer<typeof RegisterSchema>>(req);

    const result = await authService.register(body);

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    logger.info('Usuário registrado', { userId: result.data.user.id, email: body.email });

    return res.status(201).json({
      success: true,
      token: result.data.token,
      user: result.data.user,
    });
  })
);

/**
 * POST /auth/login
 * Faz login com email e senha
 * 
 * Response: 200 OK | 400 Bad Request | 401 Unauthorized
 */
router.post(
  '/login',
  loginLimiter,
  checkAccountLockout,
  validate({ body: LoginSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidatedData<z.infer<typeof LoginSchema>>(req);

    const result = await authService.login(body);

    if (!result.success) {
      recordFailedLogin(req);
      logger.warn('Tentativa de login falhou', { email: body.email, ip: req.ip });
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    recordSuccessfulLogin(req);
    logger.info('Login realizado', { userId: result.data.user.id, email: body.email, ip: req.ip });

    return res.status(200).json({
      success: true,
      token: result.data.token,
      user: result.data.user,
    });
  })
);

/**
 * GET /auth/verify
 * Verifica se o token atual é válido
 * 
 * Response: 200 OK | 401 Unauthorized
 */
router.get('/verify', authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    userId: req.userId,
  });
});

/**
 * POST /auth/refresh
 * Renova o token de autenticação
 * 
 * Response: 200 OK | 401 Unauthorized
 */
router.post('/refresh', authenticate, (req, res) => {
  const token = authService.generateToken(req.userId!);
  
  return res.status(200).json({
    success: true,
    token,
  });
});

/**
 * POST /auth/forgot-password
 * Solicita reset de senha (envia email)
 * 
 * Response: 200 OK (sempre, por segurança)
 */
router.post(
  '/forgot-password',
  forgotLimiter,
  validate({ body: ForgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidatedData<z.infer<typeof ForgotPasswordSchema>>(req);

    const result = await authService.requestPasswordReset(body.email);

    // Sempre retorna sucesso (não revela se email existe)
    if (result.success && result.data) {
      logger.info('Link de reset gerado', { email: body.email });
      // TODO: Enviar email com result.data.resetUrl
    }

    return res.status(200).json({
      success: true,
      message: 'Se o email existir, enviaremos instruções de reset.',
    });
  })
);

/**
 * POST /auth/reset-password
 * Reseta a senha usando token
 * 
 * Response: 200 OK | 400 Bad Request
 */
router.post(
  '/reset-password',
  forgotLimiter,
  validate({ body: ResetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const { body } = getValidatedData<z.infer<typeof ResetPasswordSchema>>(req);

    const result = await authService.resetPassword(body);

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    logger.info('Senha redefinida', { email: body.email });

    return res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso.',
    });
  })
);

/**
 * GET /auth/google
 * Inicia fluxo OAuth com Google
 */
router.get('/google', authLimiter, (req, res) => {
  const clientId = env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: { code: 'OAUTH_NOT_CONFIGURED', message: 'Google OAuth não está configurado' },
    });
  }

  const redirectTo = (req.query.redirect as string) || '/';
  const allowedRedirects = ['/', '/dashboard', '/cards'];
  const sanitizedRedirect = allowedRedirects.includes(redirectTo) ? redirectTo : '/';

  const state = generateOAuthState(sanitizedRedirect);
  const baseUrl = env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/**
 * GET /auth/google/callback
 * Callback do Google OAuth
 */
router.get(
  '/google/callback',
  asyncHandler(async (req, res) => {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    const baseUrl =
      (env.FRONTEND_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '') || '/';

    if (error) {
      logger.warn('Google OAuth error', { error });
      return res.redirect(`${baseUrl}?error=google_auth_failed`);
    }

    if (!code || !state) {
      return res.redirect(`${baseUrl}?error=missing_params`);
    }

    const redirectTo = validateOAuthState(state);
    if (!redirectTo) {
      return res.redirect(`${baseUrl}?error=invalid_state`);
    }

    try {
      // Trocar code por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${baseUrl}/api/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = (await tokenResponse.json()) as { access_token?: string };

      if (!tokens.access_token) {
        logger.error('Google token exchange failed', { tokens });
        return res.redirect(`${baseUrl}?error=token_exchange_failed`);
      }

      // Buscar info do usuário
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const googleUser = (await userResponse.json()) as { email?: string; name?: string; id?: string; picture?: string };

      if (!googleUser.email) {
        return res.redirect(`${baseUrl}?error=no_email`);
      }

      // Login/registro via service
      const result = await authService.loginWithGoogle({
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        googleId: googleUser.id || '',
        picture: googleUser.picture,
      });

      if (!result.success) {
        return res.redirect(`${baseUrl}?error=login_failed`);
      }

      // Define cookies seguras para evitar expor tokens em URLs ou logs
      res.cookie('auth_token', result.data.token, authCookieOptions);
      res.cookie(
        'user_data',
        JSON.stringify({
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
        }),
        userDataCookieOptions
      );

      // Redireciona sem token na URL (OWASP A02 - evitar exposição em logs/referers)
      return res.redirect(`${baseUrl}${redirectTo}`);
    } catch (err) {
      logger.error('Google OAuth callback error', { error: err });
      return res.redirect(`${baseUrl}?error=oauth_failed`);
    }
  })
);

/**
 * GET /auth/me
 * Retorna dados do usuário autenticado
 * 
 * Response: 200 OK | 401 Unauthorized
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await authService.findUserById(req.userId!);

    if (!result.success) {
      return res.status(result.error.statusCode).json(result.error.toJSON());
    }

    return res.status(200).json({
      success: true,
      user: result.data,
    });
  })
);

export const authRouter = router;
