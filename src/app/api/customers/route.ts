import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import { z } from "zod";

const updateCustomerRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "CUSTOMER"]),
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
    const segmentFilter = searchParams.get("segment") || "ALL";

    const users = await prisma.user.findMany({
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            isPaid: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        addresses: true,
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedCustomers = users.map((u) => {
      const validOrders = u.orders.filter(
        (o) => !["CANCELLED", "REFUNDED"].includes(o.status),
      );
      const totalOrders = validOrders.length;
      const totalSpent =
        Math.round(
          validOrders.reduce((sum, o) => sum + Number(o.total), 0) * 100,
        ) / 100;

      const lastOrderDate = u.orders.length > 0 ? u.orders[0].createdAt : null;

      // Determine Customer Segment
      let segment: "VIP" | "FREQUENT" | "RETURNING" | "NEW" | "STAFF" = "NEW";
      if (u.role !== "CUSTOMER") {
        segment = "STAFF";
      } else if (totalSpent >= 1500 || totalOrders >= 5) {
        segment = "VIP";
      } else if (totalOrders >= 3) {
        segment = "FREQUENT";
      } else if (totalOrders >= 1) {
        segment = "RETURNING";
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "Not provided",
        role: u.role,
        segment,
        totalOrders,
        totalSpent,
        reviewsCount: u._count.reviews,
        lastOrderDate,
        createdAt: u.createdAt,
        addresses: u.addresses,
        recentOrders: u.orders.slice(0, 5).map((o) => ({
          ...o,
          total: Number(o.total),
        })),
      };
    });

    const summary = {
      totalUsers: enrichedCustomers.length,
      vipCount: enrichedCustomers.filter((c) => c.segment === "VIP").length,
      returningCount: enrichedCustomers.filter(
        (c) => c.segment === "RETURNING" || c.segment === "FREQUENT",
      ).length,
      newCustomerCount: enrichedCustomers.filter((c) => c.segment === "NEW")
        .length,
      totalCustomerLifetimeValue:
        Math.round(
          enrichedCustomers.reduce((acc, c) => acc + c.totalSpent, 0) * 100,
        ) / 100,
    };

    const filtered = enrichedCustomers.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search);

      const matchesSegment =
        segmentFilter === "ALL" || c.segment === segmentFilter;

      return matchesSearch && matchesSegment;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        customers: filtered,
      },
    });
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load customers." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only Super Admins or Admins can modify roles.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = updateCustomerRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid role update payload." },
        { status: 400 },
      );
    }

    const { userId, role } = parsed.data;

    // Prevent non-SUPER_ADMIN from assigning SUPER_ADMIN
    if (role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only a Super Admin can grant Super Admin access.",
        },
        { status: 403 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({
      success: true,
      message: "User role updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/customers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update user role.",
      },
      { status: 500 },
    );
  }
}
