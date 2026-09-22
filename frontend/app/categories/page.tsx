"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
} from "../../lib/api";

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"need" | "want">("need");

  // ---------------------------------------
  // Load categories
  // ---------------------------------------

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await getCategories();

      setCategories(data.categories);
    } catch (error) {
      console.error("Failed to load categories:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load categories.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // ---------------------------------------
  // Reset form
  // ---------------------------------------

  function resetForm() {
    setName("");
    setType("need");
    setEditingCategory(null);
    setShowForm(false);
  }

  // ---------------------------------------
  // Add category
  // ---------------------------------------

  function handleAddCategory() {
    setName("");
    setType("need");
    setEditingCategory(null);
    setError("");
    setShowForm(true);
  }

  // ---------------------------------------
  // Edit category
  // ---------------------------------------

  function handleEditCategory(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setError("");
    setShowForm(true);
  }

  // ---------------------------------------
  // Submit
  // ---------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          type,
        });
      } else {
        await createCategory({
          name: name.trim(),
          type,
        });
      }

      await loadCategories();

      resetForm();
    } catch (error) {
      console.error("Failed to save category:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save category.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------
  // Delete
  // ---------------------------------------

  async function handleDeleteCategory(
    category: Category
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteCategory(category.id);

      await loadCategories();
    } catch (error) {
      console.error(
        "Failed to delete category:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete category.");
      }
    }
  }

  const needs = categories.filter(
    (category) => category.type === "need"
  );

  const wants = categories.filter(
    (category) => category.type === "want"
  );

  // ---------------------------------------
  // Category card
  // ---------------------------------------

  function CategoryCard({
    category,
  }: {
    category: Category;
  }) {
    return (
      <div className="rounded-2xl border border-[#e5e8e1] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${
                category.type === "need"
                  ? "bg-[#eaf3ed]"
                  : "bg-[#fff5df]"
              }`}
            >
              {category.type === "need" ? "🏠" : "✨"}
            </div>

            <div>
              <h3 className="font-semibold text-[#172117]">
                {category.name}
              </h3>

              <span
                className={`mt-1 inline-block text-xs font-medium ${
                  category.type === "need"
                    ? "text-[#173b2a]"
                    : "text-[#7c5a20]"
                }`}
              >
                {category.type === "need"
                  ? "Need"
                  : "Want"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                handleEditCategory(category)
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                handleDeleteCategory(category)
              }
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#172117]">
      {/* Header */}
      <header className="border-b border-[#e5e8e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              Categories
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Organize your expenses into needs and wants
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Categories
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#173b2a]">
              {categories.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Needs
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#173b2a]">
              {needs.length}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Essential spending categories
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Wants
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#7c5a20]">
              {wants.length}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Non-essential spending categories
            </p>
          </div>
        </div>

        {/* Add category */}
        <div className="mb-8 flex flex-col gap-5 rounded-2xl bg-[#173b2a] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">
              Organize your spending
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              Create a new category
            </h2>
          </div>

          <button
            type="button"
            onClick={handleAddCategory}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#173b2a] transition hover:bg-gray-100"
          >
            + Add Category
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choose whether this category is a need
                  or a want.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 md:grid-cols-2"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="categoryName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Category Name
                </label>

                <input
                  id="categoryName"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Groceries"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                />
              </div>

              {/* Type */}
              <div>
                <label
                  htmlFor="categoryType"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Category Type
                </label>

                <select
                  id="categoryType"
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value as
                        | "need"
                        | "want"
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                >
                  <option value="need">
                    Need — Essential
                  </option>

                  <option value="want">
                    Want — Non-essential
                  </option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#173b2a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories */}
        {loading ? (
          <div className="rounded-2xl border border-[#e5e8e1] bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading categories...
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Needs */}
            <section className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Needs
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Essential expenses
                  </p>
                </div>

                <span className="rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-semibold text-[#173b2a]">
                  {needs.length}
                </span>
              </div>

              {needs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    No need categories yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {needs.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Wants */}
            <section className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Wants
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Non-essential expenses
                  </p>
                </div>

                <span className="rounded-full bg-[#fff5df] px-3 py-1 text-xs font-semibold text-[#7c5a20]">
                  {wants.length}
                </span>
              </div>

              {wants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    No want categories yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wants.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}