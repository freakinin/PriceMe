import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, RefreshCw, Unplug } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

// PKCE Helpers
function generateRandomString(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    // Base64Url encode
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export default function Integrations() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [etsyConnected, setEtsyConnected] = useState(false);
    const [etsyData, setEtsyData] = useState<any>(null);
    const [syncing, setSyncing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [customClientId, setCustomClientId] = useState('');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await api.get('/etsy/status');
            if (response.data.connected) {
                setEtsyConnected(true);
                setEtsyData(response.data.data);
            } else {
                setEtsyConnected(false);
            }
        } catch (error) {
            console.error('Failed to check status', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!customClientId) {
            toast({
                title: "Missing API Key",
                description: "Please enter your Etsy App API Key (Keystring)",
                variant: "destructive"
            });
            return;
        }

        // save client id to local storage to use in callback2
        localStorage.setItem('etsy_client_id', customClientId);

        // 1. Generate PKCE
        const codeVerifier = generateRandomString(128);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateRandomString(32);

        // Store verifier in localStorage for callback
        localStorage.setItem('etsy_code_verifier', codeVerifier);
        localStorage.setItem('etsy_state', state);

        // 2. Redirect to Etsy
        const redirectUri = window.location.origin + '/integrations/etsy/callback';
        const scope = 'listings_r shops_r'; // Scopes we need

        const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&client_id=${customClientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        window.location.href = authUrl;
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const clientId = localStorage.getItem('etsy_client_id') || customClientId;
            const response = await api.post('/etsy/sync', { clientId });
            toast({
                title: "Sync Complete",
                description: response.data.message
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Sync Failed",
                description: error.response?.data?.message || 'Failed to sync listings',
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect? This will stop auto-imports, but existing products will remain.')) return;

        setDisconnecting(true);
        try {
            await api.post('/etsy/disconnect');
            setEtsyConnected(false);
            setEtsyData(null);
            toast({
                title: "Disconnected",
                description: "Disconnected from Etsy"
            });
            // Clear local storage items
            localStorage.removeItem('etsy_client_id');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to disconnect",
                variant: "destructive"
            });
        } finally {
            setDisconnecting(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground mt-2">Connect external platforms to sync your data.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="bg-[#F1641E] text-white p-1 rounded font-serif font-bold text-lg px-2">Etsy</span>
                            Etsy Integration
                        </CardTitle>
                        <CardDescription>
                            Connect your Etsy shop to import active listings automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {etsyConnected ? (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <h5 className="mb-1 font-medium leading-none tracking-tight text-green-800">Connected</h5>
                                            <div className="text-sm text-green-700">
                                                Your shop (ID: {etsyData.shop_id}) is connected.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Last synchronized: {etsyData.updated_at ? new Date(etsyData.updated_at).toLocaleString() : 'Never'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm">
                                    To connect, you need an **App API Key (Keystring)** from the <a href="https://www.etsy.com/developers/your-apps" target="_blank" rel="noreferrer" className="underline text-primary">Etsy Developers Portal</a>.
                                </p>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">App API Key (Keystring)</label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="e.g. 1aa2bb33c44d55eeeeee6fff"
                                        value={customClientId}
                                        onChange={(e) => setCustomClientId(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Ensure your App's "Callback URL" includes: <code>{window.location.origin}/integrations/etsy/callback</code>
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
                        {etsyConnected ? (
                            <>
                                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDisconnect} disabled={disconnecting}>
                                    {disconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                                    Disconnect
                                </Button>
                                <Button onClick={handleSync} disabled={syncing}>
                                    {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Sync Listings Now
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleConnect} className="w-full sm:w-auto ml-auto" disabled={!customClientId}>
                                Connect Etsy Account
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
