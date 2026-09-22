"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Category,
    RecurringTransaction,
    createRecurringTransaction,
    deleteRecurringTransaction,
    getCategories,
    getRecurringTransactions,
    toggleRecurringTransaction,
    updateRecurringTransaction,
} from "@/lib/api";

type TransactionType = "income" | "expense";

type FormData = {
    type: TransactionType;
    category_id: string;
    amount: string;
    description: string;
    source: string;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    start_date: string;
    next_occurrence: string;
};

const getToday = () => {
    return new Date().toISOString().split("T")[0];
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatFrequency = (
    frequency: RecurringTransaction["frequency"]
) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
};

export default function RecurringTransactionsPage() {
    const router = useRouter();

    const [transactions, setTransactions] = useState<
        RecurringTransaction[]
    >([]);

    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);

    const [filter, setFilter] = useState<
        "all" | "income" | "expense"
    >("all");

    const [formData, setFormData] = useState<FormData>({
        type: "expense",
        category_id: "",
        amount: "",
        description: "",
        source: "",
        frequency: "monthly",
        start_date: getToday(),
        next_occurrence: getToday(),
    });

    // =====================================================
    // Load Data
    // =====================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [recurringResponse, categoryResponse] =
                await Promise.all([
                    getRecurringTransactions(),
                    getCategories(),
                ]);

            setTransactions(
                recurringResponse.recurring_transactions
            );

            setCategories(categoryResponse.categories);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load recurring transactions."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // =====================================================
    // Filtered Transactions
    // =====================================================

    const filteredTransactions = useMemo(() => {
        if (filter === "all") {
            return transactions;
        }

        return transactions.filter(
            (transaction) => transaction.type === filter
        );
    }, [transactions, filter]);

    // =====================================================
    // Summary
    // =====================================================

    const activeCount = transactions.filter(
        (transaction) => transaction.is_active
    ).length;

    const incomeCount = transactions.filter(
        (transaction) => transaction.type === "income"
    ).length;

    const expenseCount = transactions.filter(
        (transaction) => transaction.type === "expense"
    ).length;

    // =====================================================
    // Form Helpers
    // =====================================================

    const resetForm = () => {
        setFormData({
            type: "expense",
            category_id: "",
            amount: "",
            description: "",
            source: "",
            frequency: "monthly",
            start_date: getToday(),
            next_occurrence: getToday(),
        });

        setEditingId(null);
        setShowForm(false);
    };

    const openCreateForm = () => {
        setError("");

        setFormData({
            type: "expense",
            category_id: "",
            amount: "",
            description: "",
            source: "",
            frequency: "monthly",
            start_date: getToday(),
            next_occurrence: getToday(),
        });

        setEditingId(null);
        setShowForm(true);
    };

    const openEditForm = (
        transaction: RecurringTransaction
    ) => {
        setError("");

        setEditingId(transaction.id);

        setFormData({
            type: transaction.type,
            category_id: transaction.category_id
                ? String(transaction.category_id)
                : "",
            amount: transaction.amount,
            description: transaction.description || "",
            source: transaction.source || "",
            frequency: transaction.frequency,
            start_date: transaction.start_date.slice(0, 10),
            next_occurrence:
                transaction.next_occurrence.slice(0, 10),
        });

        setShowForm(true);
    };

    // =====================================================
    // Submit
    // =====================================================

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        setError("");

        const amount = Number(formData.amount);

        if (!amount || amount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        if (!formData.start_date) {
            setError("Please select a start date.");
            return;
        }

        if (!formData.next_occurrence) {
            setError("Please select the next occurrence date.");
            return;
        }

        if (
            formData.type === "expense" &&
            !formData.category_id
        ) {
            setError(
                "Please select a category for an expense."
            );
            return;
        }

        try {
            setSaving(true);

            if (editingId !== null) {
                const existingTransaction =
                    transactions.find(
                        (transaction) =>
                            transaction.id === editingId
                    );

                if (!existingTransaction) {
                    setError(
                        "The recurring transaction could not be found."
                    );
                    return;
                }

                await updateRecurringTransaction(editingId, {
                    type: formData.type,
                    category_id:
                        formData.type === "expense"
                            ? Number(formData.category_id)
                            : null,
                    amount,
                    description:
                        formData.description.trim() || null,
                    source:
                        formData.type === "income"
                            ? formData.source.trim() || null
                            : null,
                    frequency: formData.frequency,
                    start_date: formData.start_date,
                    next_occurrence:
                        formData.next_occurrence,
                    is_active: existingTransaction.is_active,
                });
            } else {
                await createRecurringTransaction({
                    type: formData.type,
                    category_id:
                        formData.type === "expense"
                            ? Number(formData.category_id)
                            : null,
                    amount,
                    description:
                        formData.description.trim() || null,
                    source:
                        formData.type === "income"
                            ? formData.source.trim() || null
                            : null,
                    frequency: formData.frequency,
                    start_date: formData.start_date,
                    next_occurrence:
                        formData.next_occurrence,
                    is_active: true,
                });
            }

            await loadData();
            resetForm();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save recurring transaction."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // Delete
    // =====================================================

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this recurring transaction?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await deleteRecurringTransaction(id);

            setTransactions((current) =>
                current.filter(
                    (transaction) => transaction.id !== id
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete recurring transaction."
            );
        }
    };

    // =====================================================
    // Toggle
    // =====================================================

    const handleToggle = async (id: number) => {
        try {
            setError("");

            const response =
                await toggleRecurringTransaction(id);

            setTransactions((current) =>
                current.map((transaction) =>
                    transaction.id === id
                        ? response.recurring_transaction
                        : transaction
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update recurring transaction."
            );
        }
    };

    // =====================================================
    // Loading
    // =====================================================

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f7f8f5] p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
                    <div className="mt-3 h-5 w-96 animate-pulse rounded bg-gray-200" />

                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-32 animate-pulse rounded-2xl bg-white"
                            />
                        ))}
                    </div>

                    <div className="mt-6 h-96 animate-pulse rounded-2xl bg-white" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f8f5] text-[#111827]">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

                {/* =====================================================
                    Header
                ===================================================== */}

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="mb-4 text-sm font-semibold text-[#173b2a] hover:underline"
                        >
                            ← Back to Dashboard
                        </button>

                        <h1 className="text-3xl font-bold tracking-tight">
                            Recurring Transactions
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage your automatic income and
                            regular expenses.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="rounded-xl bg-[#173b2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#102d20]"
                    >
                        + Add Recurring Transaction
                    </button>
                </div>

                {/* =====================================================
                    Error
                ===================================================== */}

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* =====================================================
                    Summary Cards
                ===================================================== */}

                <div className="mt-8 grid gap-5 md:grid-cols-3">

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                        <p className="text-sm font-medium text-gray-500">
                            Active Recurring
                        </p>

                        <p className="mt-3 text-3xl font-bold text-[#173b2a]">
                            {activeCount}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Currently active
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                        <p className="text-sm font-medium text-gray-500">
                            Recurring Income
                        </p>

                        <p className="mt-3 text-3xl font-bold text-[#173b2a]">
                            {incomeCount}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Automatic income sources
                        </p>
                    </div>

                    <div className="rounded-2xl bg-[#173b2a] p-6 text-white">
                        <p className="text-sm font-medium text-white/70">
                            Recurring Expenses
                        </p>

                        <p className="mt-3 text-3xl font-bold">
                            {expenseCount}
                        </p>

                        <p className="mt-1 text-sm text-white/70">
                            Regular payments
                        </p>
                    </div>
                </div>

                {/* =====================================================
                    Form
                ===================================================== */}

                {showForm && (
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {editingId
                                        ? "Edit Recurring Transaction"
                                        : "Add Recurring Transaction"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Set up an automatic income or
                                    regular expense.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-sm font-semibold text-gray-500 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-6"
                        >
                            <div className="grid gap-5 md:grid-cols-2">

                                {/* Type */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Transaction Type
                                    </label>

                                    <select
                                        value={formData.type}
                                        onChange={(event) => {
                                            const type =
                                                event.target.value as TransactionType;

                                            setFormData((current) => ({
                                                ...current,
                                                type,
                                                category_id:
                                                    type === "income"
                                                        ? ""
                                                        : current.category_id,
                                                source:
                                                    type === "expense"
                                                        ? ""
                                                        : current.source,
                                            }));
                                        }}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                    >
                                        <option value="expense">
                                            Expense
                                        </option>

                                        <option value="income">
                                            Income
                                        </option>
                                    </select>
                                </div>

                                {/* Amount */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Amount (LKR)
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                amount:
                                                    event.target.value,
                                            }))
                                        }
                                        placeholder="2000"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                        required
                                    />
                                </div>

                                {/* Category */}

                                {formData.type === "expense" && (
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Category
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        "/categories"
                                                    )
                                                }
                                                className="text-xs font-semibold text-[#173b2a] hover:underline"
                                            >
                                                + Add Category
                                            </button>
                                        </div>

                                        <select
                                            value={
                                                formData.category_id
                                            }
                                            onChange={(event) =>
                                                setFormData(
                                                    (current) => ({
                                                        ...current,
                                                        category_id:
                                                            event.target
                                                                .value,
                                                    })
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                            required
                                        >
                                            <option value="">
                                                Select category
                                            </option>

                                            {categories.map(
                                                (category) => (
                                                    <option
                                                        key={
                                                            category.id
                                                        }
                                                        value={
                                                            category.id
                                                        }
                                                    >
                                                        {category.name}{" "}
                                                        (
                                                        {category.type}
                                                        )
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                )}

                                {/* Source */}

                                {formData.type === "income" && (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                                            Income Source
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                formData.source
                                            }
                                            onChange={(event) =>
                                                setFormData(
                                                    (current) => ({
                                                        ...current,
                                                        source:
                                                            event.target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="Salary"
                                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                        />
                                    </div>
                                )}

                                {/* Description */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Description
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formData.description
                                        }
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                description:
                                                    event.target.value,
                                            }))
                                        }
                                        placeholder={
                                            formData.type ===
                                            "expense"
                                                ? "Netflix Subscription"
                                                : "Monthly Salary"
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                    />
                                </div>

                                {/* Frequency */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Frequency
                                    </label>

                                    <select
                                        value={
                                            formData.frequency
                                        }
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                frequency:
                                                    event.target
                                                        .value as FormData["frequency"],
                                            }))
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                    >
                                        <option value="daily">
                                            Daily
                                        </option>

                                        <option value="weekly">
                                            Weekly
                                        </option>

                                        <option value="monthly">
                                            Monthly
                                        </option>

                                        <option value="yearly">
                                            Yearly
                                        </option>
                                    </select>
                                </div>

                                {/* Start Date */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            formData.start_date
                                        }
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                start_date:
                                                    event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                        required
                                    />
                                </div>

                                {/* Next Occurrence */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Next Occurrence
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            formData.next_occurrence
                                        }
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                next_occurrence:
                                                    event.target
                                                        .value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#173b2a]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Form Buttons */}

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-[#173b2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#102d20] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                        ? "Update Recurring Transaction"
                                        : "Save Recurring Transaction"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* =====================================================
                    Filters
                ===================================================== */}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-xl font-bold">
                            Your Recurring Transactions
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage your regular income and expenses.
                        </p>
                    </div>

                    <div className="flex rounded-xl border border-gray-200 bg-white p-1">

                        {(
                            [
                                ["all", "All"],
                                ["income", "Income"],
                                ["expense", "Expenses"],
                            ] as const
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() =>
                                    setFilter(value)
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    filter === value
                                        ? "bg-[#173b2a] text-white"
                                        : "text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* =====================================================
                    Empty State
                ===================================================== */}

                {filteredTransactions.length === 0 && (
                    <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf1ec] text-2xl text-[#173b2a]">
                            ↻
                        </div>

                        <h3 className="mt-5 text-lg font-bold">
                            No recurring transactions
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            Add recurring salary, rent, subscriptions,
                            bills, or other regular transactions to
                            keep your finances organized.
                        </p>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="mt-6 rounded-xl bg-[#173b2a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#102d20]"
                        >
                            + Add Recurring Transaction
                        </button>
                    </div>
                )}

                {/* =====================================================
                    Transaction Cards
                ===================================================== */}

                {filteredTransactions.length > 0 && (
                    <div className="mt-6 space-y-4">
                        {filteredTransactions.map(
                            (transaction) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                                >
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                        {/* Left */}

                                        <div className="flex items-start gap-4">

                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg ${
                                                    transaction.type ===
                                                    "income"
                                                        ? "bg-[#e8f5ec] text-[#15803d]"
                                                        : "bg-[#f1f3f1] text-[#173b2a]"
                                                }`}
                                            >
                                                {transaction.type ===
                                                "income"
                                                    ? "↗"
                                                    : "↘"}
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">

                                                    <h3 className="font-bold text-gray-900">
                                                        {transaction.description ||
                                                            transaction.source ||
                                                            (transaction.type ===
                                                            "income"
                                                                ? "Recurring Income"
                                                                : "Recurring Expense")}
                                                    </h3>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            transaction.is_active
                                                                ? "bg-[#e8f5ec] text-[#166534]"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}
                                                    >
                                                        {transaction.is_active
                                                            ? "Active"
                                                            : "Paused"}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">

                                                    <span>
                                                        {transaction.type ===
                                                        "income"
                                                            ? "Income"
                                                            : "Expense"}
                                                    </span>

                                                    <span>
                                                        •
                                                    </span>

                                                    <span>
                                                        {formatFrequency(
                                                            transaction.frequency
                                                        )}
                                                    </span>

                                                    {transaction.category && (
                                                        <>
                                                            <span>
                                                                •
                                                            </span>

                                                            <span>
                                                                {
                                                                    transaction
                                                                        .category
                                                                        .name
                                                                }
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <p className="mt-2 text-sm text-gray-500">
                                                    Next occurrence:{" "}
                                                    <span className="font-semibold text-gray-700">
                                                        {formatDate(
                                                            transaction.next_occurrence
                                                        )}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right */}

                                        <div className="flex flex-col gap-4 lg:items-end">

                                            <div
                                                className={`text-xl font-bold ${
                                                    transaction.type ===
                                                    "income"
                                                        ? "text-[#15803d]"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {transaction.type ===
                                                "income"
                                                    ? "+"
                                                    : "-"}{" "}
                                                LKR{" "}
                                                {Number(
                                                    transaction.amount
                                                ).toLocaleString(
                                                    "en-LK",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditForm(
                                                            transaction
                                                        )
                                                    }
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggle(
                                                            transaction.id
                                                        )
                                                    }
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#173b2a] transition hover:bg-[#f1f5f2]"
                                                >
                                                    {transaction.is_active
                                                        ? "Pause"
                                                        : "Activate"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            transaction.id
                                                        )
                                                    }
                                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* =====================================================
                    Information Card
                ===================================================== */}

                <div className="mt-8 rounded-2xl bg-[#173b2a] p-6 text-white">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <p className="text-sm font-medium text-white/70">
                                Recurring transactions
                            </p>

                            <h2 className="mt-1 text-xl font-bold">
                                Keep your regular finances organized
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                                Add your salary, subscriptions, rent,
                                utility bills, loan payments, and other
                                regular transactions. You can pause or
                                activate them whenever needed.
                            </p>
                        </div>

                        <div className="shrink-0 rounded-xl bg-white/10 px-5 py-4 text-center">
                            <p className="text-xs text-white/60">
                                Total
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {transactions.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}