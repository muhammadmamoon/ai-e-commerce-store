import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import { z } from "zod";

const adjustStockSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  adjustmentType: z.enum(["SET", "ADD", "SUBTRACT"]),
  quantity: z.coerce.number().int().nonnegative(),
  lowStockAlert: z.coerce.number().int().nonnegative().optional(),
});

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const statusFilter = searchParams.get("status") || "ALL"; // ALL | LOW_STOCK | OUT_OF_STOCK | HEALTHY

    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        orderItems: {
          include: {
            order: { select: { status: true } },
          },
        },
      },
      orderBy: { stock: "asc" },
    });

    const inventoryItems = variants.map((v) => {
      let soldQuantity = 0;
      let reservedStock = 0;
      let returnedQuantity = 0;

      for (const item of v.orderItems) {
        const st = item.order.status;
        if (["DELIVERED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(st)) {
          soldQuantity += item.quantity;
        } else if (["PENDING", "CONFIRMED", "PROCESSING"].includes(st)) {
          reservedStock += item.quantity;
        } else if (st === "RETURNED") {
          returnedQuantity += item.quantity;
        }
      }

      const currentStock = Number(v.stock);
      const lowStockThreshold = Number(v.lowStockAlert || 10);

      let stockStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "HEALTHY" = "HEALTHY";
      if (currentStock <= 0) {
        stockStatus = "OUT_OF_STOCK";
      } else if (currentStock <= lowStockThreshold) {
        stockStatus = "LOW_STOCK";
      }

      const price = Number(v.price);
      const costPrice = v.costPrice ? Number(v.costPrice) : price * 0.65;

      return {
        id: v.id,
        sku: v.sku,
        barcode: v.barcode || "N/A",
        variantName: v.name,
        productId: v.product.id,
        productName: v.product.name,
        productSlug: v.product.slug,
        categoryName: v.product.category?.name || "Uncategorized",
        imageUrl: v.product.images?.[0]?.url || null,
        price,
        costPrice: Math.round(costPrice * 100) / 100,
        currentStock,
        reservedStock,
        soldQuantity,
        returnedQuantity,
        lowStockAlert: lowStockThreshold,
        stockStatus,
        stockRetailValue: Math.round(currentStock * price * 100) / 100,
      };
    });

    // Calculate overall summary before filtering
    const summary = {
      totalSkus: inventoryItems.length,
      totalUnitsInStock: inventoryItems.reduce(
        (acc, i) => acc + i.currentStock,
        0,
      ),
      totalReservedUnits: inventoryItems.reduce(
        (acc, i) => acc + i.reservedStock,
        0,
      ),
      totalSoldUnits: inventoryItems.reduce(
        (acc, i) => acc + i.soldQuantity,
        0,
      ),
      lowStockCount: inventoryItems.filter((i) => i.stockStatus === "LOW_STOCK")
        .length,
      outOfStockCount: inventoryItems.filter(
        (i) => i.stockStatus === "OUT_OF_STOCK",
      ).length,
      totalInventoryValue:
        Math.round(
          inventoryItems.reduce((acc, i) => acc + i.stockRetailValue, 0) * 100,
        ) / 100,
    };

    // Apply search & status filters
    const filtered = inventoryItems.filter((item) => {
      const matchesSearch =
        !search ||
        item.productName.toLowerCase().includes(search) ||
        item.variantName.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.categoryName.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" || item.stockStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        items: filtered,
      },
    });
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load inventory data." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
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
    const parsed = adjustStockSchema.safeParse(body);

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

    const { variantId, adjustmentType, quantity, lowStockAlert } = parsed.data;

    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Variant not found." },
        { status: 404 },
      );
    }

    let newStock = existing.stock;
    if (adjustmentType === "SET") {
      newStock = quantity;
    } else if (adjustmentType === "ADD") {
      newStock = existing.stock + quantity;
    } else if (adjustmentType === "SUBTRACT") {
      newStock = Math.max(0, existing.stock - quantity);
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        stock: newStock,
        ...(lowStockAlert !== undefined ? { lowStockAlert } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/inventory error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update stock." },
      { status: 500 },
    );
  }
}
