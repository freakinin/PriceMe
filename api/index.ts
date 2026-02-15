export const config = {
    maxDuration: 10,
};

export default async function handler(req: any, res: any) {
    console.log('API Handler invoked: ' + (req.url || 'unknown url'));
    try {
        console.log('Attempting to import Express app...');
        // Dynamic import to catch initialization errors at runtime
        // We use relative path to the source file. Vercel/esbuild handles the .js extension mapping for TS files.
        const module = await import('../apps/api/src/server.js');
        console.log('Module loaded successfully');

        const app = module.default;

        if (typeof app !== 'function') {
            console.error('Exported app is not a function:', typeof app);
            throw new Error('Exported app is not a function: ' + typeof app);
        }

        console.log('Delegating to Express app...');
        // Express app handles (req, res)
        return app(req, res);
    } catch (error: any) {
        console.error('CRITICAL: Failed to load Express app:', error);

        // Return JSON response with error details
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            status: 'error',
            message: 'Failed to initialize application',
            error: error.message || String(error),
            stack: error.stack,
            env_ok: process.env.VERCEL === '1'
        }));
    }
}
