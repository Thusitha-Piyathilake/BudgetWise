"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    SavingsGoal,
    getSavingsGoals,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
} from "@/lib/api";

export default function SavingsPage() {
    const router = useRouter();

    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [targetDate, setTargetDate] = useState("");

    // =====================================================
    // Load Savings Goals
    // =====================================================

    async function loadGoals() {
        try {
            setLoading(true);
            setError("");

            const response = await getSavingsGoals();

            setGoals(response.savings_goals);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load savings goals."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadGoals();
    }, []);

    // =====================================================
    // Reset Form
    // =====================================================

    function resetForm() {
        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setTargetDate("");
        setEditingGoal(null);
        setIsFormOpen(false);
        setError("");
    }

    // =====================================================
    // Open Add Form
    // =====================================================

    function handleAddGoal() {
        setEditingGoal(null);

        setName("");
        setTargetAmount("");
        setCurrentAmount("0");
        setTargetDate("");

        setError("");
        setIsFormOpen(true);
    }

    // =====================================================
    // Open Edit Form
    // =====================================================

    function handleEditGoal(goal: SavingsGoal) {
        setEditingGoal(goal);

        setName(goal.name);
        setTargetAmount(String(goal.target_amount));
        setCurrentAmount(String(goal.current_amount));

        setTargetDate(
            goal.target_date
                ? goal.target_date.substring(0, 10)
                : ""
        );

        setError("");
        setIsFormOpen(true);
    }

    // =====================================================
    // Submit Form
    // =====================================================

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");

        const target = Number(targetAmount);
        const current = Number(currentAmount || 0);

        if (!name.trim()) {
            setError("Please enter a savings goal name.");
            return;
        }

        if (!target || target <= 0) {
            setError("Target amount must be greater than 0.");
            return;
        }

        if (current < 0) {
            setError("Current amount cannot be negative.");
            return;
        }

        if (current > target) {
            setError(
                "Current amount cannot be greater than the target amount."
            );
            return;
        }

        try {
            setSaving(true);

            if (editingGoal) {
                await updateSavingsGoal(editingGoal.id, {
                    name: name.trim(),
                    target_amount: target,
                    current_amount: current,
                    target_date: targetDate || undefined,
                });
            } else {
                await createSavingsGoal({
                    name: name.trim(),
                    target_amount: target,
                    current_amount: current,
                    target_date: targetDate || undefined,
                });
            }

            await loadGoals();

            resetForm();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save savings goal."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // Delete Goal
    // =====================================================

    async function handleDeleteGoal(goal: SavingsGoal) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${goal.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await deleteSavingsGoal(goal.id);

            await loadGoals();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete savings goal."
            );
        }
    }

    // =====================================================
    // Helpers
    // =====================================================

    function getProgress(goal: SavingsGoal) {
        const target = Number(goal.target_amount);
        const current = Number(goal.current_amount);

        if (target <= 0) {
            return 0;
        }

        return Math.min(
            100,
            Math.max(0, (current / target) * 100)
        );
    }

    function getRemaining(goal: SavingsGoal) {
        const target = Number(goal.target_amount);
        const current = Number(goal.current_amount);

        return Math.max(0, target - current);
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function formatDate(date: string | null) {
        if (!date) {
            return "No target date";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date.substring(0, 10);
        }

        return parsedDate.toLocaleDateString("en-LK", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    // =====================================================
    // Summary Calculations
    // =====================================================

    const totalTarget = goals.reduce(
        (total, goal) => total + Number(goal.target_amount),
        0
    );

    const totalSaved = goals.reduce(
        (total, goal) => total + Number(goal.current_amount),
        0
    );

    const totalRemaining = Math.max(
        0,
        totalTarget - totalSaved
    );

    // =====================================================
    // UI
    // =====================================================

    return (
        <main className="min-h-screen bg-[#f8faf9]">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <h1 className="text-2xl font-bold text-[#173b2a]">
                            Savings Goals
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Track your savings and work towards your
                            financial goals.
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

            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Target
                        </p>

                        <p className="mt-2 text-2xl font-bold text-[#173b2a]">
                            {formatCurrency(totalTarget)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Saved
                        </p>

                        <p className="mt-2 text-2xl font-bold text-green-700">
                            {formatCurrency(totalSaved)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Remaining
                        </p>

                        <p className="mt-2 text-2xl font-bold text-orange-600">
                            {formatCurrency(totalRemaining)}
                        </p>
                    </div>
                </section>

                {/* Page Actions */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            My Goals
                        </h2>

                        <p className="text-sm text-gray-500">
                            {goals.length}{" "}
                            {goals.length === 1 ? "goal" : "goals"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddGoal}
                        className="rounded-lg bg-[#173b2a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24563e]"
                    >
                        + Add Savings Goal
                    </button>
                </div>

                {/* Add/Edit Form */}
                {isFormOpen && (
                    <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {editingGoal
                                        ? "Edit Savings Goal"
                                        : "Add Savings Goal"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Set a target and track your progress.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-sm font-medium text-gray-500 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 gap-5 md:grid-cols-2"
                        >
                            {/* Goal Name */}
                            <div>
                                <label
                                    htmlFor="goal-name"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Goal Name
                                </label>

                                <input
                                    id="goal-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    placeholder="e.g. Emergency Fund"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                                />
                            </div>

                            {/* Target Amount */}
                            <div>
                                <label
                                    htmlFor="target-amount"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Target Amount (LKR)
                                </label>

                                <input
                                    id="target-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={targetAmount}
                                    onChange={(e) =>
                                        setTargetAmount(
                                            e.target.value
                                        )
                                    }
                                    placeholder="150000"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                                />
                            </div>

                            {/* Current Amount */}
                            <div>
                                <label
                                    htmlFor="current-amount"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Current Amount (LKR)
                                </label>

                                <input
                                    id="current-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={currentAmount}
                                    onChange={(e) =>
                                        setCurrentAmount(
                                            e.target.value
                                        )
                                    }
                                    placeholder="0"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                                />
                            </div>

                            {/* Target Date */}
                            <div>
                                <label
                                    htmlFor="target-date"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Target Date
                                </label>

                                <input
                                    id="target-date"
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) =>
                                        setTargetDate(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-1 focus:ring-[#173b2a]"
                                />
                            </div>

                            {/* Form Buttons */}
                            <div className="flex gap-3 md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-[#173b2a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24563e] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingGoal
                                        ? "Update Goal"
                                        : "Create Goal"}
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

                {/* Goals */}
                {loading ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <p className="text-sm text-gray-500">
                            Loading savings goals...
                        </p>
                    </div>
                ) : goals.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5ef]">
                            <span className="text-2xl">🎯</span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                            No savings goals yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            Create your first savings goal and start
                            tracking your progress.
                        </p>

                        <button
                            type="button"
                            onClick={handleAddGoal}
                            className="mt-5 rounded-lg bg-[#173b2a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24563e]"
                        >
                            + Create Your First Goal
                        </button>
                    </div>
                ) : (
                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {goals.map((goal) => {
                            const progress = getProgress(goal);
                            const remaining = getRemaining(goal);

                            return (
                                <div
                                    key={goal.id}
                                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                                >
                                    {/* Goal Header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {goal.name}
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Target date:{" "}
                                                {formatDate(
                                                    goal.target_date
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEditGoal(
                                                        goal
                                                    )
                                                }
                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteGoal(
                                                        goal
                                                    )
                                                }
                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amounts */}
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <p className="text-xs text-gray-500">
                                                Saved
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-green-700">
                                                {formatCurrency(
                                                    Number(
                                                        goal.current_amount
                                                    )
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <p className="text-xs text-gray-500">
                                                Target
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-[#173b2a]">
                                                {formatCurrency(
                                                    Number(
                                                        goal.target_amount
                                                    )
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mt-6">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">
                                                Progress
                                            </span>

                                            <span className="text-sm font-bold text-[#173b2a]">
                                                {progress.toFixed(0)}%
                                            </span>
                                        </div>

                                        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="h-full rounded-full bg-[#173b2a] transition-all duration-500"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Remaining */}
                                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                                        <span className="text-sm text-gray-500">
                                            Remaining
                                        </span>

                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(
                                                remaining
                                            )}
                                        </span>
                                    </div>

                                    {/* Completed Message */}
                                    {progress >= 100 && (
                                        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                            🎉 Savings goal completed!
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                )}
            </div>
        </main>
    );
}