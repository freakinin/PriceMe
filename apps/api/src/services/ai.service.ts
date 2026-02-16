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
        // Using gemini-2.5-flash as requested and available
        const apiKey = process.env.GEMINI_API_KEY || '';
        return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    static async analyzeProduct(markdown: string): Promise<AnalysisResult> {
        const model = this.getModel();
        const prompt = `
      You are an expert e-commerce pricing analyst. Your task is to extract product details from the provided competitor website content (Markdown).
      
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
      ${markdown.substring(0, 25000)} 
    `;

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
}
