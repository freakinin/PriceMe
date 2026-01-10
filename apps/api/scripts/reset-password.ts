import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

async function resetPassword() {
  const email = 'amir@test.com';
  const newPassword = 'password123'; // Simple password for testing
  
  // Check if POSTGRES_URL is set
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable is not set');
    console.error('Please set POSTGRES_URL in your .env file or environment');
    process.exit(1);
  }
  
  try {
    console.log(`Resetting password for ${email}...`);
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the database
    const result = await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
      RETURNING id, email, name
    `;
    
    const users = Array.isArray(result) ? result : result.rows || [];
    
    if (users.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log('✅ Password reset successfully!');
    console.log(`Email: ${email}`);
    console.log(`New password: ${newPassword}`);
    console.log(`User: ${users[0].name || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
