# Local Development Setup

## Quick Start

### 1. Pull Environment Variables from Vercel (Recommended)

If you have Vercel CLI installed and linked:

```bash
# From project root
vercel env pull .env.local
```

This will create `.env.local` files with your Vercel environment variables.

### 2. Or Set Up Manually

#### Frontend (`apps/web/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

#### Backend (`apps/api/.env.local`)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database - Copy from Vercel Dashboard -> Storage -> Your Database
POSTGRES_URL=your_postgres_url_from_vercel
POSTGRES_PRISMA_URL=your_prisma_url_from_vercel
POSTGRES_URL_NON_POOLING=your_non_pooling_url_from_vercel
POSTGRES_USER=your_user_from_vercel
POSTGRES_HOST=your_host_from_vercel
POSTGRES_PASSWORD=your_password_from_vercel
POSTGRES_DATABASE=your_database_from_vercel

# JWT Secret (use same as Vercel or generate new)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Install Dependencies (if not already done)

```bash
npm install --legacy-peer-deps
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:web   # Frontend only (http://localhost:5173)
npm run dev:api   # Backend only (http://localhost:3001)
```

### 5. Access Your App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Getting Database Credentials from Vercel

1. Go to https://vercel.com/dashboard
2. Select your **PriceMe** project
3. Go to **Storage** tab
4. Click on your Postgres database
5. Go to **.env.local** tab
6. Copy the connection strings to your `apps/api/.env.local` file

## Troubleshooting

### Database Connection Issues
- Make sure you've copied all Postgres environment variables
- Verify the database is accessible (check Vercel dashboard)
- The database tables will be created automatically on first API call

### Port Already in Use
- Change `PORT` in `apps/api/.env.local` to a different port (e.g., 3002)
- Update `VITE_API_BASE_URL` in `apps/web/.env.local` to match

### CORS Issues
- Make sure `FRONTEND_URL` in backend matches your frontend URL
- Default is `http://localhost:5173` for Vite

## Next Steps

Once local development is running:
1. Start building authentication features
2. Create product management UI
3. Implement pricing algorithms
4. Add AI-powered pricing suggestions




