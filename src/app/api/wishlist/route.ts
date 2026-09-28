import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

async function resolveAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    include: { wishlist: true },
  });
}

export async function GET() {
  try {
    const user = await resolveAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please sign in to view your wishlist." },
        { status: 401 },
      );
    }

    const wishlist = await prisma.wishlist.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: { select: { name: true } },
                variants: true,
                images: { orderBy: { isPrimary: "desc" } },
              },
            },
          },
        },
      },
    });

    const formattedItems = wishlist.items.map((item) => {
      const prod = item.product;
      const defaultVariant = prod.variants?.[0] || null;
      const totalStock = prod.variants.reduce(
        (sum, v) => sum + Number(v.stock),
        0,
      );

      return {
        wishlistItemId: item.id,
        productId: prod.id,
        name: prod.name,
        slug: prod.slug,
        categoryName: prod.category?.name || "Catalog",
        basePrice: Number(prod.basePrice),
        image:
          prod.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        totalStock,
        defaultVariant: defaultVariant
          ? {
              id: defaultVariant.id,
              name: defaultVariant.name,
              sku: defaultVariant.sku,
              price: Number(defaultVariant.price),
              stock: Number(defaultVariant.stock),
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedItems,
    });
  } catch (error) {
    console.error("GET /api/wishlist error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load wishlist." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await resolveAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in to save items to your wishlist.",
        },
        { status: 401 },
      );
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required." },
        { status: 400 },
      );
    }

    const wishlist = await prisma.wishlist.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({
        success: true,
        action: "REMOVED",
        message: "Removed from wishlist.",
      });
    }

    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      action: "ADDED",
      message: "Added to wishlist.",
    });
  } catch (error) {
    console.error("POST /api/wishlist error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update wishlist." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await resolveAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId || !user.wishlist) {
      return NextResponse.json(
        { success: false, message: "Invalid request." },
        { status: 400 },
      );
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: user.wishlist.id,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to remove item." },
      { status: 500 },
    );
  }
}
