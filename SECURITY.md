# Segurança - MessageLove

## Proteções OWASP Implementadas

Este documento descreve as medidas de segurança implementadas seguindo as diretrizes OWASP Top 10 2021.

---

## A01:2021 - Broken Access Control

### ✅ Implementado:
- **Validação de State OAuth**: Token CSRF gerado e validado em fluxos OAuth
- **Whitelist de redirects**: Apenas rotas permitidas (`/`, `/dashboard`, `/cards`) são aceitas em redirects OAuth
- **Autenticação JWT**: Todas as rotas protegidas requerem token válido
- **Autorização por usuário**: Cards só podem ser acessados/modificados pelo dono

---

## A02:2021 - Cryptographic Failures

### ✅ Implementado:
- **HTTPS forçado**: HSTS com 1 ano de duração, incluindo subdomínios
- **Senhas com bcrypt**: Hash com custo 12
- **JWT seguro**: Secret de 64 caracteres, expiração em 24h
- **Tokens de reset seguros**: SHA-256 hash, expiração em 15 minutos

---

## A03:2021 - Injection

### ✅ Implementado:
- **Detecção de padrões suspeitos**: Middleware bloqueia tentativas de XSS/SQL injection
- **Validação de entrada**: express-validator em todas as rotas
- **Sanitização de email**: `normalizeEmail()` aplicado
- **Limite de payload**: 10KB máximo para requisições JSON
- **Sequelize ORM**: Queries parametrizadas, sem SQL raw

---

## A04:2021 - Insecure Design

### ✅ Implementado:
- **Rate limiting agressivo**:
  - Global: 100 req/15min
  - Login: 5 req/15min (skip em sucesso)
  - Register: 20 req/hora
  - Forgot Password: 3 req/hora
- **Account Lockout**: 5 tentativas falhas = bloqueio de 15 minutos
- **Logs de segurança**: Todas as tentativas de login são registradas

---

## A05:2021 - Security Misconfiguration

### ✅ Implementado:
- **Headers de segurança (Helmet)**:
  - `Content-Security-Policy`: Política restritiva
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`: Camera, mic, geolocation desabilitados
- **CORS restritivo**: Apenas origens permitidas
- **X-Powered-By removido**: Não expõe tecnologia

---

## A06:2021 - Vulnerable and Outdated Components

### Recomendações:
- Executar `npm audit` regularmente
- Manter dependências atualizadas
- Usar `npm audit fix` para correções automáticas

---

## A07:2021 - Identification and Authentication Failures

### ✅ Implementado:
- **Senha forte obrigatória**: Mín. 8 chars, maiúscula, minúscula, número
- **Account lockout**: Bloqueio após 5 tentativas falhas
- **Tokens JWT seguros**: Expiração, verificação de assinatura
- **OAuth seguro**: State validation, email verification required
- **Password reset seguro**: Token único, expira em 15min, uso único

---

## A08:2021 - Software and Data Integrity Failures

### ✅ Implementado:
- **Validação de state OAuth**: Previne CSRF em fluxos de autenticação
- **Verificação de email Google**: Só aceita emails verificados

---

## A09:2021 - Security Logging and Monitoring

### ✅ Implementado:
- **Winston logger**: Logs estruturados com níveis
- **Logs de segurança**:
  - Tentativas de login (sucesso/falha)
  - Account lockouts
  - Requisições suspeitas bloqueadas
  - Erros de autenticação
  - CORS bloqueados
- **Request ID**: Rastreabilidade de requisições

---

## A10:2021 - Server-Side Request Forgery

### ✅ Implementado:
- **URLs controladas**: Apenas endpoints Google OAuth predefinidos
- **Validação de redirect**: Whitelist de URLs permitidas

---

## Configuração de Rate Limits

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Global | 100 | 15 min |
| Login | 5 | 15 min |
| Register | 20 | 1 hora |
| Forgot Password | 3 | 1 hora |
| Google OAuth | 10 | 15 min |

---

## Variáveis de Ambiente Sensíveis

```env
JWT_SECRET=<64+ caracteres aleatórios>
GOOGLE_CLIENT_SECRET=<secret do Google Cloud>
AWS_SECRET_ACCESS_KEY=<secret da AWS>
DATABASE_URL=<string de conexão com senha>
```

⚠️ **NUNCA** commitar arquivos `.env` com secrets reais!

---

## Checklist de Deploy

- [ ] Verificar que `.env` está no `.gitignore`
- [ ] Usar HTTPS em produção
- [ ] Configurar variáveis de ambiente no Render/Vercel
- [ ] Executar `npm audit` antes do deploy
- [ ] Verificar logs após deploy
- [ ] Testar rate limiting em produção

---

## Monitoramento Recomendado

1. **Alertas para**:
   - Múltiplos account lockouts do mesmo IP
   - Picos de requisições 429 (rate limit)
   - Erros 500 frequentes
   - Tentativas de login falhas em massa

2. **Métricas a acompanhar**:
   - Taxa de sucesso de login
   - Tempo de resposta das APIs
   - Uso de memória/CPU
   - Erros por endpoint

---

*Última atualização: Novembro 2025*
