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
        // Use the generic latest alias which maps to the current stable Flash version (1.5 or newer)
        return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '').getGenerativeModel({ model: "models/gemini-flash-latest" });
    }

    static async analyzeProduct(markdown: string): Promise<AnalysisResult> {
        const model = this.getModel();
        const prompt = `
      You are an expert product pricing analyst. Analyze the following product listing content (in Markdown) from a competitor website (e.g., Etsy).
      
      Extract the following information and provide qualititative analysis:
      1. Product Title
      2. Price (numeric value only) and Currency (ISO code like USD, EUR). If not found, use 0 and 'USD'.
      3. Materials used (as a list of strings).
      4. Quality Score (1-10): Overall assessment of the product quality based on materials and description.
      5. Image Quality Score (1-10): Rate the quality of the "images" described or implied. Since you only see text, infer from descriptions of photos or "updates" if available, otherwise give a neutral 5 or make a best guess based on the professionalism of the listing.
      6. Description Quality Score (1-10): How well written, detailed, and SEO-friendly is the description?
      7. AI Analysis Summary: A brief paragraph (2-3 sentences) summarizing your findings, highlighting pros/cons compared to a high-standard product.

      Return the result as a valid JSON object with the following keys:
      {
        "title": "string",
        "price": number,
        "currency": "string",
        "materials": ["string", ...],
        "quality_score": number,
        "image_quality_score": number,
        "description_score": number,
        "ai_analysis_summary": "string"
      }
      
      Do not include markdown code block formatting in the response, just the raw JSON string.

      Product Content:
      ${markdown.substring(0, 20000)} // Limit context if needed
    `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up markdown code blocks if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const analysis = JSON.parse(text) as AnalysisResult;
            return analysis;
        } catch (error: any) {
            console.error('Error analyzing product with Gemini:', error);
            throw new Error('Failed to analyze product content.');
        }
    }
}
