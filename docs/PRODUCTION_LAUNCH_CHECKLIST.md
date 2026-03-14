# Production Launch Checklist

Step-by-step checklist for going live. Work through each section in order.

---

## 1. Database (Neon / Vercel Postgres)

- [ ] Go to [neon.tech](https://neon.tech) (or Vercel Dashboard → Storage → Create Database)
- [ ] Create a new project — this is your **production** database
- [ ] Copy the **connection string** (`postgres://...`) — you'll need it as `POSTGRES_URL`
- [ ] **No manual schema setup needed** — tables are created automatically on first API startup via `initializeDatabase()`

> Optional: create a second Neon branch called `staging` for preview deploys (see `DEPLOYMENT_GUIDE.md` §2).

---

## 2. Google OAuth (Auth)

### Google Cloud Console
- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create a project (or reuse the one from dev)
- [ ] **APIs & Services → OAuth consent screen**
  - Set app name, support email
  - Scopes: `email`, `profile`, `openid` (no sensitive scopes needed)
  - Click **"Publish App"** (moves from Testing → Production so all users can sign in)
- [ ] **APIs & Services → Credentials → Create → OAuth 2.0 Client ID**
  - Type: Web application
  - Authorized redirect URIs — add **both**:
    ```
    http://localhost:3001/api/auth/google/callback
    https://price-me-api.vercel.app/api/auth/google/callback
    ```
- [ ] Copy **Client ID** and **Client Secret**

---

## 3. Vercel — API Project Environment Variables

Go to Vercel → your **API project** → Settings → Environment Variables. Set these for **Production**:

| Variable | Value |
|---|---|
| `POSTGRES_URL` | Connection string from Neon (step 1) |
| `JWT_SECRET` | A strong random string (use `openssl rand -hex 32`) |
| `FRONTEND_URL` | Your frontend prod URL (e.g. `https://price-me.vercel.app`) |
| `GEMINI_API_KEY` | Your Gemini API key (already set if existing) |
| `GOOGLE_CLIENT_ID` | From step 2 |
| `GOOGLE_CLIENT_SECRET` | From step 2 |
| `GOOGLE_CALLBACK_URL` | `https://price-me-api.vercel.app/api/auth/google/callback` |
| `NODE_ENV` | `production` |

> Generate a strong JWT secret: run `openssl rand -hex 32` in your terminal.

---

## 4. Vercel — Frontend Project Environment Variables

Go to Vercel → your **frontend (web) project** → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://price-me-api.vercel.app` |
| `VITE_POSTHOG_KEY` | Your PostHog key (if using analytics) |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` |

---

## 5. Deploy

- [ ] Merge `feat/google-auth` into `main`
- [ ] Push `main` — Vercel auto-deploys both projects
- [ ] **Verify DB migration ran**: check API logs in Vercel → your API project → Deployments → Functions → View logs. You should see `✅ Database tables initialized successfully`

---

## 6. Smoke Test (after deploy)

- [ ] Visit your frontend prod URL → `/login` page loads
- [ ] "Continue with Google" button redirects to Google consent
- [ ] After consent → lands on dashboard (logged in)
- [ ] Email/password login still works
- [ ] Visit `/signup` → Google button works there too
- [ ] Try signing in with a Google account that matches an existing email → accounts link correctly (no duplicate)

---

## 7. Quick Reference — env vars per environment

| Var | Local dev (`.env.local`) | Production (Vercel) |
|---|---|---|
| `POSTGRES_URL` | Local/Neon dev connection string | Neon prod connection string |
| `JWT_SECRET` | Any string | Strong random secret |
| `FRONTEND_URL` | `http://localhost:5173` | `https://your-frontend.vercel.app` |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/auth/google/callback` | `https://price-me-api.vercel.app/api/auth/google/callback` |
| `GEMINI_API_KEY` | Dev key | Prod key (can be same) |
