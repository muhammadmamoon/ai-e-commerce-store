import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { z } from "zod";

const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  subtotal: z.number().nonnegative(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateCouponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid coupon payload" },
        { status: 400 },
      );
    }

    const { code, subtotal } = parsed.data;
    const normalizedCode = code.toUpperCase().trim();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired coupon code." },
        { status: 404 },
      );
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "This coupon has expired or is not yet active.",
        },
        { status: 400 },
      );
    }

    if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order amount of $${Number(coupon.minPurchase).toFixed(2)} required for this coupon.`,
        },
        { status: 400 },
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * Number(coupon.amount)) / 100;
    } else {
      discountAmount = Math.min(Number(coupon.amount), subtotal);
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        amount: Number(coupon.amount),
        discountTotal: Math.round(discountAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate coupon." },
      { status: 500 },
    );
  }
}
