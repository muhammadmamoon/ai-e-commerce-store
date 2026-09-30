import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";
import { MailService } from "../../../../services/mail.service";

// POST -> Request Password Reset Link
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please enter your email address." },
        { status: 400 },
      );
    }

    const normalized = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No registered account found with that email address.",
        },
        { status: 404 },
      );
    }

    const token = await MailService.createPasswordResetToken(normalized);
    const resetUrl = await MailService.sendPasswordResetEmail(
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
      message:
        "Password reset instructions have been sent to your email address.",
      devResetUrl: !isSmtpConfigured ? resetUrl : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send password reset email." },
      { status: 500 },
    );
  }
}

// PUT -> Set New Password using Reset Token
export async function PUT(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 },
      );
    }

    const tokenCheck = await MailService.consumePasswordResetToken(token);
    if (!tokenCheck.valid || !tokenCheck.email) {
      return NextResponse.json(
        {
          success: false,
          message: tokenCheck.message || "Invalid or expired reset token.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email: tokenCheck.email },
      data: { password: hashedPassword },
    });

    // Also mark email verified since they proved ownership of the inbox
    await MailService.markEmailVerified(tokenCheck.email);

    return NextResponse.json({
      success: true,
      message:
        "Your password has been reset successfully! You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password." },
      { status: 500 },
    );
  }
}
