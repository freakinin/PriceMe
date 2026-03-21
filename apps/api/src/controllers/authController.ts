import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../utils/db.js';
import { z } from 'zod';
import { NotionSyncJob } from '../jobs/notionSync.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helpers read at call time (after dotenv has loaded)
const getGoogleClient = () => new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
);

const VALID_PLANS = ['free', 'starter', 'growth', 'pro'] as const;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  plan: z.enum(VALID_PLANS).optional().default('free'),
  promo_code: z.string().optional(),
});

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createUserSchema.parse(req.body);
    const { email, password, name, plan: requestedPlan, promo_code } = validatedData;

    // Check if user already exists
    const existingUserResult = await db`
      SELECT id FROM users WHERE email = ${email}
    `;

    const existingUsers = Array.isArray(existingUserResult) ? existingUserResult : existingUserResult.rows || [];
    if (existingUsers.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
      });
    }

    // If a promo code was provided, atomically claim a spot
    let finalPlan = requestedPlan;
    let trialEndsAt: Date | null = null;
    let usedPromoCode: string | null = null;

    if (promo_code) {
      const code = promo_code.toUpperCase();
      const promoResult = await db`
        UPDATE promo_codes
        SET used_count = used_count + 1
        WHERE code = ${code} AND active = true AND used_count < max_uses
        RETURNING plan, duration_months
      `;
      const promoRows = Array.isArray(promoResult) ? promoResult : (promoResult as any).rows ?? [];
      if (promoRows.length === 0) {
        return res.status(400).json({
          status: 'error',
          code: 'PROMO_EXHAUSTED',
          message: 'All free spots have been taken.',
        });
      }
      finalPlan = promoRows[0].plan as typeof VALID_PLANS[number];
      const months: number = promoRows[0].duration_months;
      trialEndsAt = new Date();
      trialEndsAt.setMonth(trialEndsAt.getMonth() + months);
      usedPromoCode = code;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db`
      INSERT INTO users (email, password_hash, name, last_active_at)
      VALUES (${email}, ${passwordHash}, ${name || null}, CURRENT_TIMESTAMP)
      RETURNING id, email, name, created_at
    `;

    const user = Array.isArray(result) ? result[0] : result.rows?.[0] || result;

    // Provision subscription (trialing if promo, active otherwise)
    try {
      if (trialEndsAt) {
        await db`
          INSERT INTO subscriptions (user_id, plan, status, trial_ends_at, promo_code)
          VALUES (${user.id}, ${finalPlan}, 'trialing', ${trialEndsAt.toISOString()}, ${usedPromoCode})
          ON CONFLICT (user_id) DO NOTHING
        `;
      } else {
        await db`
          INSERT INTO subscriptions (user_id, plan, status)
          VALUES (${user.id}, ${finalPlan}, 'active')
          ON CONFLICT (user_id) DO NOTHING
        `;
      }
    } catch (subError: any) {
      console.error('Failed to create subscription for new user:', subError.message);
    }

    // Sync new user to Notion (fire-and-forget)
    NotionSyncJob.syncUser(user.id).catch(() => {});

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = loginUserSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const result = await db`
      SELECT id, email, password_hash, name FROM users WHERE email = ${email}
    `;

    const users = Array.isArray(result) ? result : result.rows || [];
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const user = users[0];

    // Google-only accounts have no password
    if (!user.password_hash) {
      return res.status(401).json({
        status: 'error',
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Update last_active_at on login
    await db`UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ${user.id}`.catch(() => {});

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to login',
      // Include detailed error message for debugging (remove in production if sensitive)
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// ── Google OAuth ────────────────────────────────────────────────────────────

export const googleAuth = (_req: Request, res: Response) => {
  const client = getGoogleClient();
  const url = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error || !code) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_cancelled`);
    }

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const userInfoResponse = await client.request<{
      sub: string;
      email: string;
      name?: string;
      picture?: string;
    }>({ url: 'https://www.googleapis.com/oauth2/v3/userinfo' });
    const { sub: googleId, email, name, picture } = userInfoResponse.data;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_no_email`);
    }

    // 1. Look up by google_id
    let userResult = await db`SELECT id, email, name, avatar_url FROM users WHERE google_id = ${googleId}`;
    let users = Array.isArray(userResult) ? userResult : (userResult as any).rows ?? [];
    let isNewUser = false;

    if (users.length === 0) {
      // 2. Look up by email (existing account without Google)
      userResult = await db`SELECT id, email, name, avatar_url FROM users WHERE email = ${email}`;
      users = Array.isArray(userResult) ? userResult : (userResult as any).rows ?? [];

      if (users.length > 0) {
        // Link google_id to existing account and store avatar
        await db`UPDATE users SET google_id = ${googleId}, avatar_url = ${picture || null}, last_active_at = CURRENT_TIMESTAMP WHERE id = ${users[0].id}`;
        users[0].avatar_url = picture || null;
      } else {
        // 3. Create new user (no password)
        const newResult = await db`
          INSERT INTO users (email, name, google_id, avatar_url, last_active_at)
          VALUES (${email}, ${name || null}, ${googleId}, ${picture || null}, CURRENT_TIMESTAMP)
          RETURNING id, email, name, avatar_url
        `;
        const newUsers = Array.isArray(newResult) ? newResult : (newResult as any).rows ?? [];
        try {
          await db`
            INSERT INTO subscriptions (user_id, plan, status)
            VALUES (${newUsers[0].id}, 'free', 'active')
            ON CONFLICT (user_id) DO NOTHING
          `;
        } catch (_: any) {}
        NotionSyncJob.syncUser(newUsers[0].id).catch(() => {});
        users = newUsers;
        isNewUser = true;
      }
    } else {
      // Update avatar_url on every login in case it changed
      await db`UPDATE users SET avatar_url = ${picture || null}, last_active_at = CURRENT_TIMESTAMP WHERE id = ${users[0].id}`.catch(() => {});
      users[0].avatar_url = picture || null;
    }

    const user = users[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const params = new URLSearchParams({
      token,
      user: JSON.stringify({ id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url || null }),
      ...(isNewUser ? { is_new: '1' } : {}),
    });
    return res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
};

// ── Development-only password reset endpoint ─────────────────────────────────

// Development-only password reset endpoint
export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Only allow in development or with a secret key
    if (process.env.NODE_ENV === 'production' && req.body.secret !== process.env.PASSWORD_RESET_SECRET) {
      return res.status(403).json({
        status: 'error',
        message: 'Password reset not allowed in production without secret',
      });
    }

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and newPassword are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
    }

    // Find user
    const result = await db`
      SELECT id, email FROM users WHERE email = ${email}
    `;

    const users = Array.isArray(result) ? result : result.rows || [];
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
    `;

    return res.json({
      status: 'success',
      message: 'Password reset successfully',
      email,
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
    });
  }
};

