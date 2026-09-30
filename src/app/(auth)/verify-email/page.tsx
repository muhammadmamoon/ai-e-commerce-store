"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

// 1. Asal component jismein useSearchParams hai
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the URL.");
      return;
    }

    axios
      .get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res.data.success) {
          setStatus("success");
          setMessage(res.data.message);
        } else {
          setStatus("error");
          setMessage(res.data.message || "Verification failed.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Invalid or expired verification link.",
        );
      });
  }, [token]);

  return (
    <div className="text-center space-y-4 py-2">
      {status === "loading" && (
        <>
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">
            Verifying Email...
          </h2>
          <p className="text-xs text-slate-500">{message}</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Email Verified!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
          >
            Continue to Sign In
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Verification Failed
          </h2>
          <p className="text-xs text-rose-600 leading-relaxed">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition"
          >
            Back to Sign In
          </Link>
        </>
      )}
    </div>
  );
}

// 2. Main Page Component (Suspense Wrap ke sath)
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center space-y-4 py-2 min-h-[200px] flex flex-col justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Loading...</h2>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
