/**
 * Configuration file to provide fallback environment variables
 * when .env files cannot be loaded due to permissions.
 */

export const envConfig = {
    PORT: '3001',
    NODE_ENV: 'development',
    FRONTEND_URL: 'http://localhost:5173',

    // Vercel Postgres Database Credentials
    POSTGRES_URL: 'postgresql://neondb_owner:npg_MnwqOiXUps71@ep-dawn-mode-ahfkql3j-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    POSTGRES_PRISMA_URL: 'postgresql://neondb_owner:npg_MnwqOiXUps71@ep-dawn-mode-ahfkql3j-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require',
    POSTGRES_URL_NON_POOLING: 'postgresql://neondb_owner:npg_MnwqOiXUps71@ep-dawn-mode-ahfkql3j.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    POSTGRES_USER: 'neondb_owner',
    POSTGRES_HOST: 'ep-dawn-mode-ahfkql3j-pooler.c-3.us-east-1.aws.neon.tech',
    POSTGRES_PASSWORD: 'npg_MnwqOiXUps71',
    POSTGRES_DATABASE: 'neondb',

    // JWT Secret
    JWT_SECRET: '1a9a930c3f314e5feeaea6ea8dc88be6d8ae191fccb6bb9052ab8244e72ae6b5',

    // AI API Keys
    GEMINI_API_KEY: 'AIzaSyCf4cfy76KcQR4M8-2DBpgjqi5Ug_HcGDo',

};

// Apply to process.env if not set
Object.entries(envConfig).forEach(([key, value]) => {
    if (!process.env[key]) {
        process.env[key] = value;
    }
});
