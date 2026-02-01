# Deployment Guide for PriceMe

This guide covers how to separate your Staging (Preview) and Production environments using Vercel and Neon, ensuring your database and user authentication are safely isolated.

## 1. Vercel Configuration & Serverless API

We have configured the project to serve the Express API (`apps/api`) via Vercel Serverless Functions.
- **Entry Point**: `api/index.ts` (bridges to `apps/api/src/server.ts`)
- **Configuration**: `vercel.json` handles rewrites so `/api/*` requests go to the serverless function.

### Check Vercel Project Settings
Ensure your Vercel project is configured for a Monorepo:
- **Framework Preset**: Vite (should detect `apps/web` automatically or you can set it).
- **Root Directory**: `.` (Root) or `apps/web`? 
    - **Recommended**: Keep Root Directory as `.` (repo root) so Vercel can see `api/` folder and `apps/` workspaces.
    - **Build Command**: `cd apps/web && npm run build` (This is already in `vercel.json`, so you can just override "Output Directory" to `apps/web/dist` in project settings if strictly needed, but `vercel.json` handles it).

## 2. Neon Database Branching (Isolation)
To separate Production data from Staging data:

1.  **Go to Neon Console** > **Branches**.
2.  Your primary branch (e.g., `main`) is for **Production**.
3.  Create a new branch (e.g., `staging` or `preview`) for your **Preview** environments.
    - *Tip: Reset this branch from `main` periodically to test with fresh data.*
4.  Note down the **Connection String** for both branches.

## 3. Environment Variables (The Magic Glue)
In your Vercel Project Settings > **Environment Variables**, you need to define these variables for 3 environments: **Production**, **Preview**, and **Development**.

| Variable | Production Value | Preview (Staging) Value | Development (Local) |
|----------|------------------|-------------------------|---------------------|
| `POSTGRES_URL` | `postgres://...main...` (Neon Prod) | `postgres://...staging...` (Neon Staging) | `postgres://...local...` |
| `POSTGRES_...` | (Other Neon vars matching Prod) | (Other Neon vars matching Staging) | (Local) |
| `JWT_SECRET` | **STRONG_SECRET_PROD** | **DIFFERENT_SECRET_STAGING** | `local-secret` |
| `FRONTEND_URL` | `https://your-domain.com` | `https://your-project-git-feature.vercel.app` (or just leave empty to allow all Vercel preview URLs if using flexible CORS) | `http://localhost:5173` |
| `VERCEL` | `1` (Automatically set) | `1` | `0` |

### Important Notes:
- **Separate JWT Secrets**: This is critical. If you use the same secret, a token generated in Staging could technically be used to access Production if the user ID exists in both (though risk is lower with separate DBs, it's best practice).
- **CORS in Preview**: Vercel generates dynamic URLs for previews (e.g., `app-git-feature-xyz.vercel.app`).
    - Update `apps/api/src/server.ts` CORS logic if you face issues multiple preview domains. Currently it accepts `FRONTEND_URL`. You might want to allow an array of domains or regex `/\.vercel\.app$/` for Previews.

## 4. User Management
Because you are using different Databases (via Neon branches):
- **Users are separate**: A user created on the specific Preview URL will exists ONLY in the Staging Neon branch. They cannot log in to Production with those credentials.
- **Testing**: This allows you to safely test "Delete Account" or "Reset Password" features on Staging without fear of affecting real users.

## 5. Deployment Workflow
1.  **Push to `main`**: Deploys to Production (Connected to Neon `main` DB).
2.  **Pull Request**: Vercel creates a Preview Deployment (Connected to Neon `staging` DB).
3.  **Merge**: Updates Production.
