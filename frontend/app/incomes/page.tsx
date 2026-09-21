"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createIncome,
  deleteIncome,
  getIncomes,
  updateIncome,
  type Income,
} from "../../lib/api";

export default function IncomePage() {
  const router = useRouter();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");

  // ---------------------------------------
  // Load incomes
  // ---------------------------------------

  async function loadIncomes() {
    try {
      setLoading(true);
      setError("");

      const data = await getIncomes();

      setIncomes(data.incomes);
    } catch (error) {
      console.error("Failed to load incomes:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load income data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncomes();
  }, []);

  // ---------------------------------------
  // Reset form
  // ---------------------------------------

  function resetForm() {
    setAmount("");
    setSource("");
    setDate("");
    setEditingIncome(null);
    setShowForm(false);
  }

  // ---------------------------------------
  // Open Add form
  // ---------------------------------------

  function handleAddIncome() {
    setEditingIncome(null);
    setAmount("");
    setSource("");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
    setShowForm(true);
  }

  // ---------------------------------------
  // Open Edit form
  // ---------------------------------------

  function handleEditIncome(income: Income) {
    setEditingIncome(income);

    setAmount(income.amount);
    setSource(income.source);

    // Laravel returns something like:
    // 2026-09-22T00:00:00.000000Z
    // We only need YYYY-MM-DD for input type="date".
    setDate(income.date.substring(0, 10));

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

    if (!amount || numericAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!source.trim()) {
      setError("Please enter an income source.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    try {
      setSaving(true);

      if (editingIncome) {
        await updateIncome(editingIncome.id, {
          amount: numericAmount,
          source: source.trim(),
          date,
        });
      } else {
        await createIncome({
          amount: numericAmount,
          source: source.trim(),
          date,
        });
      }

      await loadIncomes();

      resetForm();
    } catch (error) {
      console.error("Failed to save income:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save income.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------
  // Delete income
  // ---------------------------------------

  async function handleDeleteIncome(income: Income) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${income.source}" income of LKR ${Number(
        income.amount
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

      await deleteIncome(income.id);

      await loadIncomes();
    } catch (error) {
      console.error("Failed to delete income:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete income.");
      }
    }
  }

  // ---------------------------------------
  // Calculate total
  // ---------------------------------------

  const totalIncome = incomes.reduce(
    (total, income) => total + Number(income.amount),
    0
  );

  // ---------------------------------------
  // Format date
  // ---------------------------------------

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString.substring(0, 10);
    }

    return date.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
              Income
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and track your income
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

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Summary + Add button */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Total income */}
          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Income
                </p>

                <h2 className="mt-2 text-3xl font-bold text-[#173b2a]">
                  LKR{" "}
                  {totalIncome.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {incomes.length}{" "}
                  {incomes.length === 1
                    ? "income record"
                    : "income records"}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3ed] text-2xl">
                💰
              </div>
            </div>
          </div>

          {/* Add income */}
          <div className="flex items-center justify-between rounded-2xl border border-[#e5e8e1] bg-[#173b2a] p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-white/70">
                Add a new income
              </p>

              <h2 className="mt-1 text-xl font-bold text-white">
                Keep your finances up to date
              </h2>
            </div>

            <button
              type="button"
              onClick={handleAddIncome}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#173b2a] transition hover:bg-gray-100"
            >
              + Add Income
            </button>
          </div>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingIncome
                    ? "Edit Income"
                    : "Add Income"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingIncome
                    ? "Update your income details."
                    : "Enter the details of your new income."}
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

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 md:grid-cols-3"
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
                      setAmount(event.target.value)
                    }
                    placeholder="150000"
                    required
                    className="w-full rounded-xl border border-gray-200 py-3 pl-14 pr-4 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Income Source
                </label>

                <input
                  id="source"
                  type="text"
                  value={source}
                  onChange={(event) =>
                    setSource(event.target.value)
                  }
                  placeholder="Salary"
                  required
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
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#173b2a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingIncome
                    ? "Update Income"
                    : "Save Income"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Income list */}
        <div className="rounded-2xl border border-[#e5e8e1] bg-white shadow-sm">
          <div className="border-b border-[#e5e8e1] px-6 py-5">
            <h2 className="text-xl font-bold">
              Income History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              All your recorded income transactions
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                Loading income...
              </p>
            </div>
          ) : incomes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ed] text-2xl">
                💰
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No income records yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add your first income to start tracking your
                finances.
              </p>

              <button
                type="button"
                onClick={handleAddIncome}
                className="mt-5 rounded-xl bg-[#173b2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c]"
              >
                + Add Income
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
                        Source
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
                    {incomes.map((income) => (
                      <tr
                        key={income.id}
                        className="border-b border-[#eef0ec] last:border-b-0"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3ed] text-lg">
                              💵
                            </div>

                            <div>
                              <p className="font-semibold text-[#172117]">
                                {income.source}
                              </p>

                              <p className="text-xs text-gray-400">
                                Income #{income.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDate(income.date)}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <span className="font-semibold text-[#173b2a]">
                            + LKR{" "}
                            {Number(
                              income.amount
                            ).toLocaleString("en-LK", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleEditIncome(income)
                              }
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteIncome(income)
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
                {incomes.map((income) => (
                  <div
                    key={income.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ed] text-lg">
                          💵
                        </div>

                        <div>
                          <p className="font-semibold">
                            {income.source}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(income.date)}
                          </p>
                        </div>
                      </div>

                      <p className="whitespace-nowrap font-semibold text-[#173b2a]">
                        + LKR{" "}
                        {Number(
                          income.amount
                        ).toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditIncome(income)
                        }
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteIncome(income)
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