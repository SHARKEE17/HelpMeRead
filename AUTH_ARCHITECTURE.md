# Authentication Architecture & Usage

## Overview
This project implements a modern, secure authentication system primarily based on **Passkeys (WebAuthn)**, with a robust Email/Password fallback. It separates concerns between a React frontend and an Express backend, using secure cookies and short-lived tokens for session management.

## 🏗️ Architecture

### Backend (`/backend`)
*   **Core**: Express.js with TypeScript.
*   **Security**:
    *   **Passkeys**: Uses `@simplewebauthn/server` to handle FIDO2 ceremonies (registration/authentication).
    *   **Passwords**: Uses `bcryptjs` for secure hashing.
    *   **Cookies**: Refresh tokens are stored in `httpOnly`, `secure` (in prod), `sameSite` cookies to prevent XSS theft.
    *   **JWT**: Short-lived `accessToken` (15m) for API authorization, Long-lived `refreshToken` (7d) for session persistence.
*   **Storage**: 
    *   Currently uses an **In-Memory User Store** (`auth.storage.ts`) to ensure the project works immediately without external database dependencies. 
    *   *Ready to scale*: The `UserModel` interface is designed to be easily swapped with MongoDB `Mongoose` or Postgres `Prisma`.

### Frontend (`/frontend`)
*   **State Management**: `AuthContext` provides global user state (`user`, `isAuthenticated`) and methods (`login`, `signup`, `logout`).
*   **API Client**: `axios` instance configured with credentials (cookies) and an **Auto-Refresh Interceptor**. If an API call fails with `401`, it transparently attempts to refresh the token and retry the request.
*   **Routing**: Protected routes wrap sensitive pages (like `/dashboard`), redirecting unauthenticated users to `/login`.

## 📂 Folder Structure
```
root
├── backend/
│   ├── src/
│   │   ├── auth/              # Auth Module
│   │   │   ├── auth.controller.ts  # Route Handlers
│   │   │   ├── auth.service.ts     # Business Logic (WebAuthn/JWT)
│   │   │   ├── auth.middleware.ts  # JWT Verification
│   │   │   └── auth.storage.ts     # Database Adapter (Mock)
│   │   └── index.ts           # Server Entry
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── auth.ts        # API Client & WebAuthn SDK wrappers
    │   ├── components/
    │   │   └── Auth/
    │   │       └── Login.tsx  # Unified Login/Signup UI
    │   ├── context/
    │   │   └── AuthContext.tsx # Global Auth State
    │   └── App.tsx            # Routes & Protection Logic
```

## 🚀 How to Run

### 1. Start the Backend
```bash
cd backend
npm install
npm run build
npm start
# Server running at localhost:3001
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# App running at localhost:3000
```

### 3. Usage
1.  Open `http://localhost:3000`.
2.  Click **"Get Started"** -> Redirects to Login.
3.  **Sign Up**:
    *   Select **Passkey** tab (Recommended).
    *   Enter email -> "Register with Passkey".
    *   Follow browser prompt (TouchID / FaceID / PIN).
4.  **Dashboard**: You are now logged in! Refresh the page to verify session persistence.

## 🔐 Key Decisions
*   **Why Passkeys?** Phishing-resistant, better UX than passwords.
*   **Why httpOnly Cookies?** Prevents JavaScript (XSS attacks) from stealing the long-lived refresh token.
*   **Why In-Memory DB?** To provide a friction-free "clone and run" experience for this demo.
