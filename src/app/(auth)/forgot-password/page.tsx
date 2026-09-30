"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  Mail,
  Lock,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

// 1. Asal Form Component (Jismein useSearchParams hai)
function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setDevResetUrl(null);

    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        if (res.data.devResetUrl) {
          setDevResetUrl(res.data.devResetUrl);
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Failed to send password reset link.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await axios.put("/api/auth/forgot-password", {
        token: resetToken,
        newPassword,
      });

      if (res.data.success) {
        setResetComplete(true);
        setSuccessMsg(res.data.message);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {resetToken ? "Set a New Password" : "Forgot Password?"}
        </h1>
        <p className="text-xs text-slate-500">
          {resetToken
            ? "Enter your new password below to update your account."
            : "Enter your registered email and we'll send you a reset link."}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>

          {devResetUrl && (
            <div className="pt-2 border-t border-emerald-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">
                Instant Reset Link (Local Dev Mode):
              </span>
              <a
                href={devResetUrl}
                className="block text-center py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
              >
                Click Here to Reset Password Now
              </a>
            </div>
          )}
        </div>
      )}

      {resetToken ? (
        resetComplete ? (
          <Link
            href="/login"
            className="block w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold text-sm shadow-md transition"
          >
            Proceed to Sign In
          </Link>
        ) : (
          <form onSubmit={handleConfirmNewPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save New Password</span>
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Send Reset Link</span>
          </button>
        </form>
      )}

      <div className="pt-2 text-center border-t border-slate-100">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

// 2. Main Page Component (Suspense Wrap ke sath)
export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center p-8 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
