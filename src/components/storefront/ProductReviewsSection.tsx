"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Star,
  MessageSquarePlus,
  CheckCircle2,
  Loader2,
  UserCheck,
  ShieldAlert,
  Lock,
} from "lucide-react";

interface ReviewEligibility {
  isLoggedIn: boolean;
  hasPurchased: boolean;
  hasAlreadyReviewed: boolean;
}

interface ProductReviewsSectionProps {
  productId: string;
  initialReviews: any[];
  eligibility: ReviewEligibility;
}

export default function ProductReviewsSection({
  productId,
  initialReviews,
  eligibility,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<any[]>(initialReviews || []);
  const [hasReviewed, setHasReviewed] = useState<boolean>(
    eligibility.hasAlreadyReviewed,
  );

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + Number(r.rating), 0) / reviews.length
        ).toFixed(1)
      : "5.0";

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || hasReviewed) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post("/api/reviews", {
        productId,
        rating,
        comment: comment.trim(),
      });

      if (res.data.success) {
        setReviews((prev) => [res.data.data, ...prev]);
        setComment("");
        setRating(5);
        setHasReviewed(true); // Lock form immediately after 1 review
        setSuccessMsg(
          "Thank you! Your verified buyer review has been published.",
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to submit review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Eligibility Status & Write Review Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5 h-fit">
        <div className="flex items-center gap-2.5">
          <MessageSquarePlus className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-black text-slate-900">Customer Rating</h3>
        </div>

        {/* Average Rating Summary Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Overall Rating</span>
            <span className="text-2xl font-black text-slate-900">
              {avgRating} / 5.0
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-0.5 text-amber-500 justify-end">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-xs text-slate-500">
              Based on {reviews.length} review(s)
            </span>
          </div>
        </div>

        {/* CASE 1: Not Logged In */}
        {!eligibility.isLoggedIn && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <Lock className="w-6 h-6 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Verified Buyers Only
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Only customers who have purchased this product and signed in with
              the same email can post a review.
            </p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              Sign In to Verify Purchase
            </Link>
          </div>
        )}

        {/* CASE 2: Logged In, But Already Submitted 1 Review */}
        {eligibility.isLoggedIn && hasReviewed && (
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Review Already Submitted</span>
            </div>
            <p className="text-xs text-emerald-800/90 leading-relaxed">
              {successMsg ||
                "You have already reviewed this product. To maintain authentic ratings, each verified buyer can submit only 1 review per product."}
            </p>
          </div>
        )}

        {/* CASE 3: Logged In, But Has NOT Purchased This Product */}
        {eligibility.isLoggedIn &&
          !hasReviewed &&
          !eligibility.hasPurchased && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Verified Purchase Required</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                You can read all customer reviews on the right, but only
                shoppers who have purchased this item using this account are
                eligible to post a review.
              </p>
            </div>
          )}

        {/* CASE 4: Eligible Verified Buyer (Purchased & 0 Previous Reviews) */}
        {eligibility.isLoggedIn && eligibility.hasPurchased && !hasReviewed && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Verified Buyer — Eligible to post 1 review</span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Interactive Star Rating Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Select Your Rating *
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= (hoverRating || rating);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          isFilled
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {rating} {rating === 1 ? "Star" : "Stars"}
                </span>
              </div>
            </div>

            {/* Review Comment Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Your Review Comment *
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your honest experience with this product..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Verified Review</span>
            </button>
          </form>
        )}
      </div>

      {/* Right Column: Publicly Visible Customer Reviews List */}
      <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-black text-slate-900">
            Verified Customer Reviews ({reviews.length})
          </h2>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <UserCheck className="w-4 h-4" />
            <span>100% Verified Buyers</span>
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">
              No reviews yet for this product
            </p>
            <p className="text-xs text-slate-500">
              Reviews from verified buyers who purchase this item will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev: any) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {(rev.user?.name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {rev.user?.name || "Verified Buyer"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          Verified Purchase
                        </span>
                      </div>
                      {rev.createdAt && (
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: Number(rev.rating) || 5 }).map(
                      (_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ),
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
