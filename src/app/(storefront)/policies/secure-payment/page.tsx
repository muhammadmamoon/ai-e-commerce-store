import { Lock } from "lucide-react";

export default function SecurePaymentPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Lock className="w-10 h-10 text-blue-500" />
        <h1 className="text-4xl font-black text-slate-900">
          Secure Payment Guarantee
        </h1>
      </div>
      <div className="prose prose-slate max-w-none text-slate-600 space-y-6 text-sm leading-relaxed">
        <p>
          Your security is our top priority. We employ state-of-the-art
          encryption technologies to ensure that your payment data is strictly
          protected.
        </p>
        <h3 className="text-lg font-bold text-slate-900">
          100% Encrypted Transactions
        </h3>
        <p>
          All transactions are processed over a secure SSL (Secure Socket Layer)
          connection. Your credit card information is encrypted and transmitted
          directly to our secure payment gateway (Stripe). We{" "}
          <strong>never</strong> store your credit card details on our servers.
        </p>
        <h3 className="text-lg font-bold text-slate-900">Fraud Protection</h3>
        <p>
          Our AI-powered systems automatically scan transactions for suspicious
          activity. If an anomaly is detected, the transaction is flagged and
          reviewed manually to protect both the customer and our store.
        </p>
      </div>
    </div>
  );
}
