import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/providers/AuthProvider";
import VisitorTracker from "../components/providers/VisitorTracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Commerce | Intelligent Storefront & Admin",
  description: "Full-stack AI-powered e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <VisitorTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
