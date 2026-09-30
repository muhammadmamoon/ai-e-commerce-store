import { ShieldCheck } from "lucide-react";

export default function WarrantyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <ShieldCheck className="w-10 h-10 text-emerald-500" />
        <h1 className="text-4xl font-black text-slate-900">
          Official Warranty Policy
        </h1>
      </div>
      <div className="prose prose-slate max-w-none text-slate-600 space-y-6 text-sm leading-relaxed">
        <p>
          At AI Commerce, we stand behind the quality of our flagship tech
          products. Every product purchased directly from our store comes with a
          standard <strong>1-Year Manufacturer Warranty</strong>.
        </p>
        <h3 className="text-lg font-bold text-slate-900">What is Covered?</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Hardware defects out of the box.</li>
          <li>Internal electronic failures not caused by user error.</li>
        </ul>
        <h3 className="text-lg font-bold text-slate-900">
          What is NOT Covered?
        </h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Accidental drops, water damage, or physical misuse.</li>
          <li>Normal wear and tear (battery degradation over time).</li>
        </ul>
        <p>
          If you experience any issues, please contact our support team with
          your Order ID.
        </p>
      </div>
    </div>
  );
}
