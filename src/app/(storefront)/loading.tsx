import { Loader2 } from "lucide-react";

export default function StorefrontLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
        Loading Storefront...
      </p>
    </div>
  );
}
