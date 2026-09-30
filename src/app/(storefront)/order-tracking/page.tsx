import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function OrderTrackingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <PackageSearch className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Track Your Order</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          To track your order status, please sign in to your account or check
          the shipping confirmation email sent to you.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition"
          >
            Login to Track
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
          >
            Need Help?
          </Link>
        </div>
      </div>
    </div>
  );
}
