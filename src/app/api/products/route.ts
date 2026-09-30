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

const productCreateSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().optional(),
  categoryId: z.string().uuid("Valid category is required"),
  shippingFee: z.coerce.number().nonnegative().optional().default(0),
  isFreeShipping: z.boolean().optional().default(false),
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

    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

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

    if (minPrice || maxPrice) {
      whereClause.basePrice = {};
      if (minPrice) whereClause.basePrice.gte = Number(minPrice);
      if (maxPrice) whereClause.basePrice.lte = Number(maxPrice);
    }

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
        shippingFee: data.shippingFee || 0,
        isFreeShipping: data.isFreeShipping || false,
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

    // =====================================================================
    // 🔥 NEW PRODUCT EMAIL ALERT LOGIC (MySQL/Prisma Version)
    // =====================================================================
    try {
      // Fetch all subscribers directly from MySQL
      const subscribers = await prisma.newsletterSubscriber.findMany({
        select: { email: true },
      });

      if (
        subscribers.length > 0 &&
        process.env.SMTP_EMAIL &&
        !process.env.SMTP_EMAIL.includes("your-email")
      ) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const productUrl = `${baseUrl}/products/${createdProduct.slug}`;

        // Loop laga kar sub ko email bhej dein
        for (const sub of subscribers) {
          await transporter
            .sendMail({
              from: `"AI Commerce" <${process.env.SMTP_EMAIL}>`,
              to: sub.email,
              subject: `🔥 New Arrival: ${createdProduct.name} is now available!`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; text-align: center;">
                <h2 style="color: #0f172a; margin-bottom: 10px;">Just Dropped: ${createdProduct.name}</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                  We just added an exciting new product to our catalog. As a valued subscriber, you're the first to know! Grab it before it sells out.
                </p>
                <a href="${productUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  View Product in Store
                </a>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                  You received this email because you subscribed to our newsletter.
                </p>
              </div>
            `,
            })
            .catch((err) =>
              console.error(`Failed to send alert to ${sub.email}:`, err),
            );
        }
        console.log(
          `Successfully sent new product alerts to ${subscribers.length} subscribers.`,
        );
      }
    } catch (e) {
      console.log("Newsletter alert error:", e);
    }
    // =====================================================================

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
