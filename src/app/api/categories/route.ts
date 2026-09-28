import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import { buildCategoryTree, slugify } from "../../../lib/category-utils";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
  parentId: z.string().uuid().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const categories = await prisma.category.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const tree = buildCategoryTree(categories);

    return NextResponse.json({
      success: true,
      data: {
        flat: categories,
        tree,
      },
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load categories." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];

    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

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

    const { name, description, imageUrl, parentId, isActive } = parsed.data;
    const rawSlug = parsed.data.slug?.trim() ? parsed.data.slug : name;
    const finalSlug = slugify(rawSlug);

    // Ensure unique slug
    const existing = await prisma.category.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `A category with slug "${finalSlug}" already exists.`,
        },
        { status: 409 },
      );
    }

    // Verify parent exists if provided
    const normalizedParentId =
      parentId && parentId.trim() !== "" ? parentId : null;
    if (normalizedParentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: normalizedParentId },
      });
      if (!parentExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected parent category does not exist.",
          },
          { status: 404 },
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description || null,
        imageUrl: imageUrl || null,
        parentId: normalizedParentId,
        isActive,
      },
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category." },
      { status: 500 },
    );
  }
}
