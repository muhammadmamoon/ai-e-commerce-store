import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class StorageService {
  /**
   * Validates and stores an uploaded file, returning its public URL.
   */
  static async uploadProductImage(file: File): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        "Invalid file format. Only JPEG, PNG, WEBP, and AVIF are allowed.",
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File exceeds the 5MB size limit.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate collision-free filename
    const ext = path.extname(file.name) || ".jpg";
    const uniqueName = `${crypto.randomUUID()}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // Return relative public URL
    return `/uploads/products/${uniqueName}`;
  }
}
