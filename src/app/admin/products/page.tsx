"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  ShoppingBag,
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  Sparkles,
  Upload,
  Star,
  Flame,
  AlertTriangle,
  Loader2,
  X,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import {
  CategoryNode,
  flattenCategoryTree,
  slugify,
} from "../../../lib/category-utils";

interface VariantForm {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
}

interface ImageForm {
  url: string;
  isPrimary: boolean;
}

interface ProductFormState {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDesc: string;
  description: string;
  basePrice: number;
  isFeatured: boolean;
  isHot: boolean;
  // NAYE FIELDS YAHAN ADD KIYE:
  shippingFee: number;
  isFreeShipping: boolean;
  // ...
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  variants: VariantForm[];
  images: ImageForm[];
}

const emptyVariant: VariantForm = {
  name: "Standard Edition",
  sku: "",
  barcode: "",
  price: 99.99,
  costPrice: 50.0,
  stock: 25,
  lowStockAlert: 5,
};

const initialProductForm: ProductFormState = {
  name: "",
  slug: "",
  categoryId: "",
  shortDesc: "",
  description: "",
  basePrice: 99.99,
  isFeatured: false,
  isHot: false,
  // NAYE FIELDS KI INITIAL STATE:
  shippingFee: 0,
  isFreeShipping: false,
  seoTitle: "",
  seoDesc: "",
  seoKeywords: "",
  variants: [{ ...emptyVariant }],
  images: [],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] =
    useState<ProductFormState>(initialProductForm);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Image Input Helper State
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // AI Generator State
  const [aiFeaturesInput, setAiFeaturesInput] = useState(
    "5000mAh battery, 256GB NVMe storage, 12GB RAM",
  );
  const [generatingAi, setGeneratingAi] = useState(false);

  const flatCategories = useMemo(
    () => flattenCategoryTree(categoryTree),
    [categoryTree],
  );

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        axios.get("/api/products", {
          params: {
            search,
            categoryId: selectedCatFilter || undefined,
            limit: 50,
          },
        }),
        axios.get("/api/categories"),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategoryTree(catRes.data.data.tree);
    } catch (err) {
      console.error("Error loading catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCatFilter]);

  const openCreateModal = () => {
    const defaultCategoryId = flatCategories[0]?.id || "";
    const randomSku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData({
      ...initialProductForm,
      categoryId: defaultCategoryId,
      variants: [{ ...emptyVariant, sku: randomSku }],
      images: [],
    });
    setIsEditing(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setFormData({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      shortDesc: product.shortDesc || "",
      description: product.description || "",
      basePrice: Number(product.basePrice),
      isFeatured: Boolean(product.isFeatured),
      isHot: Boolean(product.isHot),
      // DATA EDIT HONE PAR STATE MEIN SAVE KAREIN:
      shippingFee: Number(product.shippingFee || 0),
      isFreeShipping: Boolean(product.isFreeShipping),
      seoTitle: product.seoTitle || "",
      seoDesc: product.seoDesc || "",
      seoKeywords: product.seoKeywords || "",
      variants: product.variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode || "",
        price: Number(v.price),
        costPrice: v.costPrice ? Number(v.costPrice) : 0,
        stock: Number(v.stock),
        lowStockAlert: Number(v.lowStockAlert || 10),
      })),
      images: product.images.map((img: any) => ({
        url: img.url,
        isPrimary: Boolean(img.isPrimary),
      })),
    });
    setIsEditing(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (product: any) => {
    try {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const payload = {
        name: `${product.name} (Copy)`,
        slug: `${product.slug}-copy-${rand}`,
        categoryId: product.categoryId,
        shortDesc: product.shortDesc,
        description: product.description,
        basePrice: Number(product.basePrice),
        isFeatured: false,
        isHot: false,
        // DUPLICATE MEIN BHI FIELDS SAVE HONGY:
        shippingFee: Number(product.shippingFee || 0),
        isFreeShipping: Boolean(product.isFreeShipping),
        seoTitle: product.seoTitle,
        seoDesc: product.seoDesc,
        seoKeywords: product.seoKeywords,
        variants: product.variants.map((v: any, idx: number) => ({
          name: v.name,
          sku: `${v.sku}-COPY-${rand}-${idx + 1}`,
          barcode: null,
          price: Number(v.price),
          costPrice: v.costPrice ? Number(v.costPrice) : 0,
          stock: Number(v.stock),
          lowStockAlert: Number(v.lowStockAlert || 10),
        })),
        images:
          product.images.length > 0
            ? product.images.map((img: any) => ({
                url: img.url,
                isPrimary: img.isPrimary,
              }))
            : [
                {
                  url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
                  isPrimary: true,
                },
              ],
      };

      await axios.post("/api/products", payload);
      await fetchCatalog();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to duplicate product.");
    }
  };

  const handleDelete = async (product: any) => {
    if (!confirm(`Delete "${product.name}" permanently?`)) return;
    try {
      await axios.delete(`/api/products/${product.id}`);
      await fetchCatalog();
    } catch (error: any) {
      alert(error.response?.data?.message || "Could not delete product.");
    }
  };

  // AI Copywriter Trigger
  const handleGenerateWithAI = async () => {
    if (!formData.name.trim()) {
      setErrorMsg(
        "Enter a Product Name first so the AI knows what to write about.",
      );
      return;
    }

    setGeneratingAi(true);
    setErrorMsg(null);

    try {
      const selectedCat = flatCategories.find(
        (c) => c.id === formData.categoryId,
      );
      const features = aiFeaturesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await axios.post("/api/ai/product-description", {
        name: formData.name,
        categoryName: selectedCat?.name || "General",
        features:
          features.length > 0
            ? features
            : ["Premium quality", "Official warranty"],
      });

      if (res.data.success) {
        const ai = res.data.data;
        setFormData((prev) => ({
          ...prev,
          shortDesc: ai.shortDesc || prev.shortDesc,
          description: ai.description || prev.description,
          seoTitle: ai.seoTitle || prev.seoTitle,
          seoDesc: ai.seoDesc || prev.seoDesc,
          seoKeywords: ai.seoKeywords || prev.seoKeywords,
        }));
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "AI generation failed.");
    } finally {
      setGeneratingAi(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await axios.post("/api/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        const newUrl = res.data.data.url;
        setFormData((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            { url: newUrl, isPrimary: prev.images.length === 0 },
          ],
        }));
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const addImageByUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url: imageUrlInput.trim(), isPrimary: prev.images.length === 0 },
      ],
    }));
    setImageUrlInput("");
  };

  const setPrimaryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return { ...prev, images: filtered };
    });
  };

  // Variant Handlers
  const addVariantRow = () => {
    const randomSku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          ...emptyVariant,
          name: `Variant #${prev.variants.length + 1}`,
          sku: randomSku,
          price: prev.basePrice,
        },
      ],
    }));
  };

  const updateVariantField = (
    index: number,
    field: keyof VariantForm,
    value: any,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const removeVariantRow = (index: number) => {
    if (formData.variants.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (isEditing && formData.id) {
        await axios.put(`/api/products/${formData.id}`, formData);
      } else {
        await axios.post("/api/products", formData);
      }
      setIsModalOpen(false);
      await fetchCatalog();
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.message ||
          "Validation failed. Ensure all SKUs are unique and at least 1 image is added.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-blue-500" />
            <span>Products & Multi-Variant Catalog</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage products, dynamic SKU variants, stock levels, and
            AI-generated SEO copy.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCatalog();
          }}
          className="relative flex-1 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition"
          >
            Search
          </button>
        </form>

        <select
          value={selectedCatFilter}
          onChange={(e) => setSelectedCatFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {flatCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.fullPath}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-sm">Loading product inventory...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              No products in catalog
            </p>
            <p className="text-xs text-slate-500">
              Click &ldquo;Add New Product&rdquo; to create your first item with
              variants and AI copy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Variants & SKUs</th>
                  <th className="py-3.5 px-4">Total Stock</th>
                  <th className="py-3.5 px-4">Badges</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {products.map((product) => {
                  const primaryImg =
                    product.images?.find((i: any) => i.isPrimary)?.url ||
                    product.images?.[0]?.url;
                  const totalStock = product.variants.reduce(
                    (acc: number, v: any) => acc + Number(v.stock),
                    0,
                  );
                  const hasLowStock = product.variants.some(
                    (v: any) =>
                      Number(v.stock) <= Number(v.lowStockAlert || 10),
                  );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-900/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {primaryImg ? (
                              <img
                                src={primaryImg}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {product.name}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              /{product.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {product.category?.name || "Uncategorized"}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        Rs{Number(product.basePrice).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-300 font-medium">
                          {product.variants.length} Variant(s)
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
                          {product.variants.map((v: any) => v.sku).join(", ")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              totalStock === 0
                                ? "text-rose-400"
                                : hasLowStock
                                  ? "text-amber-400"
                                  : "text-white"
                            }`}
                          >
                            {totalStock} units
                          </span>
                          {hasLowStock && (
                            <span
                              title="One or more variants are below low-stock threshold"
                              className="inline-flex items-center"
                            >
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Star className="w-3 h-3" /> Featured
                            </span>
                          )}
                          {product.isHot && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <Flame className="w-3 h-3" /> Hot
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicate(product)}
                            title="Duplicate Product"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full-Featured Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-white">
                {isEditing
                  ? `Edit Product: ${formData.name}`
                  : "Add New Catalog Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6 space-y-8 flex-1"
            >
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* 1. Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug: isEditing ? prev.slug : slugify(name),
                      }));
                    }}
                    placeholder="e.g., iPhone 17 Pro"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="">Select Category</option>
                    {flatCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullPath}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: slugify(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Base Display Price (Rs) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        basePrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                {/* NEW: Shipping Fields Added Here */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Shipping Fee (Rs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shippingFee}
                      disabled={formData.isFreeShipping}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          shippingFee: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col justify-end h-full pb-2">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFreeShipping}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isFreeShipping: e.target.checked,
                            shippingFee: e.target.checked
                              ? 0
                              : prev.shippingFee,
                          }))
                        }
                        className="rounded bg-slate-900 border-slate-700 text-blue-600"
                      />
                      <span>Free</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-5 md:col-span-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isFeatured: e.target.checked,
                        }))
                      }
                      className="rounded bg-slate-900 border-slate-700 text-blue-600"
                    />
                    <span>Featured</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isHot}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isHot: e.target.checked,
                        }))
                      }
                      className="rounded bg-slate-900 border-slate-700 text-rose-600"
                    />
                    <span>Hot Product</span>
                  </label>
                </div>
              </div>

              {/* 2. AI Copywriter & SEO Assistant Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/50 via-indigo-950/30 to-slate-900 border border-blue-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>AI Copywriter & Metadata Generator</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={generatingAi}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
                  >
                    {generatingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Generate with AI</span>
                  </button>
                </div>
              </div>

              {/* 3. Descriptions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Short Summary
                  </label>
                  <input
                    type="text"
                    value={formData.shortDesc}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shortDesc: e.target.value,
                      }))
                    }
                    placeholder="Brief 1-sentence hook shown on product cards and top of page..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Full Product Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              {/* 4. Multi-Variant Inventory Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Product Variants & Stock Matrix *
                    </h4>
                    <p className="text-xs text-slate-400">
                      Configure SKUs, pricing, and low-stock alert thresholds
                      per variant (e.g., Color / Storage).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 items-end"
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          Variant Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={v.name}
                          onChange={(e) =>
                            updateVariantField(idx, "name", e.target.value)
                          }
                          placeholder="256GB Black"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          SKU *
                        </label>
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) =>
                            updateVariantField(idx, "sku", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          Sale Price (Rs) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={v.price}
                          onChange={(e) =>
                            updateVariantField(
                              idx,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          Stock Qty *
                        </label>
                        <input
                          type="number"
                          required
                          value={v.stock}
                          onChange={(e) =>
                            updateVariantField(
                              idx,
                              "stock",
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          Low Stock Alert
                        </label>
                        <input
                          type="number"
                          value={v.lowStockAlert}
                          onChange={(e) =>
                            updateVariantField(
                              idx,
                              "lowStockAlert",
                              parseInt(e.target.value, 10) || 5,
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={formData.variants.length <= 1}
                          onClick={() => removeVariantRow(idx)}
                          className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                          title="Remove variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Product Images Gallery & Upload */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">
                  Product Images *
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 shrink-0">
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-blue-400" />
                    )}
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or paste direct image URL (https://...)"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={addImageByUrl}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {formData.images.map((img, i) => (
                      <div
                        key={i}
                        className={`relative group rounded-xl overflow-hidden border ${
                          img.isPrimary
                            ? "border-blue-500 ring-2 ring-blue-500/30"
                            : "border-slate-800"
                        } bg-slate-900 aspect-square`}
                      >
                        <img
                          src={img.url}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/75 backdrop-blur-xs flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(i)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              img.isPrimary
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {img.isPrimary ? "Primary" : "Set Primary"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. SEO Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seoTitle: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    SEO Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.seoKeywords}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seoKeywords: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    SEO Meta Description
                  </label>
                  <input
                    type="text"
                    value={formData.seoDesc}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seoDesc: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>
                    {isEditing ? "Update Product" : "Publish Product"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
