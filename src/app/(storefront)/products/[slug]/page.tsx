import prisma from "../../../../lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import ProductDetailClient from "../../../../components/storefront/ProductDetailClient";
import ProductReviewsSection from "../../../../components/storefront/ProductReviewsSection";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [rawProduct, session] = await Promise.all([
    prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { isPrimary: "desc" } },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!rawProduct) {
    notFound();
  }

  // Check if current logged-in user bought this product and whether they already reviewed it
  let isLoggedIn = false;
  let hasPurchased = false;
  let hasAlreadyReviewed = false;

  if (session?.user?.email || session?.user?.id) {
    const dbUser = session.user.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase().trim() },
        })
      : await prisma.user.findUnique({
          where: { id: session.user.id },
        });

    if (dbUser) {
      isLoggedIn = true;

      const [existingReview, verifiedOrder] = await Promise.all([
        prisma.review.findFirst({
          where: {
            productId: rawProduct.id,
            userId: dbUser.id,
          },
        }),
        prisma.order.findFirst({
          where: {
            userId: dbUser.id,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
            items: {
              some: {
                variant: {
                  productId: rawProduct.id,
                },
              },
            },
          },
        }),
      ]);

      hasAlreadyReviewed = Boolean(existingReview);
      hasPurchased = Boolean(verifiedOrder);
    }
  }

  // Convert Decimal & Date objects for Client Component serialization
  const product = {
    ...rawProduct,
    basePrice: Number(rawProduct.basePrice),
    createdAt: rawProduct.createdAt.toISOString(),
    updatedAt: rawProduct.updatedAt.toISOString(),
    variants: rawProduct.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      costPrice: v.costPrice !== null ? Number(v.costPrice) : null,
    })),
    reviews: rawProduct.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-slate-900">
          Catalog
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?categoryId=${product.category.id}`}
              className="hover:text-slate-900"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold truncate">
          {product.name}
        </span>
      </nav>

      {/* Interactive Image & Variant Selector */}
      <ProductDetailClient product={product} />

      {/* Full Product Description */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-black text-slate-900">
          Product Overview & Specifications
        </h2>
        <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
          {product.description}
        </div>
      </div>

      {/* Verified Buyer Review Section */}
      <ProductReviewsSection
        productId={product.id}
        initialReviews={product.reviews}
        eligibility={{
          isLoggedIn,
          hasPurchased,
          hasAlreadyReviewed,
        }}
      />
    </div>
  );
}
