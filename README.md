# PriceMe

A SaaS pricing tool for product listings that helps users create accounts, manage product listings, and use intelligent pricing algorithms to price their products.

## Project Overview

PriceMe is a full-stack web application built with modern technologies to provide a clean, responsive interface for product pricing management. The application features user authentication, product management, and AI-powered pricing calculations.

## Technology Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **ShadCN UI** for beautiful, accessible components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** + **Zod** for form handling and validation
- **Axios** for API communication

### Backend
- **Node.js** with **TypeScript**
- **Express** web framework
- **Vercel Postgres** (Neon) for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Zod** for validation

### Infrastructure
- **Vercel** for hosting and database
- **GitHub Actions** for CI/CD
- **npm workspaces** for monorepo management

## Project Structure

```
PriceMe/
├── apps/
│   ├── web/              # React frontend application
│   │   ├── src/
│   │   │   ├── components/  # React components (ShadCN + custom)
│   │   │   ├── pages/       # Page components
│   │   │   ├── lib/         # Utilities, API client
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── types/       # TypeScript types
│   │   │   └── App.tsx
│   │   └── package.json
│   └── api/              # Node.js backend API
│       ├── src/
│       │   ├── routes/      # API route handlers
│       │   ├── controllers/ # Business logic
│       │   ├── services/     # Service layer (calculations, AI)
│       │   ├── models/       # Database models
│       │   ├── middleware/   # Auth, validation, etc.
│       │   ├── utils/        # Utilities (database, etc.)
│       │   └── server.ts     # Entry point
│       └── package.json
├── packages/
│   └── shared/           # Shared types and utilities
│       └── src/
│           ├── types/        # Shared TypeScript types
│           └── schemas/      # Shared Zod validation schemas
├── .github/
│   └── workflows/        # CI/CD workflows
├── .env.example          # Environment variables template
├── package.json          # Root workspace configuration
└── README.md
```

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Vercel account** (for database and hosting)
- **GitHub account** (for CI/CD)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PriceMe
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Set Up Environment Variables

#### Frontend (`apps/web/.env`)

Create `apps/web/.env` file:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

#### Backend (`apps/api/.env`)

Create `apps/api/.env` file:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (Vercel Postgres)
# Get these from your Vercel dashboard after creating a Postgres database
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_prisma_url_here
POSTGRES_URL_NON_POOLING=your_non_pooling_url_here
POSTGRES_USER=your_user_here
POSTGRES_HOST=your_host_here
POSTGRES_PASSWORD=your_password_here
POSTGRES_DATABASE=your_database_here

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI Service API Keys (if needed)
OPENAI_API_KEY=your_openai_key_here
```

### 4. Set Up Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to the Storage tab
4. Create a new Postgres database
5. Copy the connection strings and environment variables
6. Add them to your `apps/api/.env` file

### 5. Initialize Database Schema

The database schema will be automatically initialized when you start the backend server for the first time. The initialization creates the following tables:

- `users` - User accounts and authentication
- `products` - Product listings
- `pricing_data` - Pricing calculations and results

### 6. Start Development Servers

From the root directory:

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start them separately:
npm run dev:web  # Frontend only (http://localhost:5173)
npm run dev:api  # Backend only (http://localhost:3001)
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3001`.

## Development Workflow

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Type check all TypeScript files

#### Frontend (`apps/web`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend (`apps/api`)
- `npm run dev` - Start server with hot reload (tsx watch)
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

- **TypeScript** strict mode is enabled across all packages
- **ESLint** is configured for both frontend and backend
- **Prettier** is configured for consistent code formatting
- Pre-commit hooks can be added using Husky (optional)

### Adding ShadCN UI Components

To add new ShadCN UI components:

```bash
cd apps/web
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
```

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Hashed password
- `name` - User's name (optional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Products Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `name` - Product name
- `description` - Product description (optional)
- `category` - Product category (optional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Pricing Data Table
- `id` - Primary key
- `product_id` - Foreign key to products table
- `price` - Calculated price
- `currency` - Currency code (default: USD)
- `calculation_method` - Method used for calculation
- `calculation_data` - JSONB field for calculation metadata
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - **Frontend**: Root directory `apps/web`, Build command `npm run build`, Output directory `dist`
   - **Backend**: Root directory `apps/api`, Build command `npm run build`
3. Add environment variables in Vercel dashboard
4. Deploy!

The `vercel.json` file is configured to handle routing between frontend and backend.

### Environment Variables in Vercel

Add all environment variables from `apps/api/.env.example` to your Vercel project settings. Vercel will automatically provide Postgres connection strings when you add a Postgres database to your project.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The workflow:
1. Lints all code
2. Type checks all TypeScript files
3. Builds frontend and backend

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run `npm run lint` and `npm run type-check`
4. Run `npm run format` to format code
5. Submit a pull request

## Next Steps

This is the initial setup. Next steps include:
- Implementing authentication (login/register)
- Building product management UI
- Implementing pricing algorithms
- Adding AI-powered pricing suggestions
- Building user dashboard
- Adding analytics and reporting

## License

[Add your license here]

## Support

[Add support information here]

