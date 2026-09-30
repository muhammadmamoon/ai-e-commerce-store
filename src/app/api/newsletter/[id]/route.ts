import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export async function DELETE(
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

    const { id } = await context.params;

    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Subscriber removed successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/newsletter/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove subscriber." },
      { status: 500 },
    );
  }
}
