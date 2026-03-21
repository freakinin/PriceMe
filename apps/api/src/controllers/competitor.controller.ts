
import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { db } from '../utils/db.js';
import { checkCompetitorLimit } from '../utils/subscription.js';

/**
 * Track a new competitor product from a URL.
 */
export const trackCompetitorProduct = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const { url, linkedProductId, skipAnalysis } = req.body;
        const userId = (req as any).userId;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check plan limit before running the (expensive) AI analysis
        const limitCheck = await checkCompetitorLimit(userId);
        if (!limitCheck.allowed) {
            return res.status(403).json({
                status: 'error',
                code: 'PLAN_LIMIT_REACHED',
                message: `You've reached your plan limit of ${limitCheck.limit} tracked competitor products. Upgrade your plan to track more.`,
                data: { limit: limitCheck.limit, current: limitCheck.current, resource: 'competitors' },
            });
        }

        console.log(`Starting tracking for URL: ${url} (User: ${userId})`);

        // 1. Use AI with Google Search Grounding to analyze URL directly
        //    skipAnalysis=true skips Gemini (used for auto-tracking from AI Generator to avoid timeout)
        let analysis = {
            title: 'Unknown Product',
            price: 0,
            currency: 'USD',
            materials: [] as string[],
            quality_score: 0,
            image_quality_score: 0,
            description_score: 0,
            ai_analysis_summary: skipAnalysis ? 'Pending analysis. Open Competitors to run AI analysis.' : 'AI Analysis failed. Please update details manually.',
        };

        try {
            analysis.title = new URL(url).hostname.replace('www.', '');
        } catch { /* noop */ }

        if (!skipAnalysis) {
            try {
                console.log('Sending URL to Gemini with Google Search Grounding...');
                const aiResult = await AIService.analyzeProduct(url);

                if (aiResult.price === 0) {
                    console.warn('AI returned 0 price. This might indicate the product is free or unlisted.');
                }

                analysis = { ...analysis, ...aiResult };
            } catch (aiError: any) {
                // AI analysis failed — continue with basic URL info so the URL is still tracked
                console.warn('AI Analysis failed, saving basic competitor record:', aiError.message);
            }
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
            analysis,
            warning: (analysis.price === 0 || analysis.price === null)
                ? 'Price could not be extracted. Please update manually.'
                : null,
            // Include raw AI response in development for debugging
            ...(process.env.NODE_ENV === 'development' && {
                debug: {
                    raw_ai_response: (analysis as any).raw_ai_response
                }
            })
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
 * Return previously saved competitive insights (no AI call).
 */
export const getSavedInsights = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const userId = (req as any).userId;
        const { productId } = req.query;

        if (!productId) {
            return res.status(400).json({ error: 'productId query param is required' });
        }

        const result = await db`
            SELECT competitive_insights, insights_generated_at FROM products
            WHERE id = ${Number(productId)} AND user_id = ${userId}
        `;

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { competitive_insights, insights_generated_at } = result.rows[0];

        if (!competitive_insights) {
            return res.json({ insights: null });
        }

        res.json({ insights: competitive_insights, generated_at: insights_generated_at });
    } catch (error) {
        console.error('Error fetching saved insights:', error);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
};

/**
 * Generate AI-powered competitive insights based on tracked products and notes.
 * Saves the result to the products table for future retrieval.
 */
