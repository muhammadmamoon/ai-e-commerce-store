import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Coupon not found." },
        { status: 404 },
      );
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: body.code
          ? body.code.toUpperCase().trim().replace(/\s+/g, "")
          : existing.code,
        discountType: body.discountType ?? existing.discountType,
        amount:
          body.amount !== undefined ? Number(body.amount) : existing.amount,
        minPurchase:
          body.minPurchase !== undefined
            ? body.minPurchase
              ? Number(body.minPurchase)
              : null
            : existing.minPurchase,
        startDate: body.startDate
          ? new Date(body.startDate)
          : existing.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
        usageLimit:
          body.usageLimit !== undefined
            ? body.usageLimit
              ? Number(body.usageLimit)
              : null
            : existing.usageLimit,
        isActive:
          body.isActive !== undefined
            ? Boolean(body.isActive)
            : existing.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/coupons/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update coupon." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;
    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted permanently.",
    });
  } catch (error) {
    console.error("DELETE /api/coupons/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete coupon." },
      { status: 500 },
    );
  }
}
