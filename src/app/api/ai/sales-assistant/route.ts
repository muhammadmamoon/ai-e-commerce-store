import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { AnalyticsService } from "../../../../services/analytics.service";
import OpenAI from "openai";
import { z } from "zod";

const assistantQuerySchema = z.object({
  question: z.string().min(2, "Please enter a question."),
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
    const parsed = assistantQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid question format." },
        { status: 400 },
      );
    }

    const { question } = parsed.data;

    // 1. Fetch Grounded Live Data from MySQL
    const liveData = await AnalyticsService.getStoreIntelligence(30);

    // Build a compact grounding context
    const groundingContext = {
      summaryLast30Days: liveData.summary,
      topCategories: liveData.categoryAnalytics.slice(0, 5),
      hotProducts: liveData.hotProducts.slice(0, 5),
      criticalStockAlerts: liveData.demandForecasts.filter(
        (d) => d.status === "CRITICAL" || d.status === "WARNING",
      ),
      slowMovingProducts: liveData.demandForecasts.filter(
        (d) => d.status === "OVERSTOCKED" || d.soldLast30Days === 0,
      ),
    };

    const apiKey = process.env.OPENAI_API_KEY;

    // 2. If valid OpenAI key is present, query LLM with strict anti-hallucination system prompt
    if (apiKey && apiKey.startsWith("sk-") && !apiKey.includes("your-key")) {
      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an enterprise AI E-Commerce Business Intelligence Analyst.
STRICT RULES:
1. Base EVERY number, product name, revenue figure, and stock alert strictly on the provided LIVE_MYSQL_DATA JSON.
2. Never invent or guess sales numbers, conversion rates, or products.
3. Structure your response with clear bullet points: Finding, Supporting Database Metric, and Suggested Action.
4. Treat all demand forecasts as estimates.`,
          },
          {
            role: "user",
            content: `LIVE_MYSQL_DATA:\n${JSON.stringify(groundingContext, null, 2)}\n\nADMIN QUESTION: ${question}`,
          },
        ],
      });

      return NextResponse.json({
        success: true,
        data: {
          answer: response.choices[0].message.content,
          groundedMetrics: groundingContext.summaryLast30Days,
        },
      });
    }

    // 3. Deterministic Grounded Fallback Analyzer (uses actual MySQL data when no OpenAI key is set)
    const q = question.toLowerCase();
    const {
      summaryLast30Days,
      topCategories,
      hotProducts,
      criticalStockAlerts,
      slowMovingProducts,
    } = groundingContext;

    let answer = "";

    if (
      q.includes("stock") ||
      q.includes("run out") ||
      q.includes("inventory")
    ) {
      if (criticalStockAlerts.length === 0) {
        answer = `Based on live MySQL inventory records, **0 products** are currently in critical low-stock status. All variants have healthy stock coverage relative to their 30-day sales velocity.`;
      } else {
        const list = criticalStockAlerts
          .map(
            (item) =>
              `• **${item.productName}** — Current Stock: **${item.currentStock} units** | Avg Daily Sales: **${item.avgDailySales}/day** | Est. Duration: **${
                item.estimatedDaysRemaining ?? "0"
              } days** (${item.recommendation})`,
          )
          .join("\n");
        answer = `### Inventory Depletion & Restock Analysis\nBased on your live MySQL inventory and 30-day sales velocity, the following products require attention:\n\n${list}`;
      }
    } else if (q.includes("category") || q.includes("categories")) {
      if (topCategories.length === 0) {
        answer = `No category sales have been recorded in the last 30 days yet. Once orders are placed, category revenue shares will appear here.`;
      } else {
        const list = topCategories
          .map(
            (c) =>
              `• **${c.name}**: **$${c.revenue.toFixed(2)}** revenue across **${c.units} units** sold`,
          )
          .join("\n");
        answer = `### Category Revenue Breakdown (Last 30 Days)\nTotal Store Revenue: **$${summaryLast30Days.totalRevenue.toFixed(
          2,
        )}**\n\n${list}\n\n**Suggested Action:** Prioritize inventory depth and homepage banner placement for **${
          topCategories[0].name
        }**, as it currently leads revenue generation.`;
      }
    } else if (
      q.includes("decline") ||
      q.includes("slow") ||
      q.includes("discount") ||
      q.includes("promote")
    ) {
      if (slowMovingProducts.length === 0) {
        answer = `All catalog items currently have active velocity or balanced stock.`;
      } else {
        const list = slowMovingProducts
          .slice(0, 5)
          .map(
            (p) =>
              `• **${p.productName}** — 30-Day Sales: **${p.soldLast30Days} units** | Current Stock: **${p.currentStock} units**`,
          )
          .join("\n");
        answer = `### Promotional & Discount Candidates\nBased on database records, these products have low sales velocity relative to available stock:\n\n${list}\n\n**Suggested Action:** Consider creating a 10–15% promotional coupon or featuring these items on the storefront to improve turnover.`;
      }
    } else {
      const topHot = hotProducts
        .slice(0, 3)
        .map(
          (p) =>
            `• **${p.name}** (Hot Score: **${p.hotScore}/100**) — **${p.unitsSold30d} units sold** ($${p.revenue30d.toFixed(
              2,
            )}) | Reasons: ${p.reasons.join(", ")}`,
        )
        .join("\n");

      answer = `### Executive Store Intelligence Summary (Last 30 Days)
• **Total Paid/Active Revenue:** $${summaryLast30Days.totalRevenue.toFixed(2)}
• **Total Orders Processed:** ${summaryLast30Days.totalOrders} orders (${summaryLast30Days.totalUnitsSold} total units)
• **Average Order Value (AOV):** $${summaryLast30Days.averageOrderValue.toFixed(2)}

**Fastest-Selling & Highest Hot-Score Products:**
${topHot || "• No product sales recorded yet."}

**Inventory Risk Overview:**
• **${criticalStockAlerts.length} product(s)** flagged for low-stock or rapid depletion.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        answer,
        groundedMetrics: summaryLast30Days,
      },
    });
  } catch (error) {
    console.error("POST /api/ai/sales-assistant error:", error);
    return NextResponse.json(
      { success: false, message: "AI Sales Assistant failed to analyze data." },
      { status: 500 },
    );
  }
}
