"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  CornerDownRight,
  Layers,
  X,
} from "lucide-react";
import {
  CategoryNode,
  flattenCategoryTree,
  slugify,
} from "../../../lib/category-utils";

interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  isActive: boolean;
}

const initialFormState: FormState = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: "",
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/categories");
      if (res.data.success) {
        setTree(res.data.data.tree);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Flattened list with depth and full breadcrumb path
  const flattenedCategories = useMemo(() => flattenCategoryTree(tree), [tree]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return flattenedCategories;
    const q = searchQuery.toLowerCase();
    return flattenedCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        cat.fullPath.toLowerCase().includes(q),
    );
  }, [flattenedCategories, searchQuery]);

  const openCreateModal = (presetParentId = "") => {
    setFormData({ ...initialFormState, parentId: presetParentId });
    setIsEditing(false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryNode) => {
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      parentId: cat.parentId || "",
      isActive: cat.isActive,
    });
    setIsEditing(true);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || slugify(formData.name),
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        parentId: formData.parentId || null,
        isActive: formData.isActive,
      };

      if (isEditing && formData.id) {
        await axios.put(`/api/categories/${formData.id}`, payload);
      } else {
        await axios.post("/api/categories", payload);
      }

      setIsModalOpen(false);
      await fetchCategories();
    } catch (error: any) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Operation failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: CategoryNode) => {
    try {
      await axios.put(`/api/categories/${cat.id}`, {
        isActive: !cat.isActive,
      });
      await fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || "Could not update status.");
    }
  };

  const handleDelete = async (cat: CategoryNode) => {
    if (!confirm(`Are you sure you want to delete "${cat.name}"?`)) return;

    try {
      await axios.delete(`/api/categories/${cat.id}`);
      await fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-blue-500" />
            <span>Category Hierarchy</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage parent categories, unlimited nested subcategories, and SEO
            slugs.
          </p>
        </div>

        <button
          onClick={() => openCreateModal("")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, slug, or hierarchy path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Total Categories:</span>
            <strong className="text-white">{flattenedCategories.length}</strong>
          </div>
        </div>
      </div>

      {/* Categories Hierarchy Table */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-sm">Loading category tree...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FolderTree className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              No categories found
            </p>
            <p className="text-xs text-slate-500">
              Create your first root category to begin organizing your catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="py-3.5 px-4">Category & Hierarchy</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Full Path</th>
                  <th className="py-3.5 px-4 text-center">Products</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-900/50 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${cat.depth * 1.5}rem` }}
                      >
                        {cat.depth > 0 && (
                          <CornerDownRight className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-white">
                            {cat.name}
                          </span>
                          {cat.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      /{cat.slug}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {cat.fullPath}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                        {cat._count?.products ?? 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          cat.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {cat.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openCreateModal(cat.id)}
                          title="Add Subcategory inside this category"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition text-xs font-medium"
                        >
                          + Sub
                        </button>
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="Delete Category"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {isEditing ? "Edit Category" : "Create New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category Name *
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
                  placeholder="e.g., Mobile Phones"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
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
                  placeholder="mobile-phones"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      parentId: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">— Root Category (No Parent) —</option>
                  {flattenedCategories
                    .filter((c) => c.id !== formData.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullPath}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief summary for category header and SEO meta description..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category Banner / Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      imageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isActiveCheckbox"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <label
                  htmlFor="isActiveCheckbox"
                  className="text-sm text-slate-300"
                >
                  Visible on storefront
                </label>
              </div>

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
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEditing ? "Save Changes" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
