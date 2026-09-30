import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";
import { slugify } from "../../../../lib/category-utils";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  parentId: z.string().uuid().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Helper to verify that assigning `newParentId` to `categoryId` does not create an infinite loop
 * (e.g., setting a subcategory as the parent of its own ancestor).
 */
async function createsCircularReference(
  categoryId: string,
  newParentId: string | null,
): Promise<boolean> {
  if (!newParentId) return false;
  if (categoryId === newParentId) return true;

  let currentParentId: string | null = newParentId;

  while (currentParentId) {
    if (currentParentId === categoryId) return true;
    const parentRecord: { parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });
    currentParentId = parentRecord?.parentId ?? null;
  }

  return false;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];

    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 403 },
      );
    }

    const resolvedParams = await context.params;
    const categoryId = resolvedParams.id;

    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 },
      );
    }

    const { name, slug, description, imageUrl, parentId, isActive } =
      parsed.data;
    const normalizedParentId =
      parentId === undefined ? existing.parentId : parentId || null;

    // Prevent circular hierarchy
    if (await createsCircularReference(categoryId, normalizedParentId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid parent category: cannot assign a category to itself or one of its descendants.",
        },
        { status: 400 },
      );
    }

    let updatedSlug = existing.slug;
    if (slug && slug.trim() !== "") {
      updatedSlug = slugify(slug);
    } else if (name && name !== existing.name) {
      updatedSlug = slugify(name);
    }

    if (updatedSlug !== existing.slug) {
      const slugConflict = await prisma.category.findUnique({
        where: { slug: updatedSlug },
      });
      if (slugConflict) {
        return NextResponse.json(
          {
            success: false,
            message: "Slug is already in use by another category.",
          },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        slug: updatedSlug,
        description:
          description !== undefined
            ? description || null
            : existing.description,
        imageUrl: imageUrl !== undefined ? imageUrl || null : existing.imageUrl,
        parentId: normalizedParentId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update category." },
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
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];

    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 403 },
      );
    }

    const resolvedParams = await context.params;
    const categoryId = resolvedParams.id;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { children: true, products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 },
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete "${category.name}" because it contains ${category._count.children} subcategories. Reassign or delete them first.`,
        },
        { status: 400 },
      );
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete "${category.name}" because ${category._count.products} products are assigned to it.`,
        },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category." },
      { status: 500 },
    );
  }
}
