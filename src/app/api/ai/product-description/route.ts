import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import OpenAI from "openai";
import { z } from "zod";

const promptSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  categoryName: z.string().optional(),
  features: z.array(z.string()).min(1, "Provide at least one key feature"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = promptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, categoryName, features } = parsed.data;
    const apiKey = process.env.OPENAI_API_KEY;

    // Live OpenAI Generation if valid key is configured
    if (apiKey && apiKey.startsWith("sk-") && !apiKey.includes("your-key")) {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an elite e-commerce copywriter and technical SEO specialist. Return strictly a JSON object with keys: shortDesc (max 160 chars), description (detailed multi-paragraph copy with feature highlights), seoTitle (max 60 chars), seoDesc (max 155 chars), and seoKeywords (comma-separated string).",
          },
          {
            role: "user",
            content: `Product Name: ${name}\nCategory: ${categoryName || "General"}\nKey Features: ${features.join(", ")}`,
          },
        ],
      });

      const content = JSON.parse(completion.choices[0].message.content || "{}");
      return NextResponse.json({ success: true, data: content });
    }

    // Structured fallback if OpenAI key is not yet added to .env
    const featureBullets = features.map((f) => `• ${f}`).join("\n");
    const fallbackData = {
      shortDesc: `Experience next-level performance with the ${name}, featuring ${features.slice(0, 2).join(" and ")}.`,
      description: `Elevate your daily workflow and lifestyle with the ${name}. Engineered for reliability and peak performance, this model combines modern industrial design with enterprise-grade specifications.\n\nKey Highlights:\n${featureBullets}\n\nBuilt with premium materials and backed by comprehensive quality assurance, the ${name} delivers exceptional value in the ${categoryName || "modern tech"} category.`,
      seoTitle: `Buy ${name} Online | Best Price & Official Specs`,
      seoDesc: `Shop the ${name} featuring ${features.slice(0, 3).join(", ")}. Fast shipping, official warranty, and secure checkout.`,
      seoKeywords: [name, categoryName || "store", ...features]
        .filter(Boolean)
        .join(", ")
        .toLowerCase(),
    };

    return NextResponse.json({
      success: true,
      data: fallbackData,
      meta: "Generated via built-in template engine (Add OPENAI_API_KEY in .env for LLM generation).",
    });
  } catch (error: any) {
    console.error("AI Product Description error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate AI product copy." },
      { status: 500 },
    );
  }
}
