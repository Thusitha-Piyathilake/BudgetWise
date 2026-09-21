"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createExpense,
  deleteExpense,
  getCategories,
  getExpenses,
  updateExpense,
  type Category,
  type Expense,
} from "../../lib/api";

export default function ExpensesPage() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");

  // ---------------------------------------
  // Load expenses and categories
  // ---------------------------------------

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [expenseData, categoryData] =
        await Promise.all([
          getExpenses(),
          getCategories(),
        ]);

      setExpenses(expenseData.expenses);
      setCategories(categoryData.categories);
    } catch (error) {
      console.error("Failed to load expense data:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load expense data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------
  // Reset form
  // ---------------------------------------

  function resetForm() {
    setAmount("");
    setDescription("");
    setCategoryId("");
    setDate("");
    setEditingExpense(null);
    setShowForm(false);
  }

  // ---------------------------------------
  // Open Add form
  // ---------------------------------------

  function handleAddExpense() {
    setEditingExpense(null);
    setAmount("");
    setDescription("");
    setCategoryId("");
    setDate(
      new Date().toISOString().split("T")[0]
    );
    setError("");
    setShowForm(true);
  }

  // ---------------------------------------
  // Open Edit form
  // ---------------------------------------

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);

    setAmount(expense.amount);
    setDescription(expense.description ?? "");
    setCategoryId(String(expense.category_id));
    setDate(expense.date.substring(0, 10));

    setError("");
    setShowForm(true);
  }

  // ---------------------------------------
  // Submit form
  // ---------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);
    const numericCategoryId = Number(categoryId);

    if (!amount || numericAmount <= 0) {
      setError(
        "Please enter a valid amount greater than 0."
      );
      return;
    }

    if (!categoryId || numericCategoryId <= 0) {
      setError("Please select a category.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    try {
      setSaving(true);

      const expenseData = {
        category_id: numericCategoryId,
        amount: numericAmount,
        description: description.trim(),
        date,
      };

      if (editingExpense) {
        await updateExpense(
          editingExpense.id,
          expenseData
        );
      } else {
        await createExpense(expenseData);
      }

      await loadData();

      resetForm();
    } catch (error) {
      console.error("Failed to save expense:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save expense.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------
  // Delete expense
  // ---------------------------------------

  async function handleDeleteExpense(
    expense: Expense
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete this expense of LKR ${Number(
        expense.amount
      ).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteExpense(expense.id);

      await loadData();
    } catch (error) {
      console.error(
        "Failed to delete expense:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete expense.");
      }
    }
  }

  // ---------------------------------------
  // Total expenses
  // ---------------------------------------

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount),
    0
  );

  // ---------------------------------------
  // Needs total
  // ---------------------------------------

  const totalNeeds = expenses
    .filter(
      (expense) =>
        expense.category?.type === "need"
    )
    .reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    );

  // ---------------------------------------
  // Wants total
  // ---------------------------------------

  const totalWants = expenses
    .filter(
      (expense) =>
        expense.category?.type === "want"
    )
    .reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    );

  // ---------------------------------------
  // Format date
  // ---------------------------------------

  function formatDate(dateString: string) {
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      return dateString.substring(0, 10);
    }

    return parsedDate.toLocaleDateString(
      "en-LK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  // ---------------------------------------
  // Format money
  // ---------------------------------------

  function formatMoney(amount: number) {
    return amount.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
              Expenses
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and track your spending
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

        {/* Summary cards */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {/* Total */}
          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Expenses
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              LKR {formatMoney(totalExpenses)}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {expenses.length}{" "}
              {expenses.length === 1
                ? "expense"
                : "expenses"}
            </p>
          </div>

          {/* Needs */}
          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Needs
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#173b2a]">
              LKR {formatMoney(totalNeeds)}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Essential spending
            </p>
          </div>

          {/* Wants */}
          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Wants
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#7c5a20]">
              LKR {formatMoney(totalWants)}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Non-essential spending
            </p>
          </div>
        </div>

        {/* Add expense card */}
        <div className="mb-8 flex flex-col gap-5 rounded-2xl bg-[#173b2a] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">
              Track your spending
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              Add a new expense
            </h2>
          </div>

          <button
            type="button"
            onClick={handleAddExpense}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#173b2a] transition hover:bg-gray-100"
          >
            + Add Expense
          </button>
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingExpense
                    ? "Edit Expense"
                    : "Add Expense"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingExpense
                    ? "Update your expense details."
                    : "Enter the details of your new expense."}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  You need to create a category before
                  adding an expense.
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  Category management will be available
                  from the Categories section.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="grid gap-5 md:grid-cols-2"
              >
                {/* Amount */}
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                      LKR
                    </span>

                    <input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value
                        )
                      }
                      placeholder="5000"
                      required
                      className="w-full rounded-xl border border-gray-200 py-3 pl-14 pr-4 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>

                  <select
                    id="category"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                  >
                    <option value="">
                      Select a category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name} (
                        {category.type === "need"
                          ? "Need"
                          : "Want"}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <input
                    id="description"
                    type="text"
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Monthly groceries"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                  />
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Date
                  </label>

                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                  />
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
                      : editingExpense
                      ? "Update Expense"
                      : "Save Expense"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Expense history */}
        <div className="rounded-2xl border border-[#e5e8e1] bg-white shadow-sm">
          <div className="border-b border-[#e5e8e1] px-6 py-5">
            <h2 className="text-xl font-bold">
              Expense History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              All your recorded expenses
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                Loading expenses...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fceeee] text-2xl">
                💳
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No expenses yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add your first expense to start tracking
                your spending.
              </p>

              <button
                type="button"
                onClick={handleAddExpense}
                className="mt-5 rounded-xl bg-[#173b2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c]"
              >
                + Add Expense
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e8e1] bg-[#fafbf9] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Description
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Category
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Date
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-[#eef0ec] last:border-b-0"
                      >
                        {/* Description */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fceeee] text-lg">
                              💳
                            </div>

                            <div>
                              <p className="font-semibold text-[#172117]">
                                {expense.description ||
                                  "Expense"}
                              </p>

                              <p className="text-xs text-gray-400">
                                Expense #
                                {expense.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-1">
                            <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              {expense.category
                                ?.name ||
                                "Unknown"}
                            </span>

                            {expense.category && (
                              <span
                                className={`text-xs font-medium ${
                                  expense.category
                                    .type === "need"
                                    ? "text-[#173b2a]"
                                    : "text-[#7c5a20]"
                                }`}
                              >
                                {expense.category
                                  .type === "need"
                                  ? "Need"
                                  : "Want"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDate(
                            expense.date
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-5 text-right">
                          <span className="font-semibold text-red-600">
                            - LKR{" "}
                            {formatMoney(
                              Number(
                                expense.amount
                              )
                            )}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleEditExpense(
                                  expense
                                )
                              }
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteExpense(
                                  expense
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[#eef0ec] md:hidden">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fceeee] text-lg">
                          💳
                        </div>

                        <div>
                          <p className="font-semibold">
                            {expense.description ||
                              "Expense"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(
                              expense.date
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="whitespace-nowrap font-semibold text-red-600">
                        - LKR{" "}
                        {formatMoney(
                          Number(expense.amount)
                        )}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {expense.category
                            ?.name ||
                            "Unknown"}
                        </span>

                        {expense.category && (
                          <span
                            className={`ml-2 text-xs font-medium ${
                              expense.category.type ===
                              "need"
                                ? "text-[#173b2a]"
                                : "text-[#7c5a20]"
                            }`}
                          >
                            {expense.category.type ===
                            "need"
                              ? "Need"
                              : "Want"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditExpense(
                            expense
                          )
                        }
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExpense(
                            expense
                          )
                        }
                        className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}