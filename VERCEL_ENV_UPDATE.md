# Vercel Environment Variables Update Guide

## Your Deployment URL
**Production URL:** `https://price-me-six.vercel.app`

## Environment Variables to Update

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your **PriceMe** project
3. Go to **Settings** → **Environment Variables**
4. Update the following variables:

#### Update `FRONTEND_URL`
- **Current value:** (may be placeholder or empty)
- **New value:** `https://price-me-six.vercel.app`
- **Environment:** Select all (Production, Preview, Development)

#### Update `VITE_API_BASE_URL`
- **Current value:** (may be placeholder or empty)
- **New value:** `https://price-me-six.vercel.app/api`
- **Environment:** Select all (Production, Preview, Development)

5. After updating, **Redeploy**:
   - Go to **Deployments** tab
   - Click the **three dots (⋯)** on the latest deployment
   - Click **Redeploy**

### Option 2: Via Vercel CLI

If you prefer using CLI, first login:
```bash
vercel login
```

Then update variables:
```bash
# Update FRONTEND_URL
echo "https://price-me-six.vercel.app" | vercel env add FRONTEND_URL production
echo "https://price-me-six.vercel.app" | vercel env add FRONTEND_URL preview
echo "https://price-me-six.vercel.app" | vercel env add FRONTEND_URL development

# Update VITE_API_BASE_URL
echo "https://price-me-six.vercel.app/api" | vercel env add VITE_API_BASE_URL production
echo "https://price-me-six.vercel.app/api" | vercel env add VITE_API_BASE_URL preview
echo "https://price-me-six.vercel.app/api" | vercel env add VITE_API_BASE_URL development
```

Then redeploy:
```bash
vercel --prod
```

## Verify After Update

After redeploying, test these endpoints:

1. **Frontend:** https://price-me-six.vercel.app
2. **Backend Health Check:** https://price-me-six.vercel.app/api/health

The health endpoint should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

## Current Environment Variables Checklist

Make sure these are set:

- ✅ `POSTGRES_URL` (auto-added by Vercel Postgres)
- ✅ `POSTGRES_PRISMA_URL` (auto-added by Vercel Postgres)
- ✅ `POSTGRES_URL_NON_POOLING` (auto-added by Vercel Postgres)
- ✅ `POSTGRES_USER` (auto-added by Vercel Postgres)
- ✅ `POSTGRES_HOST` (auto-added by Vercel Postgres)
- ✅ `POSTGRES_PASSWORD` (auto-added by Vercel Postgres)
- ✅ `POSTGRES_DATABASE` (auto-added by Vercel Postgres)
- ✅ `NODE_ENV` = `production`
- ✅ `PORT` = `3001`
- ✅ `FRONTEND_URL` = `https://price-me-six.vercel.app` ⬅️ **UPDATE THIS**
- ✅ `JWT_SECRET` = (your generated secret)
- ✅ `VITE_API_BASE_URL` = `https://price-me-six.vercel.app/api` ⬅️ **UPDATE THIS**




