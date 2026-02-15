import app from '../apps/api/src/server.js';

console.log('API Function Initializing...');

export const config = {
    maxDuration: 10, // Attempt to set execution limit (optional)
};

export default app;
