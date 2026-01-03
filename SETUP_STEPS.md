# Step-by-Step Local Development Setup

## Step 1: Get Database Credentials

1. Go to: https://vercel.com/dashboard
2. Click your **PriceMe** project
3. Click **Storage** tab
4. Click your **Postgres database**
5. Click **.env.local** tab
6. Copy all the connection strings

## Step 2: Create Backend .env.local File

Create file: `apps/api/.env.local`

Paste this template and fill in your values:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

POSTGRES_URL=paste_your_value_here
POSTGRES_PRISMA_URL=paste_your_value_here
POSTGRES_URL_NON_POOLING=paste_your_value_here
POSTGRES_USER=paste_your_value_here
POSTGRES_HOST=paste_your_value_here
POSTGRES_PASSWORD=paste_your_value_here
POSTGRES_DATABASE=paste_your_value_here

JWT_SECRET=1a9a930c3f314e5feeaea6ea8dc88be6d8ae191fccb6bb9052ab8244e72ae6b5
```

## Step 3: Start Development

Run this command:
```bash
npm run dev
```

## Step 4: Test

- Frontend: http://localhost:5173
- Backend: http://localhost:3001/health

