import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { MailService } from "../services/mail.service";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "missing-google-client-id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "missing-google-client-secret",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email and password.");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        // Enforce Email Verification before allowing login
        const isVerified = await MailService.isEmailVerified(normalizedEmail);
        if (!isVerified) {
          throw new Error(
            "EMAIL_NOT_VERIFIED: Please verify your email address first. Check your inbox for the verification link.",
          );
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Automatically create or link user in MySQL when signing in with Google (Gmail)
      if (account?.provider === "google" && user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        const randomPassword = await bcrypt.hash(
          `google_oauth_${Date.now()}`,
          10,
        );

        const dbUser = await prisma.user.upsert({
          where: { email: normalizedEmail },
          update: {
            name: user.name || normalizedEmail.split("@")[0],
          },
          create: {
            name: user.name || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            password: randomPassword,
            role: "CUSTOMER",
            wishlist: { create: {} },
          },
        });

        await MailService.markEmailVerified(normalizedEmail);
        user.id = dbUser.id;
        (user as any).role = dbUser.role;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "CUSTOMER";
      }

      // Ensure Google OAuth users always have their MySQL ID & Role attached
      if (token.email && (!token.id || !token.role)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase().trim() },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id || token.sub) as string;
        session.user.role = (token.role as any) || "CUSTOMER";
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    "ai-ecommerce-fallback-secret-key-2026",
};
