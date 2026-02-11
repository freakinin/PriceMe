import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
// Trying both cwd relative and __dirname relative to be safe
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function resetPassword() {
    const email = 'amir@test.com';
    const newPassword = 'PriceMe2025!'; // Updated to a fresh password

    console.log(`Resetting password for user: ${email}`);

    try {
        // Check if user exists
        const userResult = await sql`
      SELECT id, email FROM users WHERE email = ${email}
    `;

        const users = Array.isArray(userResult) ? userResult : userResult.rows || [];

        if (users.length === 0) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        // Hash the new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update the user's password
        await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
    `;

        console.log(`✅ Password successfully updated for ${email}`);
        console.log(`New Password: ${newPassword}`);
        process.exit(0);

    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();
