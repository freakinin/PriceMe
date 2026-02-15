import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    maxDuration: 10,
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        // Dynamic import to catch initialization errors (like DB failure)
        // Note: In Vercel Node runtime, we import the source TS file if built with @vercel/node
        // or the transpiled JS. Since we rely on Vercel's zero-config TS support:
        const module = await import('../src/server');
        const app = module.default;

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
