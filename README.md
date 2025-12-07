# MessageLove 💝

![GitHub last commit](https://img.shields.io/github/last-commit/pedrolucas167/messagelove?style=for-the-badge&color=e74c3c)
![Repo size](https://img.shields.io/github/repo-size/pedrolucas167/messagelove?style=for-the-badge&color=8e44ad)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Jest](https://img.shields.io/badge/Jest-29-C21325?style=for-the-badge&logo=jest)
![Tests](https://img.shields.io/badge/Tests-68%20passing-success?style=for-the-badge)

> A complete platform to create and share personalized, memorable messages for special moments. 🥰

---

## ✨ Features

### 🔐 Authentication
- **Registration and Login** with encrypted passwords (`bcrypt`) and session tokens (`JWT`)
- **Google OAuth 2.0 Login** - Simplified authentication via Google account
- **Password Recovery** - Complete reset system via email

### 📝 Card Creation
- **100% Customizable Cards** - Recipient, message, relationship date
- **Photo Upload** - Images stored on **AWS S3** with optimization via `Sharp`
- **Music Integration** - Add a soundtrack to your memories
- **🎙️ Voice Messages** - Record personal audio up to 60 seconds
- **Animated GIFs** - Add animated visual elements
- **Cute Animals** - Select adorable illustrations
- **Interactive Elements** - Hearts, confetti, stars, and more

### 📱 User Experience
- **Real-Time Preview** - View the card in phone format while creating
- **Time Counter** - Shows how long you've been together
- **Personal Dashboard** - Manage all your memories

### 🔗 Sharing
- **Unique Links** - Each memory has a unique URL
- **QR Code** - Generate QR Codes for easy sharing
- **Copy Link** - Quick copy button with visual feedback

### 🌍 Internationalization
- **5 Languages:** 🇧🇷 Português, 🇺🇸 English, 🇪🇸 Español, 🇮🇳 हिन्दी, 🇸🇦 العربية
- **RTL Support** - Adaptable layout for right-to-left languages

### 📐 Design
- **Responsive** - Interface adaptable to any device
- **Dark/Light Theme** - Automatic adaptation to system preferences
- **Smooth Animations** - Elegant transitions and visual effects

---

## 🛠️ Tech Stack

The project uses a modern **monorepo** architecture with clear separation between **Frontend** and **Backend**, both in **TypeScript**.

### 🎨 Frontend

| Technology | Version | Description |
|------------|---------|-------------|
| **Next.js** | 16.0.4 | React Framework with App Router and Turbopack |
| **React** | 19.2.0 | Library for reactive interfaces |
| **TypeScript** | 5.x | Static typing for JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **date-fns** | 4.1.0 | Date manipulation and formatting |
| **Zod** | 3.23.8 | Schema validation |
| **Sharp** | 0.34.2 | Image processing |

#### 🧪 Testing

| Technology | Version | Description |
|------------|---------|-------------|
| **Jest** | 29.x | JavaScript testing framework |
| **Testing Library** | 16.x | Testing utilities for React |
| **jest-environment-jsdom** | 29.x | DOM environment for tests |

#### Frontend Features
- ⚡ **Turbopack** for ultra-fast development
- 🌍 **Custom translation system** with `useSyncExternalStore`
- 📱 **Real-time preview** in phone style
- 🎭 **Custom CSS animations**
- 🔐 **API Routes** for authentication and card management
- 🔑 **Google OAuth 2.0** for simplified login
- 📊 **68 automated tests** covering translations, components, and logic

### ⚙️ Backend

| Technology | Version | Description |
|------------|---------|-------------|
| **Node.js** | 20.x | JavaScript runtime |
| **Express.js** | 4.21.2 | Minimalist web framework |
| **TypeScript** | 5.4.5 | Static typing |
| **Sequelize** | 6.37.7 | ORM for PostgreSQL |
| **PostgreSQL** | - | Relational database |

#### 🔐 Security

| Package | Function |
|---------|----------|
| `jsonwebtoken` | JWT tokens for authentication |
| `bcryptjs` | Password hashing |
| `helmet` | Secure HTTP headers |
| `cors` | Cross-origin access control |
| `express-rate-limit` | Brute force protection |
| `express-validator` | Validation and sanitization |
| `zod` | Schema validation |

#### 📦 Upload and Storage

| Package | Function |
|---------|----------|
| `@aws-sdk/client-s3` | AWS S3 integration |
| `multer` | Upload processing |
| `sharp` | Image optimization |

#### 📊 Observability

| Package | Function |
|---------|----------|
| `winston` | Logging system |
| `compression` | Response compression |

### 🗄️ Database

- **PostgreSQL** hosted on Render
- **Sequelize ORM** for migrations and models
- **Models:** User, Card, PasswordResetToken

### ☁️ Infrastructure

| Service | Use |
|---------|-----|
| **Vercel** | Frontend hosting |
| **Render** | Backend + PostgreSQL hosting |
| **AWS S3** | Image storage |

---

## 📁 Project Structure

```
messagelove/
├── frontend/                 # Next.js 16 App
│   ├── src/
│   │   ├── app/             # App Router (pages, layouts, API routes)
│   │   │   └── api/         # API Routes (auth, cards)
│   │   ├── components/      # Reusable components
│   │   │   └── letter/      # Card creation components
│   │   ├── lib/             # Utilities (translations, hooks)
│   │   ├── server/          # Server-side (models, services)
│   │   └── __tests__/       # Jest tests
│   │       ├── utils/       # Utility tests
│   │       └── components/  # Component tests
│   └── public/              # Static assets
│
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── config/          # Configuration (logger)
│   │   ├── db/              # Sequelize (models, connection)
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── types/           # TypeScript definitions
│   └── migrations/          # Database migrations
│
└── public/                   # Static landing page (legacy)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- AWS account (for S3)

### Installation

```bash
# Clone the repository
git clone https://github.com/pedrolucas167/messagelove.git
cd messagelove

# Backend
cd backend
npm install
cp .env.example .env  # Configure variables
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 🧪 Running Tests

```bash
cd frontend

# Run all tests
npm test

# Watch mode (re-runs on save)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Environment Variables

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

## 🧪 Tests

The project has a comprehensive test suite with **68 automated tests**:

| Category | Tests | Description |
|----------|-------|-------------|
| **Translations** | 42 | Complete internationalization system |
| **ShareModal** | 6 | Sharing modal and QR Code |
| **HomePage** | 10 | Authentication logic and states |
| **InteractiveElements** | 10 | Animations and visual elements |

```bash
# Test results
Test Suites: 4 passed, 4 total
Tests:       68 passed, 68 total
```

---

## 🌍 Supported Languages

| Language | Code | Flag |
|----------|------|------|
| Portuguese (Brazil) | `pt` | 🇧🇷 |
| English | `en` | 🇺🇸 |
| Spanish | `es` | 🇪🇸 |
| Hindi | `hi` | 🇮🇳 |
| Arabic | `ar` | 🇸🇦 |

---

## 🔒 Security

This project follows security best practices:

- **OWASP Top 10** - Protection against common vulnerabilities
- **Rate Limiting** - Protection against brute force attacks
- **Helmet** - Secure HTTP headers
- **CORS** - Configured cross-origin access control
- **Input Validation** - Sanitization with Zod and express-validator
- **Hashed Passwords** - bcrypt with configurable salt rounds

To report vulnerabilities, see [SECURITY.md](./SECURITY.md).

---

## 📄 License

This project is under the MIT license.

---

<div align="center">

Made with 💝 by [**Pedro Marques**](https://pedrolucas167.github.io/portfolio/)

</div>
