import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      {/* Brand Logo */}
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-black text-2xl text-slate-900 tracking-tight"
        >
          <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md shadow-blue-600/20">
            AI
          </span>
          <span>COMMERCE</span>
        </Link>
      </div>

      {/* Main White Card Container */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
