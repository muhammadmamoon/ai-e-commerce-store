"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await axios.post("/api/newsletter", { email });
      if (res.data.success) {
        setStatus("success");
        setMessage("Subscribed successfully!");
        setEmail("");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Failed to subscribe.");
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={status === "loading" || status === "success"}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success" || !email}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center min-w-[70px] transition"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Join"
          )}
        </button>
      </div>

      {status === "success" && (
        <p className="text-[11px] text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> {message}
        </p>
      )}
      {status === "error" && (
        <p className="text-[11px] text-rose-400">{message}</p>
      )}
    </form>
  );
}
