import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";
import { MailService } from "../../../../services/mail.service";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

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

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim() || null,
        role: "CUSTOMER",
        wishlist: { create: {} },
      },
    });

    // Generate Verification Token & Send Email
    const token = await MailService.createVerificationToken(normalizedEmail);
    const verifyUrl = await MailService.sendVerificationEmail(
      normalizedEmail,
      name.trim(),
      token,
    );

    const isSmtpConfigured = Boolean(
      process.env.SMTP_EMAIL &&
      process.env.SMTP_PASSWORD &&
      !process.env.SMTP_EMAIL.includes("your-email"),
    );

    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        message:
          "Account created! We have sent a verification link to your email address. Please verify your email before logging in.",
        // In local dev without SMTP, pass previewUrl so developer can test with 1 click
        devVerifyUrl: !isSmtpConfigured ? verifyUrl : undefined,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register account." },
      { status: 500 },
    );
  }
}
