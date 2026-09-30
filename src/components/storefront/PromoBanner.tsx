"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketPercent, Copy, Check, ArrowRight } from "lucide-react";

export default function PromoBanner({
  initialCoupons = [],
}: {
  initialCoupons?: any[];
}) {
  const [coupons, setCoupons] = useState<any[]>(initialCoupons);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coupons", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const now = new Date();
          const activeOnly = json.data.filter((c: any) => {
            if (!c.isActive) return false;
            const end = new Date(c.endDate);
            end.setHours(23, 59, 59, 999);
            return end >= now;
          });
          setCoupons(activeOnly);
        }
      })
      .catch((err) => console.error("Failed to fetch live coupons:", err));
  }, []);

  if (!coupons || coupons.length === 0) {
    return null;
  }

  const first = coupons[0];
  const headline =
    first.discountType === "PERCENTAGE"
      ? `Take ${Number(first.amount)}% Off Your Order`
      : `Take Rs${Number(first.amount).toFixed(2)} Off Your Order`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-950 p-6 sm:p-10 text-white shadow-xl">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider text-blue-100">
            <TicketPercent className="w-3.5 h-3.5" />
            <span>Limited Time Promotion</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {headline}
          </h2>

          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            {coupons.map((c, idx) => {
              const valStr =
                c.discountType === "PERCENTAGE"
                  ? `${Number(c.amount)}% off`
                  : `Rs${Number(c.amount).toFixed(2)} off`;
              const minStr = c.minPurchase
                ? `on orders over Rs${Number(c.minPurchase).toFixed(2)}`
                : "with no minimum order";

              return (
                <span key={c.id || c.code}>
                  {idx === 0 ? "Use promo code " : " or "}
                  <strong className="px-2 py-0.5 mx-1 rounded bg-white/20 font-mono text-white">
                    {c.code}
                  </strong>
                  for <strong>{valStr}</strong> {minStr}
                  {idx === coupons.length - 1 ? "." : ","}
                </span>
              );
            })}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {coupons.map((c) => {
              const isCopied = copiedCode === c.code;
              const discountText =
                c.discountType === "PERCENTAGE"
                  ? `${Number(c.amount)}% OFF`
                  : `Rs${Number(c.amount).toFixed(2)} OFF`;

              return (
                <button
                  key={c.id || c.code}
                  type="button"
                  onClick={() => handleCopy(c.code)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 transition text-left"
                  title="Click to copy code"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs sm:text-sm text-white">
                        {c.code}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 font-bold text-[10px]">
                        {discountText}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-100 block">
                      {c.minPurchase
                        ? `Min. Order: Rs${Number(c.minPurchase).toFixed(2)}`
                        : "No minimum order"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-blue-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition"
          >
            <span>Claim Offer Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
