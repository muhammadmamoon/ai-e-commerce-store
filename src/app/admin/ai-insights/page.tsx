"use client";

import { useState } from "react";
import axios from "axios";
import { Sparkles, Send, Loader2, Bot, User, ShieldCheck } from "lucide-react";

const QUICK_PROMPTS = [
  "Give me a complete sales summary.",
  "Which products are likely to run out of stock?",
  "What category generated the most revenue this month?",
  "Which products should I discount or promote?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AdminAiInsightsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your grounded AI Sales & Inventory Analyst. Every insight I provide is calculated directly from your live MySQL database. Select a prompt below or ask a custom question.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const askAssistant = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userMsg = questionText.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/ai/sales-assistant", {
        question: userMsg,
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.data.data.answer },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.response?.data?.message ||
            "Unable to analyze store metrics right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-950 border border-blue-500/30">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span>AI Sales Assistant & Executive Advisor</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Zero-hallucination architecture: queries live MySQL orders,
            variants, and velocity before answering.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>Grounded in MySQL</span>
        </div>
      </div>

      {/* Quick Question Chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => askAssistant(prompt)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-xs font-medium text-slate-200 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Conversation Window */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col h-[500px] overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-slate-900 border border-slate-800 text-slate-200"
                }`}
              >
                {m.content}
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>
                Querying MySQL tables and generating analytical insights...
              </span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            askAssistant(input);
          }}
          className="p-4 border-t border-slate-800 bg-slate-900/60 flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about fastest selling items, low stock risks, or category growth..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
}
