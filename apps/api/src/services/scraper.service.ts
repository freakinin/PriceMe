import axios from 'axios';

/**
 * Service to handle scraping of external product pages using Jina AI Reader.
 */
export class ScraperService {
    private static JINA_API_BASE = 'https://r.jina.ai/';

    /**
     * Scrapes a URL and returns the content (Markdown preferred, HTML fallback).
     * @param url The URL to scrape
     * @returns Markdown or HTML content of the page
     */
    static async scrapeUrl(url: string): Promise<string> {
        if (!url) {
            throw new Error('URL is required for scraping');
        }

        // Standard headers to mimic a real browser
        const browserHeaders = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.com/',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        };

        try {
            console.log(`Attempt 1: Scraping URL using Jina AI: ${url}`);
            // Jina AI Reader returns the content in Markdown format
            const response = await axios.get(`${this.JINA_API_BASE}${url}`, {
                headers: {
                    ...browserHeaders,
                    'X-With-Images-Summary': 'true',
                    'X-With-Links-Summary': 'true',
                    'X-Return-Format': 'markdown'
                },
                timeout: 30000 // 30 second timeout
            });

            const content = response.data;

            console.log(`Jina Response Status: ${response.status}`);
            console.log(`Content Length: ${typeof content === 'string' ? content.length : 'N/A'}`);

            // Check if content indicates a block/error (Jina might return 200 with error text)
            const lowerContent = typeof content === 'string' ? content.toLowerCase() : '';
            if (lowerContent.includes('access denied') ||
                lowerContent.includes('403 forbidden') ||
                lowerContent.includes('cloudflare') ||
                lowerContent.includes('target url returned error') ||
                lowerContent.includes('please enable js') ||
                lowerContent.includes('captcha') ||
                lowerContent.includes('robot check')) {
                throw new Error('Jina returned blocked content/CAPTCHA');
            }

            console.log('Scraped Content Preview:', typeof content === 'string' ? content.substring(0, 500) : 'Non-string content');
            return content;
        } catch (error: any) {
            console.warn(`Jina scraping failed (${error.message}). Attempting Direct Axios fallback...`);

            try {
                console.log(`Attempt 2: Direct Axios GET: ${url}`);
                // Try direct request with browser headers
                const response = await axios.get(url, {
                    headers: browserHeaders,
                    timeout: 20000
                });

                const content = response.data;
                if (typeof content !== 'string') {
                    throw new Error('Direct response was not text');
                }

                console.log('Direct Scraped Content Preview:', content.substring(0, 500));
                return content; // Return raw HTML if successful

            } catch (directError: any) {
                console.warn(`Direct scraping failed (${directError.message}). Attempting Google Cache fallback...`);

                try {
                    // Construct Google Cache URL (text-only version likely already tried by Jina internally, but explicit here)
                    const cacheUrl = `http://webcache.googleusercontent.com/search?q=cache:${url}&strip=1`;
                    console.log(`Attempt 3: Scraping Cache URL using Jina AI: ${cacheUrl}`);

                    const response = await axios.get(`${this.JINA_API_BASE}${cacheUrl}`, {
                        headers: {
                            ...browserHeaders,
                            'X-With-Images-Summary': 'true'
                        },
                        timeout: 30000
                    });

                    const content = response.data;
                    console.log('Scraped Cache Content Preview:', typeof content === 'string' ? content.substring(0, 500) : 'Non-string content');

                    // Final check for CAPTCHA in cache content
                    if (typeof content === 'string' && (content.includes('unusual traffic') || content.includes('CAPTCHA'))) {
                        throw new Error('Google Cache returned CAPTCHA');
                    }

                    return content;
                } catch (cacheError: any) {
                    console.error('All scraping attempts failed:', cacheError.message);
                    // Return original error to propagate failure reason
                    if (axios.isAxiosError(error)) {
                        throw new Error(`Failed to scrape URL: ${error.message} (Status: ${error.response?.status})`);
                    }
                    throw new Error(`Failed to scrape URL: ${error.message}`);
                }
            }
        }
    }
}
