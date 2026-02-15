
import { db } from '../utils/db.js';
import { ScraperService } from '../services/scraper.service.js';
import { AIService } from '../services/ai.service.js';
import { NotificationService } from '../services/notification.service.js';

export class PriceMonitorJob {
    // Config: Check prices every 24 hours (can be adjusted)
    // For demo/dev purposes, we might want to trigger it manually or more frequently.

    static async run() {
        console.log('Starting Price Monitor Job...');

        try {
            // 1. Get all tracked products that haven't been updated in the last 24 hours
            // OR just get all products for now to be simple
            const products = await db`
        SELECT tp.*, c.user_id 
        FROM tracked_products tp
        JOIN competitors c ON tp.competitor_id = c.id
      `;

            console.log(`Checking ${products.rows.length} products for price changes...`);

            for (const product of products.rows) {
                try {
                    // 2. Scrape & Analyze
                    console.log(`Checking product ${product.id}: ${product.url}`);
                    const markdown = await ScraperService.scrapeUrl(product.url);
                    const analysis = await AIService.analyzeProduct(markdown);

                    if (!analysis || !analysis.price) {
                        console.log(`Skipping product ${product.id}: Could not extract price.`);
                        continue;
                    }

                    const newPrice = analysis.price;
                    const oldPrice = parseFloat(product.current_price);
                    const currency = analysis.currency || product.currency;

                    // 3. Compare Prices
                    if (newPrice !== oldPrice) {
                        console.log(`Price change detected for ${product.id}: ${oldPrice} -> ${newPrice}`);

                        // Update database
                        await db`
              UPDATE tracked_products
              SET 
                current_price = ${newPrice},
                last_scraped_at = NOW(),
                updated_at = NOW()
              WHERE id = ${product.id}
            `;

                        // Add history entry
                        await db`
              INSERT INTO price_history (tracked_product_id, price)
              VALUES (${product.id}, ${newPrice})
            `;

                        // 4. Send Notification
                        const changeType = newPrice < oldPrice ? 'decreased' : 'increased';
                        const changePercent = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);

                        await NotificationService.createNotification(
                            product.user_id,
                            'price_alert',
                            `Price ${changeType} for ${product.title}`,
                            `The price changed from ${currency} ${oldPrice} to ${currency} ${newPrice} (${Math.abs(Number(changePercent))}%)`,
                            {
                                tracked_product_id: product.id,
                                old_price: oldPrice,
                                new_price: newPrice,
                                url: product.url
                            }
                        );
                    } else {
                        // Just update last_scraped_at
                        await db`
               UPDATE tracked_products
               SET last_scraped_at = NOW()
               WHERE id = ${product.id}
             `;
                    }

                } catch (err: any) {
                    console.error(`Error processing product ${product.id}:`, err.message);
                }

                // Add delay to ensure browser cleanup and avoid rate limits/resource locks
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log('Price Monitor Job completed.');

        } catch (error) {
            console.error('Price Monitor Job failed:', error);
        }
    }
}
