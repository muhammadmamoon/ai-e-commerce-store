import nodemailer from "nodemailer";
import crypto from "crypto";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const AUTH_STORE_FILE = path.join(DATA_DIR, "auth-verification.json");

// Pre-verified seeded accounts so demo logins always work
const PRE_VERIFIED_EMAILS = [
  "admin@store.com",
  "alex@example.com",
  "sarah@example.com",
  "david@example.com",
];

interface TokenRecord {
  email: string;
  token: string;
  expiresAt: number;
}

interface AuthStoreData {
  unverifiedEmails: string[];
  verifiedEmails: string[];
  verificationTokens: TokenRecord[];
  resetTokens: TokenRecord[];
}

async function loadAuthStore(): Promise<AuthStoreData> {
  try {
    const raw = await readFile(AUTH_STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      unverifiedEmails: [],
      verifiedEmails: [...PRE_VERIFIED_EMAILS],
      verificationTokens: [],
      resetTokens: [],
    };
  }
}

async function saveAuthStore(data: AuthStoreData) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(AUTH_STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export class MailService {
  private static getTransporter() {
    const user = process.env.SMTP_EMAIL;
    const pass = process.env.SMTP_PASSWORD;

    if (
      user &&
      pass &&
      !user.includes("your-email") &&
      !pass.includes("your-16-digit")
    ) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });
    }
    return null;
  }

  /**
   * Checks if a user's email is verified.
   * Existing accounts created before this feature are treated as verified unless in unverifiedEmails.
   */
  static async isEmailVerified(email: string): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    if (PRE_VERIFIED_EMAILS.includes(normalized)) return true;

    const store = await loadAuthStore();
    if (store.verifiedEmails.includes(normalized)) return true;
    if (store.unverifiedEmails.includes(normalized)) return false;

    return true;
  }

  /**
   * Marks a newly registered email as unverified and generates a 24-hour token.
   */
  static async createVerificationToken(email: string): Promise<string> {
    const normalized = email.toLowerCase().trim();
    const store = await loadAuthStore();

    if (
      !store.unverifiedEmails.includes(normalized) &&
      !store.verifiedEmails.includes(normalized)
    ) {
      store.unverifiedEmails.push(normalized);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    store.verificationTokens = store.verificationTokens.filter(
      (t) => t.email !== normalized,
    );
    store.verificationTokens.push({ email: normalized, token, expiresAt });

    await saveAuthStore(store);
    return token;
  }

  /**
   * Verifies a token from the email link and unlocks the user account.
   */
  static async verifyEmailToken(
    token: string,
  ): Promise<{ success: boolean; email?: string; message: string }> {
    const store = await loadAuthStore();
    const record = store.verificationTokens.find((t) => t.token === token);

    if (!record) {
      return {
        success: false,
        message: "Invalid or expired verification link.",
      };
    }

    if (Date.now() > record.expiresAt) {
      return {
        success: false,
        message: "Verification link has expired. Please request a new one.",
      };
    }

    const email = record.email;
    store.unverifiedEmails = store.unverifiedEmails.filter((e) => e !== email);
    if (!store.verifiedEmails.includes(email)) {
      store.verifiedEmails.push(email);
    }
    store.verificationTokens = store.verificationTokens.filter(
      (t) => t.email !== email,
    );

    await saveAuthStore(store);
    return {
      success: true,
      email,
      message: "Email verified successfully! You can now sign in.",
    };
  }

  /**
   * Marks an email as verified immediately (used for Google OAuth sign-ins).
   */
  static async markEmailVerified(email: string) {
    const normalized = email.toLowerCase().trim();
    const store = await loadAuthStore();
    store.unverifiedEmails = store.unverifiedEmails.filter(
      (e) => e !== normalized,
    );
    if (!store.verifiedEmails.includes(normalized)) {
      store.verifiedEmails.push(normalized);
    }
    await saveAuthStore(store);
  }

  /**
   * Creates a 1-hour password reset token.
   */
  static async createPasswordResetToken(email: string): Promise<string> {
    const normalized = email.toLowerCase().trim();
    const store = await loadAuthStore();

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    store.resetTokens = store.resetTokens.filter((t) => t.email !== normalized);
    store.resetTokens.push({ email: normalized, token, expiresAt });

    await saveAuthStore(store);
    return token;
  }

  /**
   * Validates and consumes a password reset token.
   */
  static async consumePasswordResetToken(
    token: string,
  ): Promise<{ valid: boolean; email?: string; message?: string }> {
    const store = await loadAuthStore();
    const record = store.resetTokens.find((t) => t.token === token);

    if (!record) {
      return {
        valid: false,
        message: "Invalid or already used password reset link.",
      };
    }

    if (Date.now() > record.expiresAt) {
      return {
        valid: false,
        message: "Password reset link has expired. Please request a new one.",
      };
    }

    store.resetTokens = store.resetTokens.filter((t) => t.token !== token);
    await saveAuthStore(store);

    return { valid: true, email: record.email };
  }

  /**
   * Sends the Verification Email via Gmail SMTP (or logs clickable link in terminal).
   */
  static async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<string> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    console.log("\n========================================================");
    console.log(`📧 EMAIL VERIFICATION LINK FOR: ${email}`);
    console.log(`👉 ${verifyUrl}`);
    console.log("========================================================\n");

    const transporter = this.getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"AI Commerce" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Verify your email address — AI Commerce",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #0f172a; margin-bottom: 8px;">Welcome to AI Commerce, ${name}!</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Please confirm your email address by clicking the button below so you can sign in and start shopping.
            </p>
            <div style="margin: 28px 0;">
              <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">
              Or copy and paste this link in your browser:<br/>
              <a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a>
            </p>
          </div>
        `,
      });
    }

    return verifyUrl;
  }

  /**
   * Sends the Password Reset Email via Gmail SMTP (or logs clickable link in terminal).
   */
  static async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<string> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/forgot-password?token=${token}`;

    console.log("\n========================================================");
    console.log(`🔑 PASSWORD RESET LINK FOR: ${email}`);
    console.log(`👉 ${resetUrl}`);
    console.log("========================================================\n");

    const transporter = this.getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"AI Commerce Security" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Reset your password — AI Commerce",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #0f172a; margin-bottom: 8px;">Password Reset Request</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Hi ${name}, we received a request to reset your AI Commerce password. Click the button below to set a new password (valid for 1 hour):
            </p>
            <div style="margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">
              If you did not request this, you can safely ignore this email.<br/>
              <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
            </p>
          </div>
        `,
      });
    }

    return resetUrl;
  }
}
