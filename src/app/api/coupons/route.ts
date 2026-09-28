import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").max(30),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  amount: z.coerce.number().positive("Discount amount must be greater than 0"),
  minPurchase: z.coerce.number().nonnegative().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
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

    const coupons = await prisma.coupon.findMany({
      orderBy: { startDate: "desc" },
    });

    const formatted = coupons.map((c) => ({
      ...c,
      amount: Number(c.amount),
      minPurchase: c.minPurchase !== null ? Number(c.minPurchase) : null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/coupons error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch coupons." },
      { status: 500 },
    );
  }
}

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
    const parsed = couponSchema.safeParse(body);

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

    const data = parsed.data;
    const normalizedCode = data.code.toUpperCase().trim().replace(/\s+/g, "");

    if (data.discountType === "PERCENTAGE" && data.amount > 100) {
      return NextResponse.json(
        { success: false, message: "Percentage discount cannot exceed 100%." },
        { status: 400 },
      );
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Coupon code "${normalizedCode}" already exists.`,
        },
        { status: 409 },
      );
    }

    const created = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discountType: data.discountType,
        amount: data.amount,
        minPurchase: data.minPurchase ?? null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        usageLimit: data.usageLimit ?? null,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Coupon created successfully.",
        data: created,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/coupons error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create coupon." },
      { status: 500 },
    );
  }
}
