import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { StorageService } from "../../../services/storage.service";

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided." },
        { status: 400 },
      );
    }

    const url = await StorageService.uploadProductImage(file);

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "File upload failed." },
      { status: 400 },
    );
  }
}
