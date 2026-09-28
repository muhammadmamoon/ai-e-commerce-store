import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
    "REFUNDED",
  ]),
  isPaid: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Next.js 16 async params fix
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
      session.user.role,
    );
    if (!isAdmin && order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order." },
      { status: 500 },
    );
  }
}

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

    // Next.js 16 async params fix
    const { id } = await context.params;

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid status value." },
        { status: 400 },
      );
    }

    const { status, isPaid } = parsed.data;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    // Atomic status update and automatic stock restoration if cancelled/returned/refunded
    const updated = await prisma.$transaction(async (tx) => {
      const shouldRestock =
        (status === "CANCELLED" ||
          status === "RETURNED" ||
          status === "REFUNDED") &&
        existingOrder.status !== "CANCELLED" &&
        existingOrder.status !== "RETURNED" &&
        existingOrder.status !== "REFUNDED";

      if (shouldRestock) {
        for (const item of existingOrder.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status,
          ...(isPaid !== undefined ? { isPaid } : {}),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update order status.",
      },
      { status: 500 },
    );
  }
}
