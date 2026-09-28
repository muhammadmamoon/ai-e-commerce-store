import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";
import { slugify } from "../../../../lib/category-utils";
import { z } from "zod";

const variantInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  costPrice: z.coerce.number().nonnegative().optional().nullable(),
  stock: z.coerce.number().int().nonnegative(),
  lowStockAlert: z.coerce.number().int().nonnegative().default(10),
});

const imageInputSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  isPrimary: z.boolean().default(false),
});

const productUpdateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  categoryId: z.string().uuid(),
  shortDesc: z.string().optional().nullable(),
  description: z.string().min(10),
  basePrice: z.coerce.number().positive(),
  isFeatured: z.boolean().default(false),
  isHot: z.boolean().default(false),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  variants: z.array(variantInputSchema).min(1),
  images: z.array(imageInputSchema).min(1),
});

// GET Single Product by ID or Slug (Next.js 16 async params compatible)
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { isPrimary: "desc" } },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load product details." },
      { status: 500 },
    );
  }
}

// PUT Update Product
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

    const { id: productId } = await context.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);

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
    const finalSlug = slugify(data.slug?.trim() ? data.slug : data.name);

    const hasPrimary = data.images.some((img) => img.isPrimary);
    const normalizedImages = data.images.map((img, idx) => ({
      url: img.url,
      isPrimary: hasPrimary ? img.isPrimary : idx === 0,
    }));

    const updated = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({
        data: normalizedImages.map((img) => ({
          productId,
          url: img.url,
          isPrimary: img.isPrimary,
        })),
      });

      const incomingIds = data.variants
        .map((v) => v.id)
        .filter(Boolean) as string[];

      const variantsToRemove = existingProduct.variants.filter(
        (ev) => !incomingIds.includes(ev.id),
      );

      for (const rem of variantsToRemove) {
        const orderCount = await tx.orderItem.count({
          where: { variantId: rem.id },
        });
        if (orderCount === 0) {
          await tx.productVariant.delete({ where: { id: rem.id } });
        }
      }

      for (const v of data.variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name.trim(),
              sku: v.sku.trim(),
              barcode: v.barcode?.trim() || null,
              price: v.price,
              costPrice: v.costPrice ?? null,
              stock: v.stock,
              lowStockAlert: v.lowStockAlert,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId,
              name: v.name.trim(),
              sku: v.sku.trim(),
              barcode: v.barcode?.trim() || null,
              price: v.price,
              costPrice: v.costPrice ?? null,
              stock: v.stock,
              lowStockAlert: v.lowStockAlert,
            },
          });
        }
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          name: data.name.trim(),
          slug: finalSlug,
          categoryId: data.categoryId,
          shortDesc: data.shortDesc || null,
          description: data.description,
          basePrice: data.basePrice,
          isFeatured: data.isFeatured,
          isHot: data.isHot,
          seoTitle: data.seoTitle || null,
          seoDesc: data.seoDesc || null,
          seoKeywords: data.seoKeywords || null,
        },
        include: {
          variants: true,
          images: true,
          category: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update product." },
      { status: 500 },
    );
  }
}

// DELETE Product
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

    const { id: productId } = await context.params;

    const orderHistoryCount = await prisma.orderItem.count({
      where: { variant: { productId } },
    });

    if (orderHistoryCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete product linked to existing orders. Set stock to 0 instead.",
        },
        { status: 400 },
      );
    }

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({
      success: true,
      message: "Product deleted permanently.",
    });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product." },
      { status: 500 },
    );
  }
}
