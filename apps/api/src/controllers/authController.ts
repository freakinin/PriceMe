import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../utils/db.js';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
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
    const { email, password, name } = validatedData;

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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db`
      INSERT INTO users (email, password_hash, name) 
      VALUES (${email}, ${passwordHash}, ${name || null}) 
      RETURNING id, email, name, created_at
    `;

    const user = Array.isArray(result) ? result[0] : result.rows?.[0] || result;

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

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

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
    });
  }
};

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

