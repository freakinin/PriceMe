
import '../src/loadEnv.js';
import { initializeDatabase, db } from '../src/utils/db.js';

async function run() {
    console.log('Starting database migration...');
    try {
        await initializeDatabase();
        console.log('Database migration completed successfully.');
    } catch (error) {
        console.error('Database migration failed:', error);
        process.exit(1);
    } finally {
        // Close database connection if needed, though @vercel/postgres might handle it
        process.exit(0);
    }
}

run();
