import axios from 'axios';

/**
 * Service to handle scraping of external product pages using Jina AI Reader.
 */
export class ScraperService {
    private static JINA_API_BASE = 'https://r.jina.ai/';

    /**
     * Scrapes a URL and returns the markdown content.
     * @param url The URL to scrape
     * @returns Markdown content of the page
     */
    static async scrapeUrl(url: string): Promise<string> {
        if (!url) {
            throw new Error('URL is required for scraping');
        }

        try {
            console.log(`Scraping URL using Jina AI: ${url}`);
            // Jina AI Reader returns the content in Markdown format
            const response = await axios.get(`${this.JINA_API_BASE}${url}`, {
                headers: {
                    // Mimic a real browser to avoid Jina/Upstream blocking Axios UA
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
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
            console.warn(`Direct Jina scraping failed (${error.message}). Attempting Google Cache fallback...`);

            try {
                // Construct Google Cache URL (text-only version to bypass some CAPTCHAs)
                const cacheUrl = `http://webcache.googleusercontent.com/search?q=cache:${url}&strip=1`;
                console.log(`Scraping Cache URL using Jina AI: ${cacheUrl}`);

                const response = await axios.get(`${this.JINA_API_BASE}${cacheUrl}`, {
                    headers: {
                        'X-With-Images-Summary': 'true',
                        'X-With-Links-Summary': 'true'
                    },
                    timeout: 30000
                });

                const content = response.data;
                console.log('Scraped Cache Content Preview:', typeof content === 'string' ? content.substring(0, 500) : 'Non-string content');
                return content;
            } catch (cacheError: any) {
                console.error('Google Cache scraping also failed:', cacheError.message);
                // Return original error to propagate failure reason
                if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to scrape URL: ${error.message} (Status: ${error.response?.status})`);
                }
                throw new Error(`Failed to scrape URL: ${error.message}`);
            }
        }
    }
}
