import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';

const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const updateProfileBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await db`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = ${req.userId}
    `;

    const rows = Array.isArray(result) ? result : result.rows || [];
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = updateProfileBodySchema.parse(req.body);
    const { name } = validatedData;

    if (name === undefined) {
      return res.status(400).json({ status: 'error', message: 'No fields to update' });
    }

    await db`
      UPDATE users
      SET name = ${name}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.userId}
    `;

    return res.json({ status: 'success', message: 'Profile updated', data: { name } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation error', errors: error.errors });
    }
    console.error('updateProfile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update profile' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = changePasswordBodySchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;

    const result = await db`
      SELECT password_hash FROM users WHERE id = ${req.userId}
    `;

    const rows = Array.isArray(result) ? result : result.rows || [];
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db`
      UPDATE users
      SET password_hash = ${newPasswordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.userId}
    `;

    return res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation error', errors: error.errors });
    }
    console.error('changePassword error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to change password' });
  }
};
