import app from '../src/server.js'; // Vercel handles TS transpilation from .js -> .ts

export const config = {
    maxDuration: 10,
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: any, res: any) {
    // Emergency CORS headers for debugging crash scenarios
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Will be overwritten by Express cors if successful
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight immediately if we are in crash-prone territory
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (typeof app !== 'function') {
            throw new Error('Exported app is not a function');
        }

        // Pass request to Express
        return app(req, res);
    } catch (error: any) {
        console.error('CRITICAL API FAILURE:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server initialization failed',
            error: error.message,
            stack: error.stack, // Debugging aid
        });
    }
}
