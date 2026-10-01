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
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "Order mein kam az kam 1 item hona zaroori hai"),
  shippingAddress: z
    .object({
      fullName: z.string().optional().default(""),
      name: z.string().optional().default(""),
      street: z.string().optional().default(""),
      address: z.string().optional().default(""),
      city: z.string().optional().default(""),
      state: z.string().optional().default(""),
      postalCode: z.string().optional().default(""),
      country: z.string().optional().default("Pakistan"),
      phone: z.string().optional().default(""),
    })
    .passthrough(),
  paymentMethod: z.string().optional().default("COD"),
  shippingMethod: z.string().optional().default("STANDARD"),
  shippingFee: z.coerce.number().optional().default(0), // 🔥 Direct Checkout Shipping Fee accept karega
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
          message: "Cart ya order details mein kuch kami hai.",
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
      shippingFee: clientShippingFee,
      couponCode,
    } = parsed.data;

    const normalizedAddress = {
      fullName:
        shippingAddress.fullName ||
        shippingAddress.name ||
        session?.user?.name ||
        "Valued Customer",
      street:
        shippingAddress.street || shippingAddress.address || "Not specified",
      city: shippingAddress.city || "Karachi",
      state: shippingAddress.state || "",
      postalCode: shippingAddress.postalCode || "",
      country: shippingAddress.country || "Pakistan",
      phone: shippingAddress.phone || "N/A",
    };

    const validPaymentMethod = ["COD", "CARD", "STRIPE"].includes(
      paymentMethod.toUpperCase(),
    )
      ? (paymentMethod.toUpperCase() as "COD" | "CARD" | "STRIPE")
      : "COD";

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

    if (!dbUser && session?.user?.email) {
      const tempPassword = await bcrypt.hash("Customer@123", 10);
      dbUser = await prisma.user.create({
        data: {
          name: session.user.name || normalizedAddress.fullName,
          email: session.user.email.toLowerCase().trim(),
          password: tempPassword,
          phone: normalizedAddress.phone,
          role: "CUSTOMER",
          wishlist: { create: {} },
        },
      });
    }

    if (!dbUser) {
      const cleanPhone = normalizedAddress.phone.replace(/\D/g, "");
      const guestEmail = `guest_${cleanPhone || Date.now()}@store.local`;
      dbUser = await prisma.user.upsert({
        where: { email: guestEmail },
        update: {
          name: normalizedAddress.fullName,
          phone: normalizedAddress.phone,
        },
        create: {
          name: normalizedAddress.fullName,
          email: guestEmail,
          password: await bcrypt.hash("Guest@12345", 10),
          phone: normalizedAddress.phone,
          role: "CUSTOMER",
        },
      });
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let calculatedShipping = 0;

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
            "Cart mein mojood product update ho chuka hai. Cart clear kar ke dobara add karein.",
          );
        }

        if (variant.stock < item.quantity) {
          throw new Error(
            `"${variant.product.name} (${variant.name})" ke sirf ${variant.stock} units stock mein bache hain.`,
          );
        }

        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        const itemTotal = Number(variant.price) * item.quantity;
        subtotal += itemTotal;

        if (!variant.product.isFreeShipping) {
          calculatedShipping += Number(variant.product.shippingFee || 0);
        }

        orderItemsToCreate.push({
          variantId: variant.id,
          quantity: item.quantity,
          price: Number(variant.price),
        });
      }

      // Agar checkout page se exact shipping fee aayi ho to woh use karo, warna database wali
      let finalShippingFee =
        clientShippingFee > 0 ? clientShippingFee : calculatedShipping;

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

      const tax = 0;
      const finalTotal = Math.max(0, subtotal - discount + finalShippingFee);

      const createdOrder = await tx.order.create({
        data: {
          userId: dbUser.id,
          status: "PENDING",
          total: finalTotal,
          tax: tax,
          shippingFee: finalShippingFee,
          discount: discount,
          shippingAddress: JSON.stringify(normalizedAddress),
          paymentMethod: validPaymentMethod,
          isPaid:
            validPaymentMethod === "CARD" || validPaymentMethod === "STRIPE",
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
        message: "Order kamyabi se place ho gaya hai.",
        data: newOrder,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Order place karne mein masla aaya.",
      },
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
      { success: false, message: "Orders load karne mein masla aaya." },
      { status: 500 },
    );
  }
}
