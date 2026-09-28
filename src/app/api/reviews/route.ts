import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import OpenAI from "openai";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "";
    const status = searchParams.get("status") || "ALL";

    const whereClause: any = {};
    if (productId) whereClause.productId = productId;
    if (status === "APPROVED") whereClause.isApproved = true;
    if (status === "HIDDEN") whereClause.isApproved = false;

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = reviews.map((r) => {
      let sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" = "POSITIVE";
      if (r.rating <= 2) sentiment = "NEGATIVE";
      else if (r.rating === 3) sentiment = "NEUTRAL";

      return {
        ...r,
        sentiment,
      };
    });

    const totalReviews = enriched.length;
    const avgRating =
      totalReviews > 0
        ? Math.round(
            (enriched.reduce((acc, r) => acc + r.rating, 0) / totalReviews) *
              10,
          ) / 10
        : 0;

    const summary = {
      totalReviews,
      avgRating,
      positiveCount: enriched.filter((r) => r.sentiment === "POSITIVE").length,
      neutralCount: enriched.filter((r) => r.sentiment === "NEUTRAL").length,
      negativeCount: enriched.filter((r) => r.sentiment === "NEGATIVE").length,
      pendingCount: enriched.filter((r) => !r.isApproved).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        reviews: enriched,
      },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load reviews." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/reviews
 * 1) Customer submits a review -> Enforces Verified Purchase + 1 Review Limit
 * 2) Admin triggers AI Sentiment Analysis
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Please sign in to submit a review." },
        { status: 401 },
      );
    }

    const body = await req.json();

    // -------------------------------------------------------------------------
    // BRANCH 1: CUSTOMER SUBMITTING A NEW PRODUCT REVIEW
    // -------------------------------------------------------------------------
    if (body.rating !== undefined && body.comment !== undefined) {
      const { productId, rating, comment } = body;

      if (!productId || !comment?.trim() || comment.trim().length < 3) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please write a valid review comment (at least 3 characters).",
          },
          { status: 400 },
        );
      }

      // 1. Resolve logged-in user by Email or ID
      let dbUser = null;
      if (session.user.email) {
        dbUser = await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase().trim() },
        });
      }
      if (!dbUser && session.user.id) {
        dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
        });
      }

      if (!dbUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User account not found. Please sign in again.",
          },
          { status: 404 },
        );
      }

      // 2. Check if this user has ALREADY reviewed this product (Max 1 review per buyer)
      const existingReview = await prisma.review.findFirst({
        where: {
          productId,
          userId: dbUser.id,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You have already submitted a review for this product. Only 1 review is allowed per verified buyer.",
          },
          { status: 403 },
        );
      }

      // 3. Check if this user has ACTUALLY PURCHASED this product
      const verifiedPurchase = await prisma.order.findFirst({
        where: {
          userId: dbUser.id,
          status: { notIn: ["CANCELLED", "REFUNDED"] },
          items: {
            some: {
              variant: {
                productId,
              },
            },
          },
        },
      });

      if (!verifiedPurchase) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only verified buyers who have purchased this product with their account can post a review.",
          },
          { status: 403 },
        );
      }

      const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));

      const createdReview = await prisma.review.create({
        data: {
          productId,
          userId: dbUser.id,
          rating: numericRating,
          comment: comment.trim(),
          isApproved: true,
        },
        include: {
          user: { select: { name: true } },
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Thank you! Your verified buyer review has been published.",
          data: {
            ...createdReview,
            createdAt: createdReview.createdAt.toISOString(),
          },
        },
        { status: 201 },
      );
    }

    // -------------------------------------------------------------------------
    // BRANCH 2: ADMIN AI SENTIMENT ANALYSIS
    // -------------------------------------------------------------------------
    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const productId = body.productId || "";

    const reviews = await prisma.review.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (reviews.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          positiveFeatures: ["No reviews available for analysis yet."],
          negativeComplaints: ["No customer complaints recorded."],
          commonQuote: "N/A",
          actionableRecommendation:
            "Encourage verified buyers to leave product reviews after delivery.",
        },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.startsWith("sk-") && !apiKey.includes("your-key")) {
      const openai = new OpenAI({ apiKey });
      const reviewDump = reviews
        .map((r) => `[${r.product.name} | ${r.rating}/5 stars]: "${r.comment}"`)
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Analyze the provided real customer reviews. Return a JSON object with keys: positiveFeatures (array of strings), negativeComplaints (array of strings), commonQuote (string summarizing the most notable feedback), and actionableRecommendation (string).",
          },
          { role: "user", content: reviewDump },
        ],
      });

      const parsed = JSON.parse(completion.choices[0].message.content || "{}");
      return NextResponse.json({ success: true, data: parsed });
    }

    const positiveReviews = reviews.filter((r) => r.rating >= 4);
    const lowReviews = reviews.filter((r) => r.rating <= 3);

    const positiveFeatures: string[] = [];
    const negativeComplaints: string[] = [];

    const allText = reviews.map((r) => r.comment.toLowerCase()).join(" ");
    if (allText.includes("battery"))
      positiveFeatures.push("Strong battery stamina and power efficiency");
    if (allText.includes("camera") || allText.includes("photo"))
      positiveFeatures.push("Flagship camera clarity and sensor quality");
    if (allText.includes("sound") || allText.includes("noise"))
      positiveFeatures.push("Impressive audio fidelity and noise cancellation");
    if (allText.includes("fast") || allText.includes("seconds"))
      positiveFeatures.push("High build speed and responsive performance");
    if (positiveFeatures.length === 0 && positiveReviews.length > 0) {
      positiveFeatures.push(
        "High overall build quality and customer satisfaction",
      );
    }

    if (allText.includes("bulky") || allText.includes("case")) {
      negativeComplaints.push(
        "Carrying case / physical dimensions noted as slightly bulky",
      );
    }
    if (lowReviews.length > 0) {
      negativeComplaints.push(
        ...lowReviews
          .slice(0, 2)
          .map((r) => `${r.product.name}: "${r.comment}"`),
      );
    }
    if (negativeComplaints.length === 0) {
      negativeComplaints.push(
        "Zero major recurring complaints across verified reviews.",
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        positiveFeatures,
        negativeComplaints,
        commonQuote: reviews[0]?.comment || "",
        actionableRecommendation: negativeComplaints[0].includes("bulky")
          ? "Highlight exact dimensions in the product gallery and consider offering a slim travel pouch accessory."
          : "Feature these 5-star verified buyer quotes on your homepage banner to boost conversion rates.",
      },
    });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process review request." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
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

    const { reviewId, isApproved } = await req.json();

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: Boolean(isApproved) },
    });

    return NextResponse.json({
      success: true,
      message: "Review visibility updated.",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update review." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review ID required." },
        { status: 400 },
      );
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Review deleted permanently.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete review." },
      { status: 500 },
    );
  }
}
