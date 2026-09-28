import prisma from "../lib/prisma";

export interface HotProductResult {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  hotScore: number;
  isHot: boolean;
  unitsSold30d: number;
  revenue30d: number;
  wishlistCount: number;
  avgRating: number;
  totalStock: number;
  reasons: string[];
}

export interface DemandForecastResult {
  productId: string;
  productName: string;
  skuList: string;
  currentStock: number;
  soldLast30Days: number;
  avgDailySales: number;
  estimatedDaysRemaining: number | null; // null if 0 daily sales
  forecastNext7Days: number;
  forecastNext30Days: number;
  status: "CRITICAL" | "WARNING" | "HEALTHY" | "OVERSTOCKED";
  recommendation: string;
}

export class AnalyticsService {
  /**
   * Computes comprehensive store analytics, Hot Product scores, and Demand Forecasts
   * directly from MySQL records.
   */
  static async getStoreIntelligence(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Fetch Orders within period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Fetch all Products with Variants, Reviews, and Wishlist counts
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        reviews: { select: { rating: true } },
        _count: { select: { wishlistedBy: true, reviews: true } },
      },
    });

    // 3. Build Daily Revenue & Order Time-Series
    const dailyMap = new Map<
      string,
      { date: string; revenue: number; orders: number }
    >();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { date: key, revenue: 0, orders: 0 });
    }

    // Track per-product sales metrics
    const productSalesMap = new Map<
      string,
      { sold30d: number; sold7d: number; revenue30d: number }
    >();

    // Track category revenue
    const categoryMap = new Map<
      string,
      { name: string; revenue: number; orders: number; units: number }
    >();

    let totalRevenue = 0;
    let totalUnitsSold = 0;

    for (const order of orders) {
      const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
      const orderTotal = Number(order.total);
      totalRevenue += orderTotal;

      if (dailyMap.has(dateKey)) {
        const entry = dailyMap.get(dateKey)!;
        entry.revenue += orderTotal;
        entry.orders += 1;
      }

      const isRecent7d = new Date(order.createdAt) >= sevenDaysAgo;

      for (const item of order.items) {
        const prod = item.variant?.product;
        if (!prod) continue;

        const lineRevenue = Number(item.price) * item.quantity;
        totalUnitsSold += item.quantity;

        // Update product sales stats
        const pStat = productSalesMap.get(prod.id) || {
          sold30d: 0,
          sold7d: 0,
          revenue30d: 0,
        };
        pStat.sold30d += item.quantity;
        if (isRecent7d) pStat.sold7d += item.quantity;
        pStat.revenue30d += lineRevenue;
        productSalesMap.set(prod.id, pStat);

        // Update category stats
        const catName = prod.category?.name || "Uncategorized";
        const cStat = categoryMap.get(catName) || {
          name: catName,
          revenue: 0,
          orders: 0,
          units: 0,
        };
        cStat.revenue += lineRevenue;
        cStat.orders += 1;
        cStat.units += item.quantity;
        categoryMap.set(catName, cStat);
      }
    }

    // 4. Compute Hot Product Scores & Demand Forecasting
    const hotProducts: HotProductResult[] = [];
    const demandForecasts: DemandForecastResult[] = [];

    for (const product of products) {
      const sales = productSalesMap.get(product.id) || {
        sold30d: 0,
        sold7d: 0,
        revenue30d: 0,
      };

      const totalStock = product.variants.reduce(
        (acc, v) => acc + Number(v.stock),
        0,
      );
      const wishlistCount = product._count.wishlistedBy;
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
            product.reviews.length
          : 0;

      // Calculate Hot Score (0 - 100 scale)
      const velocityPoints = Math.min(40, sales.sold7d * 6);
      const volumePoints = Math.min(25, sales.sold30d * 2);
      const wishlistPoints = Math.min(20, wishlistCount * 4);
      const ratingPoints = Math.min(15, Math.round(avgRating * 3));

      const rawScore = Math.round(
        velocityPoints + volumePoints + wishlistPoints + ratingPoints,
      );
      const hotScore = Math.min(100, rawScore);

      const reasons: string[] = [];
      if (sales.sold7d > 0)
        reasons.push(`${sales.sold7d} units sold in the last 7 days`);
      if (sales.sold30d > 5)
        reasons.push(`Strong monthly volume (${sales.sold30d} purchases)`);
      if (wishlistCount > 0)
        reasons.push(`Wishlisted by ${wishlistCount} shoppers`);
      if (avgRating >= 4)
        reasons.push(`High customer rating (${avgRating.toFixed(1)} ★)`);
      if (reasons.length === 0)
        reasons.push("Steady catalog baseline engagement");

      hotProducts.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        categoryName: product.category?.name || "General",
        hotScore,
        isHot: hotScore >= 50 || product.isHot,
        unitsSold30d: sales.sold30d,
        revenue30d: Math.round(sales.revenue30d * 100) / 100,
        wishlistCount,
        avgRating: Math.round(avgRating * 10) / 10,
        totalStock,
        reasons,
      });

      // Demand Forecasting Calculation (Estimate based on 30-day velocity)
      // Weighted daily average gives 60% weight to recent 7-day pace and 40% to 30-day pace
      const avg30d = sales.sold30d / 30;
      const avg7d = sales.sold7d / 7;
      const weightedDailySales = Number(
        (avg7d * 0.6 + avg30d * 0.4).toFixed(2),
      );

      const forecastNext7Days = Math.ceil(weightedDailySales * 7);
      const forecastNext30Days = Math.ceil(weightedDailySales * 30);

      const estimatedDaysRemaining =
        weightedDailySales > 0
          ? Number((totalStock / weightedDailySales).toFixed(1))
          : null;

      let status: DemandForecastResult["status"] = "HEALTHY";
      let recommendation =
        "Stock level is well-balanced with current sales velocity.";

      if (totalStock === 0) {
        status = "CRITICAL";
        recommendation =
          "Out of stock! Immediate restocking required to prevent lost sales.";
      } else if (
        estimatedDaysRemaining !== null &&
        estimatedDaysRemaining <= 7
      ) {
        status = "CRITICAL";
        recommendation = `Inventory may deplete in ~${estimatedDaysRemaining} days. Reorder at least ${Math.max(
          20,
          forecastNext30Days - totalStock,
        )} units immediately.`;
      } else if (
        (estimatedDaysRemaining !== null && estimatedDaysRemaining <= 14) ||
        totalStock <= 10
      ) {
        status = "WARNING";
        recommendation = `Stock is running low relative to demand (${forecastNext30Days} units projected next 30 days). Consider restocking soon.`;
      } else if (weightedDailySales === 0 && totalStock > 30) {
        status = "OVERSTOCKED";
        recommendation =
          "Zero recent sales velocity with high stock. Consider running a promotional coupon or homepage feature.";
      }

      demandForecasts.push({
        productId: product.id,
        productName: product.name,
        skuList: product.variants.map((v) => v.sku).join(", "),
        currentStock: totalStock,
        soldLast30Days: sales.sold30d,
        avgDailySales: weightedDailySales,
        estimatedDaysRemaining,
        forecastNext7Days,
        forecastNext30Days,
        status,
        recommendation,
      });
    }

    // Sort Hot Products descending by score
    hotProducts.sort((a, b) => b.hotScore - a.hotScore);

    // Sort Demand Forecasts by urgency (CRITICAL first)
    const urgencyRank = { CRITICAL: 1, WARNING: 2, OVERSTOCKED: 3, HEALTHY: 4 };
    demandForecasts.sort(
      (a, b) => urgencyRank[a.status] - urgencyRank[b.status],
    );

    return {
      summary: {
        periodDays: days,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: orders.length,
        totalUnitsSold,
        averageOrderValue:
          orders.length > 0
            ? Math.round((totalRevenue / orders.length) * 100) / 100
            : 0,
      },
      dailyRevenue: Array.from(dailyMap.values()).map((d) => ({
        ...d,
        revenue: Math.round(d.revenue * 100) / 100,
      })),
      categoryAnalytics: Array.from(categoryMap.values()).map((c) => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100,
      })),
      hotProducts,
      demandForecasts,
    };
  }
}
