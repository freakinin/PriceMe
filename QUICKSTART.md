# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Set up environment variables:**
   - Copy `.env.example` files to `.env` files in `apps/web` and `apps/api`
   - Fill in your Vercel Postgres credentials

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

## Common Commands

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all packages
- `npm run lint` - Lint all code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check all TypeScript

## Adding ShadCN Components

```bash
cd apps/web
npx shadcn@latest add [component-name]
```

## Project Structure

- `apps/web` - React frontend
- `apps/api` - Node.js backend
- `packages/shared` - Shared types and schemas

## Next Steps

1. Set up Vercel Postgres database
2. Configure environment variables
3. Start building features!



