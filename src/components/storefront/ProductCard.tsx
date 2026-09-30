"use client";

import Link from "next/link";
import { useCartStore } from "../../store/useCartStore";
import { ShoppingCart, Flame, Star, Eye } from "lucide-react";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const primaryImage =
    product.images?.find((img: any) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

  const defaultVariant = product.variants?.[0];
  const totalStock =
    product.variants?.reduce(
      (sum: number, v: any) => sum + Number(v.stock),
      0,
    ) ?? 0;

  const displayPrice = defaultVariant
    ? Number(defaultVariant.price)
    : Number(product.basePrice);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!defaultVariant || Number(defaultVariant.stock) <= 0) return;

    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: defaultVariant.id,
      variantName: defaultVariant.name,
      sku: defaultVariant.sku,
      price: Number(defaultVariant.price),
      quantity: 1,
      maxStock: Number(defaultVariant.stock),
      image: primaryImage,
      shippingFee: Number(product.shippingFee || 0),
      isFreeShipping: Boolean(product.isFreeShipping),
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-square bg-slate-100 overflow-hidden"
        >
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isHot && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-sm">
                <Flame className="w-3 h-3 fill-current" /> HOT
              </span>
            )}
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm">
                <Star className="w-3 h-3 fill-current" /> FEATURED
              </span>
            )}
          </div>

          {totalStock === 0 && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
            {product.category?.name || "Catalog"}
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {product.shortDesc && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {product.shortDesc}
            </p>
          )}
        </div>
      </div>

      {/* Price & Action Footer */}
      <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-slate-100">
        <div>
          <span className="text-xs text-slate-400 block">Price</span>
          <span className="text-base font-extrabold text-slate-900">
            Rs {displayPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/products/${product.slug}`}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="View options"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={handleQuickAdd}
            disabled={totalStock === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
