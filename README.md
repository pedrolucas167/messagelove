# MessageLove 💝

![GitHub last commit](https://img.shields.io/github/last-commit/pedrolucas167/messagelove?style=for-the-badge&color=e74c3c)
![Repo size](https://img.shields.io/github/repo-size/pedrolucas167/messagelove?style=for-the-badge&color=8e44ad)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)

> Uma plataforma completa para criar e compartilhar mensagens personalizadas e memoráveis para momentos especiais. 🥰

---

## ✨ Funcionalidades

- **Autenticação Segura:** Sistema de registro e login com senhas criptografadas (`bcrypt`) e tokens de sessão (`JWT`).
- **Dashboard Pessoal:** Painel exclusivo para cada usuário visualizar e gerenciar suas memórias criadas.
- **Cartões 100% Personalizáveis:** Adicione destinatário, mensagem, data do relacionamento, fotos e músicas personalizadas.
- **Upload Seguro de Fotos:** Imagens armazenadas na **AWS S3** com processamento via `Sharp` para otimização.
- **Integração com Músicas:** Adicione trilha sonora às suas memórias.
- **Contador de Tempo Real:** Mostra há quanto tempo vocês estão juntos (anos, meses, dias).
- **Preview em Tempo Real:** Visualize o cartão enquanto o cria no formato de celular.
- **Links Únicos e Compartilháveis:** Cada memória tem um URL único para fácil compartilhamento.
- **Internacionalização (i18n):** Suporte a 5 idiomas: 🇧🇷 Português, 🇺🇸 English, 🇪🇸 Español, 🇮🇳 हिन्दी, 🇸🇦 العربية (com RTL).
- **Design Responsivo:** Interface moderna e adaptável a qualquer dispositivo.

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

#### Recursos do Frontend
- ⚡ **Turbopack** para desenvolvimento ultra-rápido
- 🌍 **Sistema de tradução customizado** com `useSyncExternalStore`
- 📱 **Preview em tempo real** estilo celular
- 🎭 **Animações CSS** personalizadas
- 🔐 **API Routes** para autenticação e gerenciamento de cards

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
│   │   ├── lib/             # Utilitários (translations, hooks)
│   │   └── server/          # Server-side (models, services)
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

<div align="center">

Feito com 💝 por [**Pedro Marques**](https://pedrolucas167.github.io/portfolio/)

</div>
