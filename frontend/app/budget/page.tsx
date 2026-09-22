"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBudget,
  deleteBudget,
  getBudgets,
  getDashboard,
  updateBudget,
  type Budget,
  type DashboardData,
} from "../../lib/api";

export default function BudgetPage() {
  const router = useRouter();

  // =====================================================
  // State
  // =====================================================

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] =
    useState<Budget | null>(null);

  const [month, setMonth] = useState("");
  const [needsPercentage, setNeedsPercentage] =
    useState("50");
  const [wantsPercentage, setWantsPercentage] =
    useState("30");
  const [savingsPercentage, setSavingsPercentage] =
    useState("20");

  // =====================================================
  // Current month
  // =====================================================

  const currentMonth = useMemo(() => {
    return new Date().toISOString().slice(0, 7);
  }, []);

  // =====================================================
  // Load data
  // =====================================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [budgetData, dashboardData] =
        await Promise.all([
          getBudgets(),
          getDashboard(),
        ]);

      setBudgets(budgetData.budgets);
      setDashboard(dashboardData);

      // Set current month as default when form is first opened.
      if (!month) {
        setMonth(dashboardData.month || currentMonth);
      }
    } catch (error) {
      console.error("Failed to load budget data:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load budget data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // Percentage calculations
  // =====================================================

  const needs = Number(needsPercentage) || 0;
  const wants = Number(wantsPercentage) || 0;
  const savings = Number(savingsPercentage) || 0;

  const totalPercentage = needs + wants + savings;

  const percentageIsValid =
    totalPercentage === 100;

  // =====================================================
  // Monthly income
  // =====================================================

  const monthlyIncome =
    dashboard?.summary.monthly_income ?? 0;

  const needsAmount =
    monthlyIncome * (needs / 100);

  const wantsAmount =
    monthlyIncome * (wants / 100);

  const savingsAmount =
    monthlyIncome * (savings / 100);

  // =====================================================
  // Formatting
  // =====================================================

  function formatMoney(amount: number) {
    return amount.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatMonth(monthValue: string) {
    if (!monthValue) {
      return "";
    }

    const [year, monthNumber] =
      monthValue.split("-");

    const date = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1
    );

    return date.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "long",
    });
  }

  // =====================================================
  // Reset form
  // =====================================================

  function resetForm() {
    setMonth(
      dashboard?.month || currentMonth
    );

    setNeedsPercentage("50");
    setWantsPercentage("30");
    setSavingsPercentage("20");

    setEditingBudget(null);
    setShowForm(false);
    setError("");
  }

  // =====================================================
  // Open add form
  // =====================================================

  function handleAddBudget() {
    setEditingBudget(null);

    setMonth(
      dashboard?.month || currentMonth
    );

    setNeedsPercentage("50");
    setWantsPercentage("30");
    setSavingsPercentage("20");

    setError("");
    setShowForm(true);
  }

  // =====================================================
  // Open edit form
  // =====================================================

  function handleEditBudget(budget: Budget) {
    setEditingBudget(budget);

    setMonth(budget.month);

    setNeedsPercentage(
      String(budget.needs_percentage)
    );

    setWantsPercentage(
      String(budget.wants_percentage)
    );

    setSavingsPercentage(
      String(budget.savings_percentage)
    );

    setError("");
    setShowForm(true);
  }

  // =====================================================
  // Submit budget
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!month) {
      setError("Please select a month.");
      return;
    }

    if (needs < 0 || needs > 100) {
      setError(
        "Needs percentage must be between 0 and 100."
      );
      return;
    }

    if (wants < 0 || wants > 100) {
      setError(
        "Wants percentage must be between 0 and 100."
      );
      return;
    }

    if (savings < 0 || savings > 100) {
      setError(
        "Savings percentage must be between 0 and 100."
      );
      return;
    }

    if (!percentageIsValid) {
      setError(
        `The percentages must add up to 100%. Current total: ${totalPercentage}%.`
      );
      return;
    }

    try {
      setSaving(true);

      const budgetData = {
        month,
        needs_percentage: needs,
        wants_percentage: wants,
        savings_percentage: savings,
      };

      if (editingBudget) {
        await updateBudget(
          editingBudget.id,
          budgetData
        );
      } else {
        await createBudget(budgetData);
      }

      await loadData();

      resetForm();
    } catch (error) {
      console.error("Failed to save budget:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save budget.");
      }
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // Delete budget
  // =====================================================

  async function handleDeleteBudget(
    budget: Budget
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the budget for ${formatMonth(
        budget.month
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteBudget(budget.id);

      await loadData();
    } catch (error) {
      console.error(
        "Failed to delete budget:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete budget.");
      }
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#172117]">
      {/* =================================================
          Header
      ================================================== */}

      <header className="border-b border-[#e5e8e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              Budget
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your monthly 50 / 30 / 20 budget
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

      {/* =================================================
          Main content
      ================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* =================================================
            Summary cards
        ================================================== */}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {/* Monthly Income */}
          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Monthly Income
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#173b2a]">
              LKR {formatMoney(monthlyIncome)}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Current month income
            </p>
          </div>

          {/* Current Budget */}
          <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Budget Month
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {dashboard
                ? formatMonth(dashboard.month)
                : "Loading..."}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Monthly allocation
            </p>
          </div>

          {/* Rule */}
          <div className="rounded-2xl bg-[#173b2a] p-6 shadow-sm">
            <p className="text-sm font-medium text-white/70">
              Recommended guideline
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              50 / 30 / 20
            </h2>

            <p className="mt-2 text-sm text-white/70">
              Needs · Wants · Savings
            </p>
          </div>
        </div>

        {/* =================================================
            Add budget banner
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 rounded-2xl bg-[#173b2a] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">
              Plan your money
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              Create a monthly budget
            </h2>

            <p className="mt-1 text-sm text-white/70">
              Allocate your income between needs, wants
              and savings.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddBudget}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#173b2a] transition hover:bg-gray-100"
          >
            + Add Budget
          </button>
        </div>

        {/* =================================================
            Add / Edit form
        ================================================== */}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-[#e5e8e1] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingBudget
                    ? "Edit Budget"
                    : "Create Budget"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Set how you want to allocate your income.
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
              className="space-y-6"
            >
              {/* Month */}
              <div>
                <label
                  htmlFor="budgetMonth"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Budget Month
                </label>

                <input
                  id="budgetMonth"
                  type="month"
                  value={month}
                  onChange={(event) =>
                    setMonth(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10 md:max-w-sm"
                />
              </div>

              {/* Percentage inputs */}
              <div className="grid gap-5 md:grid-cols-3">
                {/* Needs */}
                <div className="rounded-2xl border border-[#e5e8e1] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Needs
                      </h3>

                      <p className="text-xs text-gray-500">
                        Essential expenses
                      </p>
                    </div>

                    <span className="rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-semibold text-[#173b2a]">
                      50%
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={needsPercentage}
                      onChange={(event) =>
                        setNeedsPercentage(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                      %
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    LKR {formatMoney(needsAmount)}
                  </p>
                </div>

                {/* Wants */}
                <div className="rounded-2xl border border-[#e5e8e1] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Wants
                      </h3>

                      <p className="text-xs text-gray-500">
                        Non-essential expenses
                      </p>
                    </div>

                    <span className="rounded-full bg-[#fff5df] px-3 py-1 text-xs font-semibold text-[#7c5a20]">
                      30%
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={wantsPercentage}
                      onChange={(event) =>
                        setWantsPercentage(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                      %
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    LKR {formatMoney(wantsAmount)}
                  </p>
                </div>

                {/* Savings */}
                <div className="rounded-2xl border border-[#e5e8e1] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Savings
                      </h3>

                      <p className="text-xs text-gray-500">
                        Savings and investments
                      </p>
                    </div>

                    <span className="rounded-full bg-[#edf0ff] px-3 py-1 text-xs font-semibold text-[#4351a3]">
                      20%
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={savingsPercentage}
                      onChange={(event) =>
                        setSavingsPercentage(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                      %
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    LKR {formatMoney(savingsAmount)}
                  </p>
                </div>
              </div>

              {/* Total percentage */}
              <div
                className={`rounded-xl border px-5 py-4 ${
                  percentageIsValid
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        percentageIsValid
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      Total Allocation
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        percentageIsValid
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {percentageIsValid
                        ? "Your budget allocation is valid."
                        : "The three percentages must add up to exactly 100%."}
                    </p>
                  </div>

                  <span
                    className={`text-2xl font-bold ${
                      percentageIsValid
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {totalPercentage}%
                  </span>
                </div>
              </div>

              {/* Allocation preview */}
              <div className="rounded-2xl bg-[#f7f8f5] p-5">
                <h3 className="font-semibold">
                  Allocation Preview
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Needs
                    </p>

                    <p className="mt-1 font-semibold">
                      LKR {formatMoney(needsAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Wants
                    </p>

                    <p className="mt-1 font-semibold">
                      LKR {formatMoney(wantsAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Savings
                    </p>

                    <p className="mt-1 font-semibold">
                      LKR {formatMoney(savingsAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    saving || !percentageIsValid
                  }
                  className="rounded-xl bg-[#173b2a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingBudget
                    ? "Update Budget"
                    : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================
            Budget history
        ================================================== */}

        <div className="rounded-2xl border border-[#e5e8e1] bg-white shadow-sm">
          <div className="border-b border-[#e5e8e1] px-6 py-5">
            <h2 className="text-xl font-bold">
              Budget History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your monthly budget allocations
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                Loading budgets...
              </p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ed] text-2xl">
                📊
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No budgets yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create your first monthly budget to start
                planning your money.
              </p>

              <button
                type="button"
                onClick={handleAddBudget}
                className="mt-5 rounded-xl bg-[#173b2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c]"
              >
                + Add Budget
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#eef0ec]">
              {budgets.map((budget) => {
                const budgetNeeds =
                  Number(
                    budget.needs_percentage
                  ) || 0;

                const budgetWants =
                  Number(
                    budget.wants_percentage
                  ) || 0;

                const budgetSavings =
                  Number(
                    budget.savings_percentage
                  ) || 0;

                const budgetTotal =
                  budgetNeeds +
                  budgetWants +
                  budgetSavings;

                const isCurrentMonth =
                  budget.month ===
                  dashboard?.month;

                const budgetIncome =
                  isCurrentMonth
                    ? monthlyIncome
                    : 0;

                return (
                  <div
                    key={budget.id}
                    className="p-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {formatMonth(
                              budget.month
                            )}
                          </h3>

                          {isCurrentMonth && (
                            <span className="rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-semibold text-[#173b2a]">
                              Current Month
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          Total allocation:{" "}
                          {budgetTotal}%
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditBudget(
                              budget
                            )
                          }
                          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteBudget(
                              budget
                            )
                          }
                          className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Budget allocation */}
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {/* Needs */}
                      <div className="rounded-xl bg-[#f7f8f5] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            Needs
                          </p>

                          <span className="text-sm font-bold text-[#173b2a]">
                            {budgetNeeds}%
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-[#173b2a]"
                            style={{
                              width: `${Math.min(
                                budgetNeeds,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        {isCurrentMonth && (
                          <p className="mt-3 text-sm text-gray-500">
                            LKR{" "}
                            {formatMoney(
                              budgetIncome *
                                (budgetNeeds /
                                  100)
                            )}
                          </p>
                        )}
                      </div>

                      {/* Wants */}
                      <div className="rounded-xl bg-[#f7f8f5] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            Wants
                          </p>

                          <span className="text-sm font-bold text-[#7c5a20]">
                            {budgetWants}%
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-[#7c5a20]"
                            style={{
                              width: `${Math.min(
                                budgetWants,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        {isCurrentMonth && (
                          <p className="mt-3 text-sm text-gray-500">
                            LKR{" "}
                            {formatMoney(
                              budgetIncome *
                                (budgetWants /
                                  100)
                            )}
                          </p>
                        )}
                      </div>

                      {/* Savings */}
                      <div className="rounded-xl bg-[#f7f8f5] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            Savings
                          </p>

                          <span className="text-sm font-bold text-[#4351a3]">
                            {budgetSavings}%
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-[#4351a3]"
                            style={{
                              width: `${Math.min(
                                budgetSavings,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        {isCurrentMonth && (
                          <p className="mt-3 text-sm text-gray-500">
                            LKR{" "}
                            {formatMoney(
                              budgetIncome *
                                (budgetSavings /
                                  100)
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}