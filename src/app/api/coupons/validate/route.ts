import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Please enter a valid coupon code." },
        { status: 400 },
      );
    }

    const normalizedCode = code.toUpperCase().trim().replace(/\s+/g, "");
    const cartSubtotal = Number(subtotal || 0);

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: `Coupon "${normalizedCode}" is invalid or currently inactive.`,
        },
        { status: 404 },
      );
    }

    // Timezone-tolerant date check (covers full start day and full end day)
    const now = new Date();
    const start = new Date(coupon.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(coupon.endDate);
    end.setHours(23, 59, 59, 999);

    if (now < start) {
      return NextResponse.json(
        {
          success: false,
          message: `This coupon will become active on ${start.toLocaleDateString()}.`,
        },
        { status: 400 },
      );
    }

    if (now > end) {
      return NextResponse.json(
        {
          success: false,
          message: `This coupon expired on ${end.toLocaleDateString()}.`,
        },
        { status: 400 },
      );
    }

    const minPurchase = coupon.minPurchase ? Number(coupon.minPurchase) : 0;
    if (minPurchase > 0 && cartSubtotal < minPurchase) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order amount of Rs${minPurchase.toFixed(
            2,
          )} required for this coupon.`,
        },
        { status: 400 },
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (cartSubtotal * Number(coupon.amount)) / 100;
    } else {
      discountAmount = Math.min(Number(coupon.amount), cartSubtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      success: true,
      message: `Coupon ${coupon.code} applied! You saved Rs${discountAmount.toFixed(2)}.`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        amount: Number(coupon.amount),
        discountAmount,
      },
    });
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate coupon code." },
      { status: 500 },
    );
  }
}
