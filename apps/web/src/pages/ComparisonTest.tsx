import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ComparisonTest() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleCompare = async () => {
        if (!url) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await api.post('/competitors/compare', { url });
            setResult(response.data);
        } catch (error: any) {
            console.error('Comparison failed:', error);
            setResult({
                error: error.response?.data?.error || error.message || 'Failed to compare methods'
            });
        } finally {
            setLoading(false);
        }
    };

    const renderResult = (method: string, data: any) => {
        if (!data) return null;

        const isSuccess = data.success;
        const result = data.result;
        const error = data.error;
        const duration = data.duration_ms;

        return (
            <Card className="flex-1">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            {method === 'google_search' ? 'Google Search Grounding' : 'Playwright Browser Automation'}
                        </CardTitle>
                        {isSuccess ? (
                            <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Success
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                            </Badge>
                        )}
                    </div>
                    <CardDescription>Duration: {duration}ms</CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess && result ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Title</p>
                                <p className="text-sm">{result.title}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Price</p>
                                    <p className="text-lg font-bold text-primary">
                                        {result.currency} ${result.price}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                                    <p className="text-sm">{result.quality_score}/10</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Materials</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {result.materials?.map((material: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                            {material}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">AI Analysis</p>
                                <p className="text-xs text-muted-foreground mt-1">{result.ai_analysis_summary}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-destructive">
                            <p className="font-medium">Error:</p>
                            <p className="text-xs mt-1">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Scraping Method Comparison</h1>
                <p className="text-muted-foreground">
                    Test and compare Google Search Grounding vs Playwright Browser Automation for product analysis
                </p>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Test URL</CardTitle>
                    <CardDescription>Enter a product URL to compare both scraping methods</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://www.etsy.com/listing/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                            className="flex-1"
                        />
                        <Button onClick={handleCompare} disabled={loading || !url}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Comparing...
                                </>
                            ) : (
                                'Compare'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result && !result.error && (
                <>
                    <div className="flex gap-4 mb-6">
                        {renderResult('google_search', result.comparison?.google_search)}
                        {renderResult('jina_scraping', result.comparison?.jina_scraping)}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recommendation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">{result.recommendation}</p>
                            {result.comparison?.google_search?.result && result.comparison?.jina_scraping?.result && (
                                <div className="mt-4 p-4 bg-muted rounded-lg">
                                    <p className="text-xs font-medium mb-2">Price Comparison:</p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Google:</span>{' '}
                                            <span className="font-bold">${result.comparison.google_search.result.price}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Jina:</span>{' '}
                                            <span className="font-bold">${result.comparison.jina_scraping.result.price}</span>
                                        </div>
                                    </div>
                                    {Math.abs(result.comparison.google_search.result.price - result.comparison.jina_scraping.result.price) > 0.01 && (
                                        <p className="text-xs text-destructive mt-2">
                                            ⚠️ Price mismatch detected! Difference: $
                                            {Math.abs(result.comparison.google_search.result.price - result.comparison.jina_scraping.result.price).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {result?.error && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{result.error}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
