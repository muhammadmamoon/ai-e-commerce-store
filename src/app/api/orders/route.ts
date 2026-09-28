import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Order must contain at least one item"),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(2),
    country: z.string().min(2),
    phone: z.string().min(5),
  }),
  paymentMethod: z.enum(["COD", "CARD", "STRIPE"]),
  shippingMethod: z.enum(["STANDARD", "EXPRESS"]),
  couponCode: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill all required shipping address fields.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      items,
      shippingAddress,
      paymentMethod,
      shippingMethod,
      couponCode,
    } = parsed.data;

    // 1. Resolve User from MySQL (by ID or Email)
    let dbUser = null;

    if (session?.user?.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
    }

    if (!dbUser && session?.user?.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
    }

    // If session existed before `prisma db seed` wiped the User table, recreate the user seamlessly
    if (!dbUser && session?.user?.email) {
      const tempPassword = await bcrypt.hash("Customer@123", 10);
      dbUser = await prisma.user.create({
        data: {
          name: session.user.name || shippingAddress.fullName,
          email: session.user.email.toLowerCase().trim(),
          password: tempPassword,
          phone: shippingAddress.phone,
          role: "CUSTOMER",
          wishlist: { create: {} },
        },
      });
    }

    // Fallback for Guest / Unauthenticated Checkout so checkout never blocks a buyer
    if (!dbUser) {
      const guestEmail = `guest_${shippingAddress.phone.replace(/\D/g, "") || Date.now()}@store.local`;
      dbUser = await prisma.user.upsert({
        where: { email: guestEmail },
        update: {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone,
        },
        create: {
          name: shippingAddress.fullName,
          email: guestEmail,
          password: await bcrypt.hash("Guest@12345", 10),
          phone: shippingAddress.phone,
          role: "CUSTOMER",
        },
      });
    }

    // 2. Execute Atomic Transaction: Verify Stock -> Deduct Stock -> Create Order
    const newOrder = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate: Array<{
        variantId: string;
        quantity: number;
        price: number;
      }> = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new Error(
            "One of the items in your cart was updated or removed. Please clear your cart and add the product again.",
          );
        }

        if (variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${variant.product.name} (${variant.name})". Only ${variant.stock} units remaining.`,
          );
        }

        // Deduct inventory in MySQL
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        const itemTotal = Number(variant.price) * item.quantity;
        subtotal += itemTotal;

        orderItemsToCreate.push({
          variantId: variant.id,
          quantity: item.quantity,
          price: Number(variant.price),
        });
      }

      // Calculate Shipping
      let shippingFee = shippingMethod === "EXPRESS" ? 25.0 : 12.0;
      if (subtotal >= 150 && shippingMethod === "STANDARD") {
        shippingFee = 0;
      }

      // Calculate Coupon Discount
      let discount = 0;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase().trim() },
        });

        if (coupon && coupon.isActive) {
          const now = new Date();
          if (
            now >= new Date(coupon.startDate) &&
            now <= new Date(coupon.endDate)
          ) {
            if (!coupon.minPurchase || subtotal >= Number(coupon.minPurchase)) {
              if (coupon.discountType === "PERCENTAGE") {
                discount = (subtotal * Number(coupon.amount)) / 100;
              } else {
                discount = Math.min(Number(coupon.amount), subtotal);
              }
            }
          }
        }
      }

      // 5% Tax
      const tax = Math.max(0, subtotal - discount) * 0.05;
      const finalTotal = Math.max(0, subtotal - discount + shippingFee + tax);

      const createdOrder = await tx.order.create({
        data: {
          userId: dbUser.id,
          status: "PENDING",
          total: finalTotal,
          tax,
          shippingFee,
          discount,
          shippingAddress: JSON.stringify(shippingAddress),
          paymentMethod,
          isPaid: paymentMethod === "CARD" || paymentMethod === "STRIPE",
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      return createdOrder;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully.",
        data: newOrder,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process order." },
      { status: 400 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
      session.user.role,
    );

    const whereClause: any = {};
    if (!isAdmin) {
      // Match by userId or user email
      whereClause.user = { email: session.user.email };
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders." },
      { status: 500 },
    );
  }
}
