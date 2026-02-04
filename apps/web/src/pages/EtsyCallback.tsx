import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function EtsyCallback() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const errorParam = params.get('error');

            if (errorParam) {
                setError('Etsy denied access.');
                return;
            }

            if (!code) {
                setError('No authorization code returned.');
                return;
            }

            // Verify state to prevent CSRF
            const storedState = localStorage.getItem('etsy_state');
            if (state !== storedState) {
                setError('State mismatch. Security check failed.');
                return;
            }

            const codeVerifier = localStorage.getItem('etsy_code_verifier');
            if (!codeVerifier) {
                setError('Code verifier missing. Authentication session expired.');
                return;
            }

            const clientId = localStorage.getItem('etsy_client_id');

            try {
                const redirectUri = window.location.origin + '/integrations/etsy/callback';

                await api.post('/etsy/token', {
                    code,
                    codeVerifier,
                    redirectUri,
                    clientId
                });

                toast({
                    title: "Success",
                    description: "Successfully connected to Etsy!"
                });
                navigate('/integrations');
            } catch (err: any) {
                console.error('Callback error:', err);
                setError(err.response?.data?.message || 'Failed to exchange token.');
            } finally {
                // Cleanup? We might want to keep client_id for syncs if we don't put it in DB/Env.
                localStorage.removeItem('etsy_code_verifier');
                localStorage.removeItem('etsy_state');
            }
        };

        handleCallback();
    }, [navigate, toast]);

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-destructive">Connection Failed</h1>
                <p className="text-muted-foreground">{error}</p>
                <button
                    className="text-primary hover:underline"
                    onClick={() => navigate('/integrations')}
                >
                    Return to Integrations
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Connecting to Etsy...</h2>
            <p className="text-muted-foreground">Please wait while we secure your connection.</p>
        </div>
    );
}
