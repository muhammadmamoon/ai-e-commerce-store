import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma"; // Make sure path matches your setup

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Invalid email address." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check karein agar email pehle se majood hey MySQL mein
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { success: false, message: "Already subscribed!" },
        { status: 400 },
      );
    }

    // 2. Naya email MySQL database mein save karein
    await prisma.newsletterSubscriber.create({
      data: { email: normalizedEmail },
    });

    return NextResponse.json({
      success: true,
      message: "Welcome to our newsletter!",
    });
  } catch (error) {
    console.error("Newsletter Subscription Error:", error);
    return NextResponse.json(
      { success: false, message: "Subscription failed. Please try again." },
      { status: 500 },
    );
  }
}
