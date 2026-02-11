import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const tmpEnvPath = '/tmp/priceme/env.local';
const rootEnvPath = path.resolve(process.cwd(), '.env.local');

console.log('Loading environment variables...');

// Try tmp first if exists
if (fs.existsSync(tmpEnvPath)) {
    console.log('Loading temp env from:', tmpEnvPath);
    dotenv.config({ path: tmpEnvPath });
} else {
    console.log('Temp env not found:', tmpEnvPath);
}

// Try root env too (may override?)
// We wrap in try-catch because .env.local might have bad permissions
try {
    if (fs.existsSync(rootEnvPath)) {
        console.log('Loading local env from:', rootEnvPath);
        dotenv.config({ path: rootEnvPath });
    }
} catch (e: any) {
    console.warn('Could not read .env.local in root:', e.message);
}

// Then .env
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }
} catch (e: any) {
    console.warn('Could not read .env:', e.message);
}

export { };
