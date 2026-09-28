import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: {
        addresses: { orderBy: { isDefault: "desc" } },
        orders: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      include: {
                        images: { where: { isPrimary: true }, take: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 404 },
      );
    }

    const serializedOrders = user.orders.map((ord) => ({
      ...ord,
      total: Number(ord.total),
      tax: Number(ord.tax),
      shippingFee: Number(ord.shippingFee),
      discount: Number(ord.discount),
      items: ord.items.map((it) => ({
        ...it,
        price: Number(it.price),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          createdAt: user.createdAt,
        },
        addresses: user.addresses,
        orders: serializedOrders,
      },
    });
  } catch (error) {
    console.error("GET /api/account error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load account details." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { name, phone, address } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { addresses: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name?.trim() || user.name,
        phone: phone?.trim() || null,
      },
    });

    if (address && address.street && address.city) {
      const existingAddress = user.addresses[0];
      if (existingAddress) {
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: {
            street: address.street,
            city: address.city,
            state: address.state || "",
            postalCode: address.postalCode || "",
            country: address.country || "United States",
          },
        });
      } else {
        await prisma.address.create({
          data: {
            userId: user.id,
            street: address.street,
            city: address.city,
            state: address.state || "",
            postalCode: address.postalCode || "",
            country: address.country || "United States",
            isDefault: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account profile updated successfully.",
    });
  } catch (error) {
    console.error("PUT /api/account error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update account." },
      { status: 500 },
    );
  }
}
