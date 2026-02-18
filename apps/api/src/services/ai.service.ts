import { GoogleGenerativeAI } from '@google/generative-ai';

interface AnalysisResult {
    title: string;
    price?: number;
    currency?: string;
    materials: string[];
    quality_score: number;
    image_quality_score: number;
    description_score: number;
    ai_analysis_summary: string;
}

export class AIService {
    private static getModel() {
        // Using gemini-2.5-flash with Google Search Grounding
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        return new GoogleGenerativeAI(apiKey).getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{
                // Enable Google Search Grounding
                // @ts-ignore - Tool type in SDK might be outdated
                googleSearch: {}
            } as any]
        });
    }

    static async analyzeProduct(urlOrMarkdown: string): Promise<AnalysisResult> {
        const model = this.getModel();

        // Determine if input is a raw URL or markdown content
        const isUrl = urlOrMarkdown.startsWith('http');

        let prompt = '';
        if (isUrl) {
            prompt = `
              You are an expert e-commerce pricing analyst. 
              
              Task: Use Google Search to find the CURRENT product details for this URL: ${urlOrMarkdown}
              
              CRITICAL PRICE EXTRACTION RULES:
              - Extract the BASE PRODUCT PRICE ONLY (the main price shown to customers)
              - DO NOT include taxes, VAT, shipping, or any additional fees
              - If there is a "Sale Price" or "Now" price, use that instead of the original price
              - If there is a price range (e.g., "$10 - $20"), use the LOWEST price
              - If multiple variants exist with different prices, use the LOWEST variant price
              - Extract the exact numeric value as displayed (e.g., if it shows "$90.52", return 90.52)
              - DO NOT round or modify the price in any way
              
              Extract the following fields and return as JSON:
              1. **title**: The exact product title.
              2. **price**: Numeric value ONLY (e.g. 19.99). The BASE product price excluding all fees.
              3. **currency**: ISO 4217 code (USD, EUR, ILS, etc.).
              4. **materials**: Array of strings (e.g., "Cotton", "Gold", "Walnut"). 
              5. **quality_score** (1-10): Assessment based on description.
              6. **image_quality_score** (1-10): Implied quality (default 5 if unknown).
              7. **description_score** (1-10): Detail level.
              8. **ai_analysis_summary**: Concise 2-3 sentence summary of the product.

              Return a valid JSON object. Do NOT wrap in markdown code blocks.
            `;
        } else {
            prompt = `
              You are an expert e-commerce pricing analyst. Your task is to extract product details from the provided competitor website content (Markdown or HTML).
              
              CRITICAL: You must extract the CURRENT SELLING PRICE. 
              - If there is a "Sale Price" or "Now" price, use that.
              - If there is a price range (e.g., "$10 - $20"), use the LOWEST price.
              - Ignore "Original Price" or "List Price" if a discounted price exists.
              
              Extract the following fields:
              1. **title**: The exact product title.
              2. **price**: Numeric value ONLY (e.g. 19.99, not $19.99). If strictly no price is found, return 0.
              3. **currency**: ISO 4217 code (USD, EUR, GBP, etc.). Default to 'USD' if ambiguous but '$' sign is present.
              4. **materials**: Array of strings listing materials (e.g., "Cotton", "Gold", "Wood"). 
              5. **quality_score** (1-10): Assessment of product quality based on materials/description. 1=Poor, 10=Premium.
              6. **image_quality_score** (1-10): Score the *implied* quality of images based on descriptions (e.g. "detailed photos", "zoom available"). If unknown, default to 5.
              7. **description_score** (1-10): How detailed and professional is the product description?
              8. **ai_analysis_summary**: A concise (2-3 sentences) summary of how this product compares to a high-standard listing. Mention key strengths/weaknesses.

              Return a valid JSON object. Do NOT wrap in markdown code blocks.

              JSON Schema:
              {
                "title": "string",
                "price": number,
                "currency": "string",
                "materials": ["string"],
                "quality_score": number,
                "image_quality_score": number,
                "description_score": number,
                "ai_analysis_summary": "string"
              }

              Product Content (Truncated):
              ${urlOrMarkdown.substring(0, 25000)} 
            `;
        }

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up potentially wrapped JSON
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            console.log("Raw AI Response:", text.substring(0, 500)); // Log for debugging

            const analysis = JSON.parse(text) as AnalysisResult;

            // Post-processing defaults
            if (!analysis.materials) analysis.materials = [];
            if (!analysis.currency) analysis.currency = 'USD';

            // Add raw response for debugging (only in development)
            if (process.env.NODE_ENV === 'development') {
                (analysis as any).raw_ai_response = text;
            }

            return analysis;
        } catch (error: any) {
            console.error('Error analyzing product with Gemini:', error);
            // Return a safe fallback rather than throwing, so we can save partial data (like URL/Title from scraper)
            return {
                title: 'Analysis Failed',
                price: 0,
                currency: 'USD',
                materials: [],
                quality_score: 0,
                image_quality_score: 0,
                description_score: 0,
                ai_analysis_summary: `AI Analysis failed: ${error.message}`
            };
        }
    }

    private static getAnalysisModel() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        // Use standard model without search grounding for analysis tasks
        return new GoogleGenerativeAI(apiKey).getGenerativeModel({
            model: "gemini-2.5-flash",
        });
    }

    static async generateCompetitiveInsights(data: {
        productName: string;
        productPrice: number;
        competitors: Array<{
            title: string;
            price: number;
            url?: string;
            quality_score?: number;
            competition_level?: string;
            notes?: string;
            materials?: string[];
        }>;
    }): Promise<CompetitiveInsights> {
        const model = this.getAnalysisModel();

        // Build short names from titles (first 3 meaningful words)
        const getShortName = (title: string): string => {
            const words = title.split(/[\s\-–:,]+/).filter(w => w.length > 0);
            return words.slice(0, 3).join(' ');
        };

        // Build competitors_ref map: shortName -> url
        const competitorsRef: Record<string, string> = {};
        data.competitors.forEach(c => {
            competitorsRef[getShortName(c.title)] = c.url || '';
        });

        const competitorSummary = data.competitors.map(c => {
            const shortName = getShortName(c.title);
            return `"${shortName}" (full: ${c.title})
  - Price: $${c.price}
  - Quality Score: ${c.quality_score ?? 'N/A'}/10
  - Competition Level: ${c.competition_level || 'unknown'}
  - Materials: ${c.materials?.join(', ') || 'unknown'}
  - User Notes: ${c.notes || 'No notes'}`;
        }).join('\n\n');

        const shortNames = data.competitors.map(c => `"${getShortName(c.title)}"`).join(', ');

        const prompt = `You are a sharp competitive analyst advising a small maker/artisan. You have access to their personal notes about each competitor — these contain real observations.

My product: "${data.productName}" priced at $${data.productPrice}
I'm tracking ${data.competitors.length} competitors:

${competitorSummary}

IMPORTANT: Use these SHORT NAMES to refer to competitors: ${shortNames}
NEVER use "Competitor 1", "Competitor 2", etc. Always use the short name like "${getShortName(data.competitors[0].title)}".

Analyze ONLY the data above. Reference competitor short names, their exact prices, and observations from "User Notes".

Return JSON with this schema:
{
  "summary": "2 sentence max. Reference the price range and name the closest threat by short name.",
  "pricing_insight": "2-3 sentences. Compare my price to specific competitors by short name. Suggest a concrete number or range if appropriate.",
  "differentiation": "2-3 sentences. Name which competitor's weakness to exploit and what specific feature gap exists.",
  "risks": "2-3 sentences. Name the specific competitor that poses the biggest threat and why, citing their notes.",
  "action_items": ["exactly 4 items — each must reference a competitor short name or specific tactic from the notes, max 10 words each"]
}

CRITICAL — DO NOT:
- Use "Competitor 1" / "Competitor 2" — always use the short name
- Give generic advice like "invest in photography" or "develop value proposition"
- Say the market is "highly competitive" — you only see ${data.competitors.length} products
- Suggest things that apply to ANY product

INSTEAD:
- Use short names: "${getShortName(data.competitors[0].title)}'s weakness is..."
- Reference prices: "$89 vs your $150..."
- Pull from notes: "their 3500+ sales suggest..." or "their free shipping over $75..."

Return valid JSON only, no markdown wrapping.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            console.log("AI Insights Response:", text.substring(0, 300));

            const insights = JSON.parse(text) as CompetitiveInsights;
            insights.competitors_ref = competitorsRef;
            return insights;
        } catch (error: any) {
            console.error('Error generating competitive insights:', error);
            return {
                summary: 'Unable to generate insights — check your API key or try again.',
                pricing_insight: 'Could not analyze pricing. Ensure competitors have prices and notes filled in.',
                differentiation: 'Add detailed notes about each competitor to get specific differentiation advice.',
                risks: 'Insufficient data to identify specific threats.',
                action_items: ['Add detailed notes to competitors', 'Ensure all prices are set', 'Try regenerating insights', 'Check API key configuration']
            };
        }
    }
}

interface CompetitiveInsights {
    summary: string;
    pricing_insight: string;
    differentiation: string;
    risks: string;
    action_items: string[];
    competitors_ref?: Record<string, string>; // shortName -> URL
}
