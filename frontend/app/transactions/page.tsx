"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Category,
  Expense,
  Income,
  createExpense,
  createIncome,
  deleteExpense,
  deleteIncome,
  getCategories,
  getExpenses,
  getIncomes,
  updateExpense,
  updateIncome,
} from "@/lib/api";

type TransactionType = "income" | "expense";

type Transaction = {
  id: number;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  originalId: number;
};

type FilterType = "all" | "income" | "expense";

export default function TransactionsPage() {
  const router = useRouter();

  // =====================================================
  // Data State
  // =====================================================

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // Filter
  // =====================================================

  const [filter, setFilter] = useState<FilterType>("all");

  // =====================================================
  // Form State
  // =====================================================

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formType, setFormType] =
    useState<TransactionType>("expense");

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");

  // =====================================================
  // Load Data
  // =====================================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        incomesResponse,
        expensesResponse,
        categoriesResponse,
      ] = await Promise.all([
        getIncomes(),
        getExpenses(),
        getCategories(),
      ]);

      setIncomes(incomesResponse.incomes);
      setExpenses(expensesResponse.expenses);
      setCategories(categoriesResponse.categories);
    } catch (err) {
      console.error("Transactions loading error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load transactions.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // Convert API Data into Transactions
  // =====================================================

  const transactions = useMemo<Transaction[]>(() => {
    const incomeTransactions: Transaction[] = incomes.map(
      (income) => ({
        id: income.id,
        originalId: income.id,
        type: "income",
        amount: Number(income.amount),
        description: income.source,
        category: "Income",
        date: income.date,
      })
    );

    const expenseTransactions: Transaction[] = expenses.map(
      (expense) => ({
        id: expense.id,
        originalId: expense.id,
        type: "expense",
        amount: Number(expense.amount),
        description:
          expense.description || "Expense",
        category:
          expense.category?.name || "Uncategorized",
        date: expense.date,
      })
    );

    return [
      ...incomeTransactions,
      ...expenseTransactions,
    ].sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );
  }, [incomes, expenses]);

  // =====================================================
  // Filter Transactions
  // =====================================================

  const filteredTransactions = useMemo(() => {
    if (filter === "all") {
      return transactions;
    }

    return transactions.filter(
      (transaction) =>
        transaction.type === filter
    );
  }, [transactions, filter]);

  // =====================================================
  // Summary
  // =====================================================

  const totalIncome = incomes.reduce(
    (total, income) =>
      total + Number(income.amount),
    0
  );

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount),
    0
  );

  const balance = totalIncome - totalExpenses;

  // =====================================================
  // Currency
  // =====================================================

  function formatCurrency(amount: number) {
    return `LKR ${amount.toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    })}`;
  }

  // =====================================================
  // Date
  // =====================================================

  function formatDate(dateValue: string) {
    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return dateValue.substring(0, 10);
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // =====================================================
  // Reset Form
  // =====================================================

  function resetForm() {
    setIsFormOpen(false);
    setEditingTransaction(null);

    setAmount("");
    setDescription("");
    setSource("");
    setCategoryId("");
    setDate("");

    setError("");
  }

  // =====================================================
  // Open Add Income
  // =====================================================

  function handleAddIncome() {
    setFormType("income");
    setEditingTransaction(null);

    setAmount("");
    setSource("");
    setDescription("");
    setCategoryId("");
    setDate(
      new Date().toISOString().split("T")[0]
    );

    setError("");
    setIsFormOpen(true);
  }

  // =====================================================
  // Open Add Expense
  // =====================================================

  function handleAddExpense() {
    setFormType("expense");
    setEditingTransaction(null);

    setAmount("");
    setSource("");
    setDescription("");
    setCategoryId("");
    setDate(
      new Date().toISOString().split("T")[0]
    );

    setError("");
    setIsFormOpen(true);
  }

  // =====================================================
  // Open Edit Income
  // =====================================================

  function handleEditIncome(income: Income) {
    setFormType("income");

    setEditingTransaction({
      id: income.id,
      originalId: income.id,
      type: "income",
      amount: Number(income.amount),
      description: income.source,
      category: "Income",
      date: income.date,
    });

    setAmount(String(income.amount));
    setSource(income.source);
    setDescription("");
    setCategoryId("");
    setDate(income.date.substring(0, 10));

    setError("");
    setIsFormOpen(true);
  }

  // =====================================================
  // Open Edit Expense
  // =====================================================

  function handleEditExpense(expense: Expense) {
    setFormType("expense");

    setEditingTransaction({
      id: expense.id,
      originalId: expense.id,
      type: "expense",
      amount: Number(expense.amount),
      description:
        expense.description || "Expense",
      category:
        expense.category?.name || "Uncategorized",
      date: expense.date,
    });

    setAmount(String(expense.amount));
    setSource("");
    setDescription(
      expense.description || ""
    );
    setCategoryId(String(expense.category_id));
    setDate(expense.date.substring(0, 10));

    setError("");
    setIsFormOpen(true);
  }

  // =====================================================
  // Submit Form
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError(
        "Amount must be greater than 0."
      );
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (formType === "income" && !source.trim()) {
      setError(
        "Please enter an income source."
      );
      return;
    }

    if (
      formType === "expense" &&
      !categoryId
    ) {
      setError(
        "Please select an expense category."
      );
      return;
    }

    try {
      setSaving(true);

      if (formType === "income") {
        if (editingTransaction) {
          await updateIncome(
            editingTransaction.originalId,
            {
              amount: numericAmount,
              source: source.trim(),
              date,
            }
          );
        } else {
          await createIncome({
            amount: numericAmount,
            source: source.trim(),
            date,
          });
        }
      } else {
        if (editingTransaction) {
          await updateExpense(
            editingTransaction.originalId,
            {
              category_id: Number(categoryId),
              amount: numericAmount,
              description:
                description.trim(),
              date,
            }
          );
        } else {
          await createExpense({
            category_id: Number(categoryId),
            amount: numericAmount,
            description:
              description.trim(),
            date,
          });
        }
      }

      await loadData();

      resetForm();
    } catch (err) {
      console.error(
        "Transaction save error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to save transaction."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // Delete Income
  // =====================================================

  async function handleDeleteIncome(
    income: Income
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${income.source}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteIncome(income.id);

      await loadData();
    } catch (err) {
      console.error(
        "Income delete error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to delete income."
        );
      }
    }
  }

  // =====================================================
  // Delete Expense
  // =====================================================

  async function handleDeleteExpense(
    expense: Expense
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete this expense?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteExpense(expense.id);

      await loadData();
    } catch (err) {
      console.error(
        "Expense delete error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to delete expense."
        );
      }
    }
  }

  // =====================================================
  // Find Original Record
  // =====================================================

  function handleEditTransaction(
    transaction: Transaction
  ) {
    if (transaction.type === "income") {
      const income = incomes.find(
        (item) =>
          item.id === transaction.originalId
      );

      if (income) {
        handleEditIncome(income);
      }
    } else {
      const expense = expenses.find(
        (item) =>
          item.id === transaction.originalId
      );

      if (expense) {
        handleEditExpense(expense);
      }
    }
  }

  function handleDeleteTransaction(
    transaction: Transaction
  ) {
    if (transaction.type === "income") {
      const income = incomes.find(
        (item) =>
          item.id === transaction.originalId
      );

      if (income) {
        handleDeleteIncome(income);
      }
    } else {
      const expense = expenses.find(
        (item) =>
          item.id === transaction.originalId
      );

      if (expense) {
        handleDeleteExpense(expense);
      }
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#172117]">

      {/* ================= HEADER ================= */}

      <header className="border-b border-[#e5e8e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-[#173b2a]">
              Transactions
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your income and expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-10">

        {/* ================= ERROR ================= */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ================= SUMMARY ================= */}

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6">
            <p className="text-sm text-gray-500">
              Total Income
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6">
            <p className="text-sm text-gray-500">
              Total Expenses
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#173b2a] bg-[#173b2a] p-6 text-white">
            <p className="text-sm text-green-200">
              Balance
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(balance)}
            </p>
          </div>

        </div>

        {/* ================= ACTION BAR ================= */}

        <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e8e1] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">

          {/* Filters */}

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                setFilter("all")
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "all"
                  ? "bg-[#173b2a] text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("income")
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "income"
                  ? "bg-[#173b2a] text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Income
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("expense")
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "expense"
                  ? "bg-[#173b2a] text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Expenses
            </button>

          </div>

          {/* Add Buttons */}

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={handleAddIncome}
              className="rounded-lg bg-[#173b2a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24563e]"
            >
              + Add Income
            </button>

            <button
              type="button"
              onClick={handleAddExpense}
              className="rounded-lg border border-[#173b2a] px-4 py-2.5 text-sm font-semibold text-[#173b2a] transition hover:bg-[#edf5ef]"
            >
              + Add Expense
            </button>

          </div>

        </div>

        {/* ================= FORM ================= */}

        {isFormOpen && (
          <section className="rounded-2xl border border-[#e5e8e1] bg-white p-6">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold">
                  {editingTransaction
                    ? `Edit ${
                        formType === "income"
                          ? "Income"
                          : "Expense"
                      }`
                    : `Add ${
                        formType === "income"
                          ? "Income"
                          : "Expense"
                      }`}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the transaction details below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
            >

              {/* Amount */}

              <div>
                <label
                  htmlFor="transaction-amount"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Amount (LKR)
                </label>

                <input
                  id="transaction-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="50000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                />
              </div>

              {/* Date */}

              <div>
                <label
                  htmlFor="transaction-date"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Date
                </label>

                <input
                  id="transaction-date"
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                />
              </div>

              {/* Income Source */}

              {formType === "income" && (
                <div className="md:col-span-2">
                  <label
                    htmlFor="income-source"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Income Source
                  </label>

                  <input
                    id="income-source"
                    type="text"
                    value={source}
                    onChange={(event) =>
                      setSource(event.target.value)
                    }
                    placeholder="e.g. Salary"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                  />
                </div>
              )}

              {/* Expense Category */}

              {formType === "expense" && (
                <div>
                  <label
                    htmlFor="expense-category"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>

                  <select
                    id="expense-category"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name} (
                          {category.type})
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/categories")
                    }
                    className="mt-2 text-xs font-semibold text-[#173b2a] hover:underline"
                  >
                    + Add Category
                  </button>
                </div>
              )}

              {/* Expense Description */}

              {formType === "expense" && (
                <div>
                  <label
                    htmlFor="expense-description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <input
                    id="expense-description"
                    type="text"
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Monthly groceries"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                  />
                </div>
              )}

              {/* Submit */}

              <div className="flex gap-3 md:col-span-2">

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#173b2a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24563e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingTransaction
                    ? "Update Transaction"
                    : "Create Transaction"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

              </div>

            </form>
          </section>
        )}

        {/* ================= TRANSACTIONS ================= */}

        <section className="overflow-hidden rounded-2xl border border-[#e5e8e1] bg-white">

          <div className="border-b border-gray-100 p-6">

            <h2 className="text-lg font-bold">
              Transaction History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1
                ? "transaction"
                : "transactions"}
            </p>

          </div>

          {loading ? (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-500">
                Loading transactions...
              </p>
            </div>
          ) : filteredTransactions.length ===
            0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5ef]">
                <span className="text-2xl">
                  ↕
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                No transactions found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add an income or expense to start
                tracking your transactions.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {filteredTransactions.map(
                (transaction) => {
                  const isIncome =
                    transaction.type ===
                    "income";

                  return (
                    <div
                      key={`${transaction.type}-${transaction.id}`}
                      className="flex flex-col gap-4 px-6 py-5 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                    >

                      {/* Left */}

                      <div className="flex items-center gap-4">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${
                            isIncome
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isIncome
                            ? "↗"
                            : "↘"}
                        </div>

                        <div>

                          <p className="font-semibold text-gray-900">
                            {transaction.description}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">

                            <span>
                              {transaction.category}
                            </span>

                            <span>•</span>

                            <span>
                              {formatDate(
                                transaction.date
                              )}
                            </span>

                            <span>•</span>

                            <span
                              className={
                                isIncome
                                  ? "font-medium text-green-600"
                                  : "font-medium text-gray-500"
                              }
                            >
                              {isIncome
                                ? "Income"
                                : "Expense"}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* Right */}

                      <div className="flex items-center justify-between gap-5 md:justify-end">

                        <p
                          className={`text-base font-bold ${
                            isIncome
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {isIncome
                            ? "+"
                            : "-"}{" "}
                          {formatCurrency(
                            transaction.amount
                          )}
                        </p>

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEditTransaction(
                                transaction
                              )
                            }
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteTransaction(
                                transaction
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}