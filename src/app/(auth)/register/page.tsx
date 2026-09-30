"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  Phone,
  Loader2,
  AlertCircle,
  MailCheck,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await axios.post("/api/auth/register", {
        name,
        email,
        phone,
        password,
      });

      if (res.data.success) {
        setRegisteredSuccess(true);
        if (res.data.devVerifyUrl) {
          setDevVerifyUrl(res.data.devVerifyUrl);
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Failed to create account. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="text-center space-y-5 py-2">
        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
          <MailCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          We&apos;ve sent a verification link to{" "}
          <strong className="text-slate-900">{email}</strong>. Please click the
          link in your email to activate your account before signing in.
        </p>

        {devVerifyUrl && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-left space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Instant Verification (Local Dev Mode):
            </span>
            <a
              href={devVerifyUrl}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl block text-center transition"
            >
              Click Here to Verify Account Now
            </a>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/login"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Return to Sign In →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
        <p className="text-sm text-slate-500">
          Sign up with Google or register with your email
        </p>
      </div>

      {/* Continue with Google */}
      <button
        type="button"
        onClick={() => {
          setGoogleLoading(true);
          signIn("google", { callbackUrl: "/" });
        }}
        disabled={googleLoading || loading}
        className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 flex items-center justify-center gap-3 shadow-2xs transition disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-3 text-xs uppercase tracking-wider text-slate-400 font-medium">
          Or register with email
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0199"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Password (Min. 6 chars) *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
