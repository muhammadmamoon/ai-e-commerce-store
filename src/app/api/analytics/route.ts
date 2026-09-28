import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { AnalyticsService } from "../../../services/analytics.service";
import prisma from "../../../lib/prisma";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const VISITOR_FILE = path.join(DATA_DIR, "visitor-analytics.json");

interface DailyTrafficRecord {
  date: string;
  uniqueVisitorIds: string[];
  pageViews: number;
  desktopViews: number;
  mobileViews: number;
}

interface VisitorStoreData {
  isRealProduction?: boolean;
  daily: Record<string, DailyTrafficRecord>;
  topPages: Record<string, number>;
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Loads strictly REAL visitor data.
 * If the file contains old dummy/seeded data (missing `isRealProduction: true`),
 * it automatically resets to 0 so only real visitors are counted.
 */
async function loadTrafficData(): Promise<VisitorStoreData> {
  try {
    const raw = await readFile(VISITOR_FILE, "utf-8");
    const parsed: VisitorStoreData = JSON.parse(raw);

    // Automatically wipe out old demo/seeded data if it was generated previously
    if (!parsed.isRealProduction) {
      const cleanData: VisitorStoreData = {
        isRealProduction: true,
        daily: {},
        topPages: {},
      };
      await saveTrafficData(cleanData);
      return cleanData;
    }

    return parsed;
  } catch {
    const emptyData: VisitorStoreData = {
      isRealProduction: true,
      daily: {},
      topPages: {},
    };
    await saveTrafficData(emptyData);
    return emptyData;
  }
}

async function saveTrafficData(data: VisitorStoreData) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    VISITOR_FILE,
    JSON.stringify({ ...data, isRealProduction: true }, null, 2),
    "utf-8",
  );
}

async function buildVisitorReport(days: number, totalOrdersInPeriod: number) {
  const store = await loadTrafficData();
  const todayKey = getTodayKey();

  const dailyList: Array<{
    date: string;
    uniqueVisitors: number;
    pageViews: number;
    desktopViews: number;
    mobileViews: number;
  }> = [];

  let totalUniqueVisitorsPeriod = 0;
  let totalPageViewsPeriod = 0;
  let totalDesktopPeriod = 0;
  let totalMobilePeriod = 0;

  // Track unique visitor IDs across the entire selected period so a user visiting on 2 days isn't double-counted in period unique total if needed
  const periodUniqueSet = new Set<string>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];

    const rec = store.daily[key] || {
      date: key,
      uniqueVisitorIds: [],
      pageViews: 0,
      desktopViews: 0,
      mobileViews: 0,
    };

    rec.uniqueVisitorIds.forEach((id) => periodUniqueSet.add(id));

    const uniqueCount = rec.uniqueVisitorIds.length;
    totalPageViewsPeriod += rec.pageViews;
    totalDesktopPeriod += rec.desktopViews;
    totalMobilePeriod += rec.mobileViews;

    dailyList.push({
      date: key,
      uniqueVisitors: uniqueCount,
      pageViews: rec.pageViews,
      desktopViews: rec.desktopViews,
      mobileViews: rec.mobileViews,
    });
  }

  totalUniqueVisitorsPeriod = periodUniqueSet.size;

  const todayStats = store.daily[todayKey]
    ? {
        uniqueVisitors: store.daily[todayKey].uniqueVisitorIds.length,
        pageViews: store.daily[todayKey].pageViews,
      }
    : { uniqueVisitors: 0, pageViews: 0 };

  const conversionRate =
    totalUniqueVisitorsPeriod > 0
      ? Number(
          ((totalOrdersInPeriod / totalUniqueVisitorsPeriod) * 100).toFixed(2),
        )
      : 0;

  const topPagesArray = Object.entries(store.topPages)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  return {
    today: todayStats,
    periodSummary: {
      days,
      totalUniqueVisitors: totalUniqueVisitorsPeriod,
      totalPageViews: totalPageViewsPeriod,
      avgDailyVisitors:
        days > 0 ? Number((totalUniqueVisitorsPeriod / days).toFixed(1)) : 0,
      conversionRate,
      mobileSharePercent:
        totalPageViewsPeriod > 0
          ? Math.round((totalMobilePeriod / totalPageViewsPeriod) * 100)
          : 0,
      desktopSharePercent:
        totalPageViewsPeriod > 0
          ? Math.round((totalDesktopPeriod / totalPageViewsPeriod) * 100)
          : 0,
    },
    dailyTraffic: dailyList,
    topPages: topPagesArray,
  };
}

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
    const days = Math.min(
      365,
      Math.max(7, Number(searchParams.get("days") || 30)),
    );

    const salesData = await AnalyticsService.getStoreIntelligence(days);
    const traffic = await buildVisitorReport(
      days,
      salesData.summary.totalOrders,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...salesData,
        traffic,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate store analytics." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 1. Real-Time Storefront Visitor Logging
    if (body?.action === "LOG_VISIT") {
      const { visitorId, pathname, isMobile } = body;
      if (
        !visitorId ||
        !pathname ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/api")
      ) {
        return NextResponse.json({ success: true, ignored: true });
      }

      const store = await loadTrafficData();
      const todayKey = getTodayKey();

      if (!store.daily[todayKey]) {
        store.daily[todayKey] = {
          date: todayKey,
          uniqueVisitorIds: [],
          pageViews: 0,
          desktopViews: 0,
          mobileViews: 0,
        };
      }

      const todayRecord = store.daily[todayKey];
      if (!todayRecord.uniqueVisitorIds.includes(visitorId)) {
        todayRecord.uniqueVisitorIds.push(visitorId);
      }

      todayRecord.pageViews += 1;
      if (isMobile) {
        todayRecord.mobileViews += 1;
      } else {
        todayRecord.desktopViews += 1;
      }

      store.topPages[pathname] = (store.topPages[pathname] || 0) + 1;
      await saveTrafficData(store);

      return NextResponse.json({
        success: true,
        todayUniqueVisitors: todayRecord.uniqueVisitorIds.length,
        todayPageViews: todayRecord.pageViews,
      });
    }

    // 2. Optional Reset Action if Admin wants to clear traffic logs
    if (body?.action === "RESET_TRAFFIC") {
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

      await saveTrafficData({
        isRealProduction: true,
        daily: {},
        topPages: {},
      });

      return NextResponse.json({
        success: true,
        message: "Visitor analytics reset to 0.",
      });
    }

    // 3. Sync Hot Product scores to MySQL
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

    const intelligence = await AnalyticsService.getStoreIntelligence(30);

    await prisma.$transaction(
      intelligence.hotProducts.map((hp) =>
        prisma.product.update({
          where: { id: hp.id },
          data: {
            hotScore: hp.hotScore,
            isHot: hp.hotScore >= 50,
          },
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      message: "Hot product scores synchronized to MySQL database.",
    });
  } catch (error) {
    console.error("POST /api/analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process analytics action." },
      { status: 500 },
    );
  }
}
