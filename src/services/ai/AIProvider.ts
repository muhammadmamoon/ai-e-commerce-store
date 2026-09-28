import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIService {
  /**
   * Generates product descriptions based ONLY on provided specs.
   */
  static async generateProductDescription(name: string, features: string[]) {
    const prompt = `Write a professional e-commerce product description for "${name}". 
    Key features: ${features.join(", ")}. 
    Return a JSON object with 'shortDescription', 'fullDescription', and 'seoKeywords'.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are an expert SEO copywriter." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  /**
   * Analyzes real store data and provides business insights.
   * Data is passed IN, preventing hallucination.
   */
  static async analyzeSalesData(analyticsData: any) {
    const prompt = `Analyze this real e-commerce data: ${JSON.stringify(analyticsData)}. 
    Provide 3 actionable insights to increase revenue and 1 inventory warning if applicable. 
    Do not invent numbers. Only use the provided data.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a senior business intelligence analyst.",
        },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0].message.content;
  }
}