export const getCompetitiveInsights = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const userId = (req as any).userId;
        const { productId } = req.query;

        if (!productId) {
            return res.status(400).json({ error: 'productId query param is required' });
        }

        // Get the user's product info
        const productResult = await db`
            SELECT id, name, target_price FROM products
            WHERE id = ${Number(productId)} AND user_id = ${userId}
        `;

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];

        // Get all tracked competitors for this product
        const competitors = await db`
            SELECT tp.title, tp.current_price, tp.quality_score, tp.competition_level, 
                   tp.notes, tp.materials_analysis, tp.url
            FROM tracked_products tp
            JOIN competitors c ON tp.competitor_id = c.id
            WHERE c.user_id = ${userId} AND tp.linked_product_id = ${Number(productId)}
        `;

        if (competitors.rows.length < 2) {
            return res.status(400).json({
                error: 'Need at least 2 tracked competitors to generate insights'
            });
        }

        const competitorData = competitors.rows.map((c: any) => ({
            title: c.title,
            price: Number(c.current_price),
            url: c.url,
            quality_score: c.quality_score ? Number(c.quality_score) : undefined,
            competition_level: c.competition_level,
            notes: c.notes,
            materials: c.materials_analysis
        }));

        const insights = await AIService.generateCompetitiveInsights({
            productName: product.name,
            productPrice: Number(product.target_price || 0),
            competitors: competitorData
        });

        // Save insights to the products table
        await db`
            UPDATE products 
            SET competitive_insights = ${JSON.stringify(insights)}::jsonb,
                insights_generated_at = NOW()
            WHERE id = ${Number(productId)} AND user_id = ${userId}
        `;

        res.json(insights);
    } catch (error) {
        console.error('Error generating competitive insights:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
};

/**
 * Update a tracked product (for manual price/title edits).
 */
export const updateTrackedProduct = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const { title, current_price, quality_score, competition_level, notes } = req.body;
        const userId = (req as any).userId;

        // Verify ownership and get current data
        const existing = await db`
            SELECT tp.* 
            FROM tracked_products tp
            JOIN competitors c ON tp.competitor_id = c.id
            WHERE tp.id = ${Number(id)} AND c.user_id = ${userId}
        `;

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Tracked product not found or unauthorized' });
        }

        const current = existing.rows[0];

        // Merge: use provided value or keep existing
        const newTitle = title !== undefined ? title : current.title;
        const newPrice = current_price !== undefined ? Number(current_price) : Number(current.current_price);
        const newQuality = quality_score !== undefined ? (quality_score ? Number(quality_score) : null) : current.quality_score;
        const newCompLevel = competition_level !== undefined ? competition_level : (current.competition_level || null);
        const newNotes = notes !== undefined ? notes : (current.notes || null);

        // Add to price history if price changed
        if (current_price !== undefined && Number(current_price) !== Number(current.current_price)) {
            await db`
                INSERT INTO price_history (tracked_product_id, price)
                VALUES (${Number(id)}, ${Number(current_price)})
            `;
        }

        // Single clean update
        await db`
            UPDATE tracked_products
            SET 
                title = ${newTitle},
                current_price = ${newPrice},
                quality_score = ${newQuality},
                competition_level = ${newCompLevel},
                notes = ${newNotes},
                last_scraped_at = NOW()
            WHERE id = ${Number(id)}
        `;

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating tracked product:', error);
        res.status(500).json({ error: 'Failed to update tracked product' });
    }
};

/**
 * Refresh a tracked product by re-running AI analysis on its URL.
 */
export const refreshTrackedProduct = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const existing = await db`
            SELECT tp.*
            FROM tracked_products tp
            JOIN competitors c ON tp.competitor_id = c.id
            WHERE tp.id = ${Number(id)} AND c.user_id = ${userId}
        `;

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Tracked product not found or unauthorized' });
        }

        const product = existing.rows[0];

        let analysis;
        try {
            analysis = await AIService.analyzeProduct(product.url);
        } catch (aiError: any) {
            console.warn('AI Analysis failed during refresh:', aiError.message);
            return res.status(422).json({ error: `AI Analysis failed: ${aiError.message}` });
        }

        if (!analysis || !analysis.price || analysis.price === 0) {
            return res.status(422).json({
                error: 'Could not extract price from URL. Try again or update manually.'
            });
        }

        const oldPrice = parseFloat(product.current_price);
        const newPrice = analysis.price;

        await db`
            UPDATE tracked_products
            SET
                title = ${analysis.title},
                current_price = ${newPrice},
                currency = ${analysis.currency || product.currency},
                materials_analysis = ${JSON.stringify(analysis.materials)},
                quality_score = ${analysis.quality_score},
                image_quality_score = ${analysis.image_quality_score},
                description_score = ${analysis.description_score},
                ai_analysis_summary = ${analysis.ai_analysis_summary},
                last_scraped_at = NOW(),
                updated_at = NOW()
            WHERE id = ${Number(id)}
        `;

        if (newPrice !== oldPrice) {
            await db`
                INSERT INTO price_history (tracked_product_id, price)
                VALUES (${Number(id)}, ${newPrice})
            `;
        }

        res.json({ message: 'Product refreshed successfully', analysis });
    } catch (error: any) {
        console.error('Error refreshing tracked product:', error);
        res.status(500).json({ error: 'Failed to refresh tracked product' });
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
