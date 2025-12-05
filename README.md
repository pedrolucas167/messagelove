# MessageLove 💝

![GitHub last commit](https://img.shields.io/github/last-commit/pedrolucas167/messagelove?style=for-the-badge&color=e74c3c)
![Repo size](https://img.shields.io/github/repo-size/pedrolucas167/messagelove?style=for-the-badge&color=8e44ad)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Jest](https://img.shields.io/badge/Jest-29-C21325?style=for-the-badge&logo=jest)
![Tests](https://img.shields.io/badge/Tests-68%20passing-success?style=for-the-badge)

> Uma plataforma completa para criar e compartilhar mensagens personalizadas e memoráveis para momentos especiais. 🥰

---

## ✨ Funcionalidades

### 🔐 Autenticação
- **Registro e Login** com senhas criptografadas (`bcrypt`) e tokens de sessão (`JWT`)
- **Login com Google OAuth 2.0** - Autenticação simplificada via conta Google
- **Recuperação de Senha** - Sistema completo de reset via email

### 📝 Criação de Cartões
- **Cartões 100% Personalizáveis** - Destinatário, mensagem, data do relacionamento
- **Upload de Fotos** - Imagens armazenadas na **AWS S3** com otimização via `Sharp`
- **Integração com Músicas** - Adicione trilha sonora às suas memórias
- **GIFs Animados** - Adicione elementos visuais animados
- **Animais Fofos** - Selecione ilustrações adoráveis
- **Elementos Interativos** - Corações, confetes, estrelas e mais

### 📱 Experiência do Usuário
- **Preview em Tempo Real** - Visualize o cartão no formato de celular enquanto cria
- **Contador de Tempo** - Mostra há quanto tempo vocês estão juntos
- **Dashboard Pessoal** - Gerencie todas as suas memórias

### 🔗 Compartilhamento
- **Links Únicos** - Cada memória tem um URL único
- **QR Code** - Gere QR Codes para compartilhar facilmente
- **Copiar Link** - Botão de cópia rápida com feedback visual

### 🌍 Internacionalização
- **5 Idiomas:** 🇧🇷 Português, 🇺🇸 English, 🇪🇸 Español, 🇮🇳 हिन्दी, 🇸🇦 العربية
- **Suporte RTL** - Layout adaptável para idiomas da direita para esquerda

### 📐 Design
- **Responsivo** - Interface adaptável a qualquer dispositivo
- **Tema Escuro/Claro** - Adaptação automática às preferências do sistema
- **Animações Suaves** - Transições e efeitos visuais elegantes

---

## 🛠️ Stack Tecnológica

O projeto utiliza uma arquitetura **monorepo** moderna com separação clara entre **Frontend** e **Backend**, ambos em **TypeScript**.

### 🎨 Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Next.js** | 16.0.4 | Framework React com App Router e Turbopack |
| **React** | 19.2.0 | Biblioteca para interfaces reativas |
| **TypeScript** | 5.x | Tipagem estática para JavaScript |
| **Tailwind CSS** | 4.x | Framework CSS utility-first |
| **date-fns** | 4.1.0 | Manipulação e formatação de datas |
| **Zod** | 3.23.8 | Validação de schemas |
| **Sharp** | 0.34.2 | Processamento de imagens |

#### 🧪 Testes

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Jest** | 29.x | Framework de testes JavaScript |
| **Testing Library** | 16.x | Utilitários de teste para React |
| **jest-environment-jsdom** | 29.x | Ambiente DOM para testes |

#### Recursos do Frontend
- ⚡ **Turbopack** para desenvolvimento ultra-rápido
- 🌍 **Sistema de tradução customizado** com `useSyncExternalStore`
- 📱 **Preview em tempo real** estilo celular
- 🎭 **Animações CSS** personalizadas
- 🔐 **API Routes** para autenticação e gerenciamento de cards
- 🔑 **Google OAuth 2.0** para login simplificado
- 📊 **68 testes automatizados** cobrindo traduções, componentes e lógica

### ⚙️ Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 20.x | Runtime JavaScript |
| **Express.js** | 4.21.2 | Framework web minimalista |
| **TypeScript** | 5.4.5 | Tipagem estática |
| **Sequelize** | 6.37.7 | ORM para PostgreSQL |
| **PostgreSQL** | - | Banco de dados relacional |

#### 🔐 Segurança

| Pacote | Função |
|--------|--------|
| `jsonwebtoken` | Tokens JWT para autenticação |
| `bcryptjs` | Hash de senhas |
| `helmet` | Headers HTTP seguros |
| `cors` | Controle de acesso cross-origin |
| `express-rate-limit` | Proteção contra brute force |
| `express-validator` | Validação e sanitização |
| `zod` | Validação de schemas |

#### 📦 Upload e Storage

| Pacote | Função |
|--------|--------|
| `@aws-sdk/client-s3` | Integração com AWS S3 |
| `multer` | Processamento de uploads |
| `sharp` | Otimização de imagens |

#### 📊 Observabilidade

| Pacote | Função |
|--------|--------|
| `winston` | Sistema de logging |
| `compression` | Compressão de respostas |

### 🗄️ Banco de Dados

- **PostgreSQL** hospedado no Render
- **Sequelize ORM** para migrations e models
- **Modelos:** User, Card, PasswordResetToken

### ☁️ Infraestrutura

| Serviço | Uso |
|---------|-----|
| **Vercel** | Hospedagem do Frontend |
| **Render** | Hospedagem do Backend + PostgreSQL |
| **AWS S3** | Armazenamento de imagens |

---

## 📁 Estrutura do Projeto

```
messagelove/
├── frontend/                 # Next.js 16 App
│   ├── src/
│   │   ├── app/             # App Router (pages, layouts, API routes)
│   │   │   └── api/         # API Routes (auth, cards)
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   └── letter/      # Componentes de criação de cartão
│   │   ├── lib/             # Utilitários (translations, hooks)
│   │   ├── server/          # Server-side (models, services)
│   │   └── __tests__/       # Testes Jest
│   │       ├── utils/       # Testes de utilitários
│   │       └── components/  # Testes de componentes
│   └── public/              # Assets estáticos
│
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── config/          # Configurações (logger)
│   │   ├── db/              # Sequelize (models, connection)
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Lógica de negócio
│   │   └── types/           # TypeScript definitions
│   └── migrations/          # Database migrations
│
└── public/                   # Landing page estática (legacy)
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+
- PostgreSQL
- Conta AWS (para S3)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/pedrolucas167/messagelove.git
cd messagelove

# Backend
cd backend
npm install
cp .env.example .env  # Configure as variáveis
npm run dev

# Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

### 🧪 Executar Testes

```bash
cd frontend

# Rodar todos os testes
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Com relatório de cobertura
npm run test:coverage
```

### Variáveis de Ambiente

#### Backend (.env)
```env
DATABASE_URL=postgres://user:pass@localhost:5432/messagelove
JWT_SECRET=your-secret-key-min-32-chars
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Frontend (.env.local)
```env
DATABASE_URL=postgres://user:pass@localhost:5432/messagelove
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🧪 Testes

O projeto possui uma suite de testes abrangente com **68 testes automatizados**:

| Categoria | Testes | Descrição |
|-----------|--------|-----------|
| **Traduções** | 42 | Sistema de internacionalização completo |
| **ShareModal** | 6 | Modal de compartilhamento e QR Code |
| **HomePage** | 10 | Lógica de autenticação e estados |
| **InteractiveElements** | 10 | Animações e elementos visuais |

```bash
# Resultado dos testes
Test Suites: 4 passed, 4 total
Tests:       68 passed, 68 total
```

---

## 🌍 Idiomas Suportados

| Idioma | Código | Flag |
|--------|--------|------|
| Português (Brasil) | `pt` | 🇧🇷 |
| English | `en` | 🇺🇸 |
| Español | `es` | 🇪🇸 |
| हिन्दी (Hindi) | `hi` | 🇮🇳 |
| العربية (Arabic) | `ar` | 🇸🇦 |

---

## 🔒 Segurança

Este projeto segue as melhores práticas de segurança:

- **OWASP Top 10** - Proteção contra vulnerabilidades comuns
- **Rate Limiting** - Proteção contra ataques de força bruta
- **Helmet** - Headers HTTP seguros
- **CORS** - Controle de acesso cross-origin configurado
- **Validação de Entrada** - Sanitização com Zod e express-validator
- **Senhas Hasheadas** - bcrypt com salt rounds configuráveis

Para reportar vulnerabilidades, veja [SECURITY.md](./SECURITY.md).

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

<div align="center">

Feito com 💝 por [**Pedro Marques**](https://pedrolucas167.github.io/portfolio/)

</div>
