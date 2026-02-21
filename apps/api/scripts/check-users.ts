
import { db } from '../src/utils/db'; // Adjust path if needed

async function main() {
    try {
        console.log('Connecting to DB...');
        const result = await db`SELECT id, email, name, created_at FROM users`;
        const users = Array.isArray(result) ? result : result.rows || [];
        console.log('Users found:', users);
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        process.exit(0);
    }
}

main();
