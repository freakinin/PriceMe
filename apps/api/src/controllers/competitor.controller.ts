
import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { db } from '../utils/db.js';

/**
 * Track a new competitor product from a URL.
 */
export const trackCompetitorProduct = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const { url, linkedProductId } = req.body;
        const userId = (req as any).userId;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log(`Starting tracking for URL: ${url} (User: ${userId})`);

        // 1. Skip Manual Scraping - Use AI Grounding instead
        // We pass the RAW URL to the AI service, which will use Google Search Grounding to fetch info.
        let analysis = {
            title: 'Unknown Product',
            price: 0,
            currency: 'USD',
            materials: [] as string[],
            quality_score: 0,
            image_quality_score: 0,
            description_score: 0,
            ai_analysis_summary: 'AI Analysis failed. Please update details manually.',
        };

        try {
            console.log('Sending URL directly to Gemini with Google Search Grounding...');
            const aiResult = await AIService.analyzeProduct(url);

            // Log if AI returned 0 price
            if (aiResult.price === 0) {
                console.warn('AI returned 0 price. This might indicate the product is free or unlisted.');
            }

            analysis = { ...analysis, ...aiResult };
        } catch (aiError: any) {
            console.warn('AI Analysis failed:', aiError.message);
            // If AI Search fails, we could fallback to scraping, but let's assume Search is superior for now.
            return res.status(400).json({ error: `AI Analysis (Google Search) failed: ${aiError.message}` });
        }

        // 3. Extract store name (competitor name) - simplistic approach for now
        // In a real app, we might extract this from the domain or specific localized scraping logic
        // For Etsy, it's usually in the title or URL structure, but let's assume domain for now or "Unknown Store"
        // Or we ask AI to extract it? Current prompt doesn't extract store name.
        // Let's use the domain as a fallback name.
        let competitorName = 'Unknown Store';
        try {
            const urlObj = new URL(url);
            competitorName = urlObj.hostname.replace('www.', '');
            // Special handling for Etsy shops in URL? etsy.com/shop/StoreName -> StoreName
            const etsyMatch = url.match(/etsy\.com\/shop\/([^\/?]+)/);
            if (etsyMatch && etsyMatch[1]) {
                competitorName = etsyMatch[1];
            }
        } catch (e) {
            // ignore
        }

        // 4. Save to Database using transaction-like logic (though sql`` calls are separate, we can chain them)

        // Find or Create Competitor
        // We check if this user already tracks this domain/store
        // Note: This logic assumes one "Competitor" entry per store/domain per user
        let competitorId;

        const existingCompetitor = await db`
      SELECT id FROM competitors 
      WHERE user_id = ${userId} AND (url LIKE ${'%' + competitorName + '%'} OR name = ${competitorName})
      LIMIT 1
    `;

        if (existingCompetitor.rows.length > 0) {
            competitorId = existingCompetitor.rows[0].id;
        } else {
            const newCompetitor = await db`
        INSERT INTO competitors (user_id, name, url)
        VALUES (${userId}, ${competitorName}, ${url})
        RETURNING id
      `;
            competitorId = newCompetitor.rows[0].id;
        }

        // Check if Product is already tracked
        const existingProduct = await db`
      SELECT id FROM tracked_products
      WHERE competitor_id = ${competitorId} AND url = ${url}
      LIMIT 1
    `;

        let trackedProductId;

        if (existingProduct.rows.length > 0) {
            // Update existing
            trackedProductId = existingProduct.rows[0].id;
            await db`
        UPDATE tracked_products
        SET 
          current_price = ${analysis.price || 0},
          currency = ${analysis.currency || 'USD'},
          title = ${analysis.title},
          last_scraped_at = NOW(),
          materials_analysis = ${JSON.stringify(analysis.materials)},
          quality_score = ${analysis.quality_score},
          image_quality_score = ${analysis.image_quality_score},
          description_score = ${analysis.description_score},
          ai_analysis_summary = ${analysis.ai_analysis_summary},
          linked_product_id = ${linkedProductId || null} -- Update link if provided
        WHERE id = ${trackedProductId}
      `;
        } else {
            // Create new
            const newProduct = await db`
        INSERT INTO tracked_products (
          competitor_id, 
          linked_product_id, 
          url, 
          title, 
          current_price, 
          currency,
          last_scraped_at,
          materials_analysis,
          quality_score,
          image_quality_score,
          description_score,
          ai_analysis_summary
        )
        VALUES (
          ${competitorId},
          ${linkedProductId || null},
          ${url},
          ${analysis.title},
          ${analysis.price || 0},
          ${analysis.currency || 'USD'},
          NOW(),
          ${JSON.stringify(analysis.materials)},
          ${analysis.quality_score},
          ${analysis.image_quality_score},
          ${analysis.description_score},
          ${analysis.ai_analysis_summary}
        )
        RETURNING id
      `;
            trackedProductId = newProduct.rows[0].id;
        }

        // 5. Add Price History
        await db`
      INSERT INTO price_history (tracked_product_id, price)
      VALUES (${trackedProductId}, ${analysis.price || 0})
    `;

        res.status(200).json({
            message: 'Product tracked successfully',
            trackedProductId,
            competitorName,
            analysis
        });

    } catch (error: any) {
        console.error('Error tracking competitor product:', error);
        res.status(500).json({ error: 'Internal server error processing tracking request' });
    }
};

/**
 * Get all tracked products for a specific user.
 * Optional query param: productId to filter for a specific linked product.
 */
export const getTrackedProducts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { productId } = req.query;

        let query = db`
      SELECT 
        tp.*, 
        c.name as competitor_name
      FROM tracked_products tp
      JOIN competitors c ON tp.competitor_id = c.id
      WHERE c.user_id = ${userId}
    `;

        if (productId) {
            // If productId is provided, filter by linked_product_id
            // Note: We need to append the condition. Since db\`\` template tag is specific,
            // we might need to construct the query differently or use a simpler approach for now.
            // Vercel postgres sql tag supports composition but let's keep it simple.
            // We'll fetch all loops or use a specific query if productId is present.
            query = db`
        SELECT 
          tp.*, 
          c.name as competitor_name
        FROM tracked_products tp
        JOIN competitors c ON tp.competitor_id = c.id
        WHERE c.user_id = ${userId} AND tp.linked_product_id = ${Number(productId)}
      `;
        }

        const products = await query;
        res.json(products.rows);
    } catch (error) {
        console.error('Error fetching tracked products:', error);
        res.status(500).json({ error: 'Failed to fetch tracked products' });
    }
};

/**
 * Delete a tracked product.
 */
export const deleteTrackedProduct = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // specific check to ensure the user owns the competitor (and thus the product)
        const result = await db`
      DELETE FROM tracked_products 
      WHERE id = ${Number(id)} 
      AND competitor_id IN (SELECT id FROM competitors WHERE user_id = ${userId})
    `;

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Tracked product not found or unauthorized' });
        }

        res.json({ message: 'Tracked product deleted successfully' });
    } catch (error) {
        console.error('Error deleting tracked product:', error);
        res.status(500).json({ error: 'Failed to delete tracked product' });
    }
};
