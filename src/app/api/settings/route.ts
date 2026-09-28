import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const SETTINGS_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "store-settings.json");

const DEFAULT_SETTINGS = {
  storeName: "AI Commerce",
  supportEmail: "support@aicommerce.com",
  currency: "USD",
  timezone: "UTC",
  taxRatePercent: 5,
  standardShippingFee: 12,
  expressShippingFee: 25,
  freeShippingThreshold: 150,
  enableCod: true,
  enableStripe: true,
  aiProvider: "OPENAI",
  aiModel: "gpt-4o-mini",
  seoTitle: "AI Commerce | Intelligent Modern E-Commerce Store",
  seoDescription:
    "Shop flagship electronics, laptops, and accessories powered by real-time inventory and AI recommendations.",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
};

async function loadSettings() {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function GET() {
  try {
    const settings = await loadSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to load store settings." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only Super Admins can modify system settings.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const current = await loadSettings();
    const updated = { ...current, ...body };

    await mkdir(SETTINGS_DIR, { recursive: true });
    await writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Store settings saved successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save settings." },
      { status: 500 },
    );
  }
}
