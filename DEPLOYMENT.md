# Deployment Guide

## Recommended Workflow: GitHub First, Then Vercel

The best practice is to **push to GitHub first**, then create the Vercel project and connect it. This ensures:
- Your code is backed up
- Vercel can automatically detect your project structure
- CI/CD workflows work immediately
- Easy rollback if needed

## Step-by-Step Deployment

### Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it `PriceMe` (or your preferred name)
   - Choose public or private
   - **Don't** initialize with README, .gitignore, or license (we already have these)

2. **Add files and commit:**
   ```bash
   git add .
   git commit -m "Initial setup: monorepo with React frontend and Node.js backend"
   ```

3. **Connect to GitHub and push:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/PriceMe.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

### Step 2: Create Vercel Postgres Database

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Sign in or create an account

2. **Create Postgres Database:**
   - Click on your profile → **Storage** tab
   - Click **Create Database**
   - Select **Postgres**
   - Choose a name (e.g., `priceme-db`)
   - Select a region (closest to your users)
   - Click **Create**

3. **Copy Connection Strings:**
   - After creation, you'll see connection details
   - Copy these values (you'll need them for local development)

### Step 3: Create Vercel Project

1. **Import GitHub Repository:**
   - In Vercel Dashboard, click **Add New** → **Project**
   - Import your `PriceMe` repository from GitHub
   - Vercel will auto-detect it's a monorepo

2. **Configure Project Settings:**

   **Root Directory:** Leave as root (`.`)

   **Build Settings:**
   - **Framework Preset:** Other
   - The `vercel.json` file will handle routing

3. **Add Environment Variables:**

   Click **Environment Variables** and add:

   **For Production, Preview, and Development:**
   ```
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-app.vercel.app
   ```

   **Database variables** (from Step 2):
   ```
   POSTGRES_URL=your_postgres_url
   POSTGRES_PRISMA_URL=your_prisma_url
   POSTGRES_URL_NON_POOLING=your_non_pooling_url
   POSTGRES_USER=your_user
   POSTGRES_HOST=your_host
   POSTGRES_PASSWORD=your_password
   POSTGRES_DATABASE=your_database
   ```

   **JWT Secret:**
   ```
   JWT_SECRET=generate-a-strong-random-string-here
   ```

   **Frontend variable:**
   ```
   VITE_API_BASE_URL=https://your-app.vercel.app/api
   ```

   > **Note:** Generate a strong JWT secret:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > ```

4. **Deploy:**
   - Click **Deploy**
   - Vercel will build and deploy your application
   - The first deployment may take a few minutes

### Step 4: Verify Deployment

1. **Check Deployment:**
   - Once deployed, Vercel will provide URLs:
     - Production: `https://your-app.vercel.app`
     - Frontend should be accessible
     - Backend API: `https://your-app.vercel.app/api`

2. **Test Health Endpoint:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Initialize Database:**
   - The database tables will be created automatically on first API call
   - Or trigger manually by calling any API endpoint

## Alternative: Create Vercel Project First

If you prefer to create the Vercel project first:

1. Create an empty Vercel project
2. Create the Postgres database
3. Push your code to GitHub
4. Connect the GitHub repo to the Vercel project
5. Configure environment variables
6. Deploy

However, this workflow is less streamlined and may require manual configuration.

## Post-Deployment Checklist

- [ ] Database tables created successfully
- [ ] Frontend loads correctly
- [ ] Backend API responds to health check
- [ ] Environment variables are set correctly
- [ ] GitHub Actions CI/CD is working
- [ ] Custom domain configured (optional)

## Troubleshooting

### Database Connection Issues
- Verify all Postgres environment variables are set correctly
- Check that the database is in the same region as your Vercel project
- Ensure connection strings are copied exactly

### Build Failures
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles without errors locally first

### API Routes Not Working
- Verify `vercel.json` routing configuration
- Check that backend routes are prefixed with `/api`
- Ensure Express server is configured correctly

## Next Steps

After successful deployment:
1. Set up authentication endpoints
2. Build product management features
3. Implement pricing algorithms
4. Add monitoring and analytics


