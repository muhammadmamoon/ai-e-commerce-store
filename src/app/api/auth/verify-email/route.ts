import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { MailService } from "../../../../services/mail.service";

// GET /api/auth/verify-email?token=xxx -> Verifies the token
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is missing." },
        { status: 400 },
      );
    }

    const result = await MailService.verifyEmailToken(token);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Verification failed." },
      { status: 500 },
    );
  }
}

// POST /api/auth/verify-email -> Resends verification email
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 },
      );
    }

    const normalized = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalized } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found with this email." },
        { status: 404 },
      );
    }

    const token = await MailService.createVerificationToken(normalized);
    const verifyUrl = await MailService.sendVerificationEmail(
      normalized,
      user.name,
      token,
    );

    const isSmtpConfigured = Boolean(
      process.env.SMTP_EMAIL &&
      process.env.SMTP_PASSWORD &&
      !process.env.SMTP_EMAIL.includes("your-email"),
    );

    return NextResponse.json({
      success: true,
      message: "A fresh verification link has been sent to your email.",
      devVerifyUrl: !isSmtpConfigured ? verifyUrl : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to resend verification email." },
      { status: 500 },
    );
  }
}
