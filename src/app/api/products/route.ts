import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import { slugify } from "../../../lib/category-utils";
import { z } from "zod";

const variantInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required (e.g., 256GB Black)"),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional().nullable(),
  price: z.coerce.number().positive("Variant price must be greater than 0"),
  costPrice: z.coerce.number().nonnegative().optional().nullable(),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  lowStockAlert: z.coerce.number().int().nonnegative().default(10),
});

const imageInputSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  isPrimary: z.boolean().default(false),
});

export const productCreateSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().optional(),
  categoryId: z.string().uuid("Valid category is required"),
  shortDesc: z.string().optional().nullable(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePrice: z.coerce.number().positive("Base price must be greater than 0"),
  isFeatured: z.boolean().default(false),
  isHot: z.boolean().default(false),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  variants: z
    .array(variantInputSchema)
    .min(1, "At least one product variant is required"),
  images: z
    .array(imageInputSchema)
    .min(1, "At least one product image is required"),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const featuredOnly = searchParams.get("featured") === "true";
    const hotOnly = searchParams.get("hot") === "true";
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { seoKeywords: { contains: search } },
        { variants: { some: { sku: { contains: search } } } },
      ];
    }

    if (categoryId) whereClause.categoryId = categoryId;
    if (featuredOnly) whereClause.isFeatured = true;
    if (hotOnly) whereClause.isHot = true;

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { basePrice: "asc" };
    if (sort === "price_desc") orderBy = { basePrice: "desc" };
    if (sort === "hot") orderBy = { hotScore: "desc" };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: true,
          images: { orderBy: { isPrimary: "desc" } },
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products." },
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
    const parsed = productCreateSchema.safeParse(body);

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

    // Verify unique slug
    const existingSlug = await prisma.product.findUnique({
      where: { slug: finalSlug },
    });
    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          message: `Product slug "${finalSlug}" is already in use.`,
        },
        { status: 409 },
      );
    }

    // Verify unique SKUs in request
    const skus = data.variants.map((v) => v.sku.trim());
    const existingSku = await prisma.productVariant.findFirst({
      where: { sku: { in: skus } },
    });

    if (existingSku) {
      return NextResponse.json(
        {
          success: false,
          message: `SKU "${existingSku.sku}" already exists in the catalog.`,
        },
        { status: 409 },
      );
    }

    // Ensure exactly one primary image
    const hasPrimary = data.images.some((img) => img.isPrimary);
    const normalizedImages = data.images.map((img, idx) => ({
      url: img.url,
      isPrimary: hasPrimary ? img.isPrimary : idx === 0,
    }));

    const createdProduct = await prisma.product.create({
      data: {
        name: data.name.trim(),
        slug: finalSlug,
        categoryId: data.categoryId,
        shortDesc: data.shortDesc || null,
        description: data.description,
        basePrice: data.basePrice,
        isFeatured: data.isFeatured,
        isHot: data.isHot,
        hotScore: data.isHot ? 85 : 10,
        seoTitle: data.seoTitle || null,
        seoDesc: data.seoDesc || null,
        seoKeywords: data.seoKeywords || null,
        variants: {
          create: data.variants.map((v) => ({
            name: v.name.trim(),
            sku: v.sku.trim(),
            barcode: v.barcode?.trim() || null,
            price: v.price,
            costPrice: v.costPrice ?? null,
            stock: v.stock,
            lowStockAlert: v.lowStockAlert,
          })),
        },
        images: {
          create: normalizedImages,
        },
      },
      include: {
        variants: true,
        images: true,
        category: true,
      },
    });

    return NextResponse.json(
      { success: true, data: createdProduct },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create product." },
      { status: 500 },
    );
  }
}
