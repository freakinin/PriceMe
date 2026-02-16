
import dotenv from 'dotenv';
import { AIService } from '../src/services/ai.service.js';
import { ScraperService } from '../src/services/scraper.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function testMarketAnalysis() {
    // Example product URL (Etsy is a good target as mentioned in the prompt)
    // Using a popular/stable listing if possible, or a generic one.
    // Let's try a real-ish looking URL or a known one if we can find one.
    // I'll use a generic search result URL or a specific item if I can guess one,
    // but for now let's use a very simple external URL that Jina can read, like a blog post or a simple product page
    // to verify the PIPELINE, even if it's not a real competitor.
    // Actually, let's try to search for a product first or just use a known "safe" url.
    // I will use a dummy URL effectively, or a real one if I can.
    // Let's try to scrape a simple public page.
    const url = 'https://www.etsy.com/listing/123456789/test-product'; // This will likely 404 or fail, but let's see.
    // Better: Use a real URL. 
    // I'll use a random Etsy listing found via search in a browser? No, I can't do that easily.
    // I'll use a URL from a known open source shop or similar.
    // Let's use a simple scraping target like valid Wikipedia page just to test the AI extraction of *something* 
    // strictly to verify the flow.
    // But the prompt is specific to "product".

    const targetUrl = 'https://www.etsy.com/listing/1510223004/personalized-leather-keychain-custom';

    console.log(`Testing Market Analysis for URL: ${targetUrl}`);

    try {
        console.log('1. Scraping...');
        const markdown = await ScraperService.scrapeUrl(targetUrl);
        console.log('Scraping successful. Content length:', markdown.length);
        console.log('Preview:', markdown.substring(0, 200));

        console.log('\n2. Analyzing with AI...');
        const analysis = await AIService.analyzeProduct(markdown);

        console.log('\nAnalysis Result:');
        console.log(JSON.stringify(analysis, null, 2));

    } catch (error: any) {
        console.error('Test Failed:', error.message);
    }
}

testMarketAnalysis();
