# Security - MessageLove

## Implemented OWASP Protections

This document describes the security measures implemented following OWASP Top 10 2021 guidelines.

---

## A01:2021 - Broken Access Control

### ✅ Implemented:
- **OAuth State Validation**: CSRF token generated and validated in OAuth flows
- **Redirect Whitelist**: Only allowed routes (`/`, `/dashboard`, `/cards`) are accepted in OAuth redirects
- **JWT Authentication**: All protected routes require a valid token
- **Per-User Authorization**: Cards can only be accessed/modified by their owner

---

## A02:2021 - Cryptographic Failures

### ✅ Implemented:
- **Enforced HTTPS**: HSTS with 1-year duration, including subdomains
- **Passwords with bcrypt**: Hash with cost 12
- **Secure JWT**: 64-character secret, 24h expiration
- **Secure Reset Tokens**: SHA-256 hash, 15-minute expiration

---

## A03:2021 - Injection

### ✅ Implemented:
- **Suspicious Pattern Detection**: Middleware blocks XSS/SQL injection attempts
- **Input Validation**: express-validator on all routes
- **Email Sanitization**: `normalizeEmail()` applied
- **Payload Limit**: 10KB maximum for JSON requests
- **Sequelize ORM**: Parameterized queries, no raw SQL

---

## A04:2021 - Insecure Design

### ✅ Implemented:
- **Aggressive Rate Limiting**:
  - Global: 100 req/15min
  - Login: 5 req/15min (skip on success)
  - Register: 20 req/hour
  - Forgot Password: 3 req/hour
- **Account Lockout**: 5 failed attempts = 15-minute lockout
- **Security Logs**: All login attempts are recorded

---

## A05:2021 - Security Misconfiguration

### ✅ Implemented:
- **Security Headers (Helmet)**:
  - `Content-Security-Policy`: Restrictive policy
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`: Camera, mic, geolocation disabled
- **Restrictive CORS**: Only allowed origins
- **X-Powered-By Removed**: Technology not exposed

---

## A06:2021 - Vulnerable and Outdated Components

### Recommendations:
- Run `npm audit` regularly
- Keep dependencies updated
- Use `npm audit fix` for automatic fixes

---

## A07:2021 - Identification and Authentication Failures

### ✅ Implemented:
- **Strong Password Required**: Min. 8 chars, uppercase, lowercase, number
- **Account Lockout**: Lockout after 5 failed attempts
- **Secure JWT Tokens**: Expiration, signature verification
- **Secure OAuth**: State validation, email verification required
- **Secure Password Reset**: Unique token, expires in 15min, single use

---

## A08:2021 - Software and Data Integrity Failures

### ✅ Implemented:
- **OAuth State Validation**: Prevents CSRF in authentication flows
- **Google Email Verification**: Only accepts verified emails

---

## A09:2021 - Security Logging and Monitoring

### ✅ Implemented:
- **Winston Logger**: Structured logs with levels
- **Security Logs**:
  - Login attempts (success/failure)
  - Account lockouts
  - Blocked suspicious requests
  - Authentication errors
  - Blocked CORS
- **Request ID**: Request traceability

---

## A10:2021 - Server-Side Request Forgery

### ✅ Implemented:
- **Controlled URLs**: Only predefined Google OAuth endpoints
- **Redirect Validation**: Whitelist of allowed URLs

---

## Rate Limit Configuration

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 100 | 15 min |
| Login | 5 | 15 min |
| Register | 20 | 1 hour |
| Forgot Password | 3 | 1 hour |
| Google OAuth | 10 | 15 min |

---

## Sensitive Environment Variables

```env
JWT_SECRET=<64+ random characters>
GOOGLE_CLIENT_SECRET=<Google Cloud secret>
AWS_SECRET_ACCESS_KEY=<AWS secret>
DATABASE_URL=<connection string with password>
```

⚠️ **NEVER** commit `.env` files with real secrets!

---

## Deploy Checklist

- [ ] Verify that `.env` is in `.gitignore`
- [ ] Use HTTPS in production
- [ ] Configure environment variables on Render/Vercel
- [ ] Run `npm audit` before deploy
- [ ] Check logs after deploy
- [ ] Test rate limiting in production

---

## Recommended Monitoring

1. **Alerts for**:
   - Multiple account lockouts from the same IP
   - Spikes in 429 requests (rate limit)
   - Frequent 500 errors
   - Mass failed login attempts

2. **Metrics to track**:
   - Login success rate
   - API response time
   - Memory/CPU usage
   - Errors per endpoint

---

*Last updated: December 2025*
