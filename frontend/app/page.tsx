"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboard,
  logout,
  type DashboardData,
} from "../lib/api";

type BudgetItem = {
  name: string;
  percentage: number;
  amount: number;
  spent: number;
  remaining: number;
  description: string;
};

export default function Home() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboard();

        setDashboard(data);
      } catch (error) {
        console.error("Dashboard error:", error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");

      router.push("/login");
    }
  }

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    const transactionDate = new Date(date);

    return transactionDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getMonthName = (month: string) => {
    const [year, monthNumber] = month.split("-");

    const date = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1
    );

    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const budgetData: BudgetItem[] = dashboard
    ? [
        {
          name: "Essential Needs",
          percentage: dashboard.budget.needs_percentage,
          amount: dashboard.budget.needs_budget,
          spent: dashboard.budget.needs_spent,
          remaining: Math.max(
            dashboard.budget.needs_budget -
              dashboard.budget.needs_spent,
            0
          ),
          description:
            "Rent, groceries, bills & essentials",
        },
        {
          name: "Personal Wants",
          percentage: dashboard.budget.wants_percentage,
          amount: dashboard.budget.wants_budget,
          spent: dashboard.budget.wants_spent,
          remaining: Math.max(
            dashboard.budget.wants_budget -
              dashboard.budget.wants_spent,
            0
          ),
          description:
            "Shopping, entertainment & travel",
        },
        {
          name: "Savings",
          percentage: dashboard.budget.savings_percentage,
          amount: dashboard.budget.savings_budget,

          // Savings is represented by the available
          // savings amount from the backend.
          spent: 0,

          remaining: dashboard.budget.savings_amount,

          description:
            "Emergency fund & investments",
        },
      ]
    : [];

  const savingsGoal = dashboard?.savings_goals?.[0];

  const savingsCurrent = savingsGoal
    ? Number(savingsGoal.current_amount)
    : 0;

  const savingsTarget = savingsGoal
    ? Number(savingsGoal.target_amount)
    : 0;

  const savingsProgress =
    savingsTarget > 0
      ? Math.min(
          (savingsCurrent / savingsTarget) * 100,
          100
        )
      : 0;

  const monthlyIncome =
    dashboard?.summary.monthly_income ?? 0;

  const monthlyExpenses =
    dashboard?.summary.monthly_expenses ?? 0;

  const availableBalance =
    dashboard?.summary.available_balance ?? 0;

  const expensePercentage =
    monthlyIncome > 0
      ? Math.round(
          (monthlyExpenses / monthlyIncome) * 100
        )
      : 0;

  const balancePercentage =
    monthlyIncome > 0
      ? Math.round(
          (availableBalance / monthlyIncome) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#172117]">
      <div className="flex min-h-screen">

        {/* ================= SIDEBAR ================= */}

        <aside className="hidden w-64 border-r border-[#e5e8e1] bg-white p-6 lg:flex lg:flex-col">
          <div className="mb-10">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173b2a] text-xl text-white">
                ₿
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  BudgetWise
                </h1>

                <p className="text-xs text-gray-500">
                  Smart money management
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              "Dashboard",
              "Transactions",
              "Budget",
              "Savings",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActiveMenu(item);

                  if (item === "Budget") {
                    router.push("/budget");
                  }

                  // UPDATED: Savings navigation
                  if (item === "Savings") {
                    router.push("/savings");
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeMenu === item
                    ? "bg-[#e8f1eb] text-[#173b2a]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">
                  {item === "Dashboard" && "⌂"}
                  {item === "Transactions" && "↕"}
                  {item === "Budget" && "◔"}
                  {item === "Savings" && "◉"}
                </span>

                {item}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-[#173b2a] p-5 text-white">
            <p className="text-xs text-green-200">
              50 / 30 / 20 Rule
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              Build better money habits
            </h3>

            <p className="mt-2 text-xs leading-5 text-green-100">
              Keep your needs, wants and savings balanced
              every month.
            </p>
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}

        <section className="flex-1">

          {/* Header */}

          <header className="flex items-center justify-between border-b border-[#e5e8e1] bg-white px-6 py-5 lg:px-10">
            <div>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Good evening 👋
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 sm:block">
                {dashboard
                  ? getMonthName(dashboard.month)
                  : "Loading..."}
              </button>

              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce9df] font-semibold text-[#173b2a]">
                TD
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-10">

            {/* Welcome */}

            <div>
              <h3 className="text-3xl font-bold tracking-tight">
                Your financial overview
              </h3>

              <p className="mt-1 text-gray-500">
                Here&apos;s how your money is looking this month.
              </p>
            </div>

            {/* ================= LOADING ================= */}

            {loading && (
              <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6">
                <p className="text-sm text-gray-500">
                  Loading your financial data...
                </p>
              </div>
            )}

            {/* ================= ERROR ================= */}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h3 className="font-semibold text-red-700">
                  Unable to load dashboard
                </h3>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <p className="mt-2 text-xs text-red-500">
                  Make sure the Laravel API is running and you
                  are logged in.
                </p>
              </div>
            )}

            {/* ================= DASHBOARD ================= */}

            {!loading && !error && dashboard && (
              <>

                {/* ================= SUMMARY CARDS ================= */}

                <div className="grid gap-4 md:grid-cols-3">

                  <SummaryCard
                    title="Monthly Income"
                    amount={formatCurrency(monthlyIncome)}
                    subtitle="This month"
                    icon="↗"
                  />

                  <SummaryCard
                    title="Total Expenses"
                    amount={formatCurrency(monthlyExpenses)}
                    subtitle={`${expensePercentage}% of your income`}
                    icon="↘"
                  />

                  <SummaryCard
                    title="Available Balance"
                    amount={formatCurrency(availableBalance)}
                    subtitle={`${balancePercentage}% remaining`}
                    icon="✓"
                    highlight
                  />

                </div>

                {/* ================= BUDGET SECTION ================= */}

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

                  {/* Budget */}

                  <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6">

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">
                          50 / 30 / 20 Budget
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Your monthly allocation
                        </p>
                      </div>

                      {/* Manage button */}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenu("Budget");
                          router.push("/budget");
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50"
                      >
                        Manage
                      </button>
                    </div>

                    <div className="mt-7 space-y-6">

                      {budgetData.map((budget) => {

                        const progress =
                          budget.amount > 0
                            ? Math.min(
                                (budget.spent /
                                  budget.amount) *
                                  100,
                                100
                              )
                            : 0;

                        return (
                          <div key={budget.name}>

                            <div className="flex items-end justify-between">

                              <div>
                                <div className="flex items-center gap-2">

                                  <h4 className="font-semibold">
                                    {budget.name}
                                  </h4>

                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                    {budget.percentage}%
                                  </span>

                                </div>

                                <p className="mt-1 text-xs text-gray-500">
                                  {budget.description}
                                </p>
                              </div>

                              <div className="text-right">

                                <p className="font-semibold">
                                  {formatCurrency(
                                    budget.spent
                                  )}
                                </p>

                                <p className="text-xs text-gray-400">
                                  of{" "}
                                  {formatCurrency(
                                    budget.amount
                                  )}
                                </p>

                              </div>

                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

                              <div
                                className="h-full rounded-full bg-[#173b2a]"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />

                            </div>

                            <p className="mt-2 text-xs text-gray-500">
                              {formatCurrency(
                                budget.remaining
                              )}{" "}
                              remaining
                            </p>

                          </div>
                        );
                      })}

                    </div>
                  </div>

                  {/* ================= SAVINGS ================= */}

                  <div className="rounded-2xl border border-[#e5e8e1] bg-[#173b2a] p-6 text-white">

                    <p className="text-sm text-green-200">
                      Savings goal
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {savingsGoal
                        ? savingsGoal.name
                        : "No savings goal"}
                    </h3>

                    <p className="mt-1 text-sm text-green-100">
                      Building your financial safety net
                    </p>

                    <div className="mt-8">

                      <div className="flex items-end justify-between">

                        <div>

                          <p className="text-3xl font-bold">
                            {formatCurrency(
                              savingsCurrent
                            )}
                          </p>

                          <p className="mt-1 text-xs text-green-200">
                            of{" "}
                            {formatCurrency(
                              savingsTarget
                            )}{" "}
                            goal
                          </p>

                        </div>

                        <span className="text-lg font-semibold">
                          {Math.round(
                            savingsProgress
                          )}
                          %
                        </span>

                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">

                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${savingsProgress}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* UPDATED: View Savings Goals navigation */}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu("Savings");
                        router.push("/savings");
                      }}
                      className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#173b2a] hover:bg-gray-100"
                    >
                      View Savings Goals
                    </button>

                  </div>
                </div>

                {/* ================= TRANSACTIONS ================= */}

                <div className="rounded-2xl border border-[#e5e8e1] bg-white">

                  <div className="flex items-center justify-between border-b border-gray-100 p-6">

                    <div>
                      <h3 className="text-lg font-bold">
                        Recent transactions
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Your latest income and expenses
                      </p>
                    </div>

                    <button className="text-sm font-semibold text-[#173b2a] hover:underline">
                      View all
                    </button>

                  </div>

                  <div className="divide-y divide-gray-100">

                    {dashboard.recent_transactions.length ===
                    0 ? (
                      <div className="px-6 py-8 text-center">

                        <p className="text-sm text-gray-500">
                          No recent transactions.
                        </p>

                      </div>
                    ) : (

                      dashboard.recent_transactions.map(
                        (transaction) => {

                          const isIncome =
                            transaction.type ===
                            "income";

                          const categoryText = isIncome
                            ? "Income"
                            : transaction.category ??
                              "Expense";

                          return (
                            <div
                              key={`${transaction.type}-${transaction.id}`}
                              className="flex items-center justify-between px-6 py-4"
                            >

                              <div className="flex items-center gap-4">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f3ef] text-lg">
                                  {isIncome
                                    ? "↗"
                                    : "↘"}
                                </div>

                                <div>

                                  <p className="text-sm font-semibold">
                                    {transaction.description ??
                                      "Expense"}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    {categoryText} ·{" "}
                                    {formatDate(
                                      transaction.date
                                    )}
                                  </p>

                                </div>

                              </div>

                              <p
                                className={`text-sm font-bold ${
                                  isIncome
                                    ? "text-green-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {isIncome ? "+" : "-"}{" "}
                                {formatCurrency(
                                  transaction.amount
                                )}
                              </p>

                            </div>
                          );
                        }
                      )

                    )}

                  </div>
                </div>

                {/* ================= QUICK ACTION ================= */}

                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-6 sm:flex-row">

                  <div>

                    <h3 className="font-bold">
                      Ready to update your budget?
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Add your latest income or expense to
                      keep your dashboard accurate.
                    </p>

                  </div>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        router.push("/expenses")
                      }
                      className="rounded-xl bg-[#173b2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c]"
                    >
                      + Add Expense
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push("/incomes")
                      }
                      className="rounded-xl bg-[#173b2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c]"
                    >
                      + Add Income
                    </button>

                  </div>

                </div>

              </>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  amount,
  subtitle,
  icon,
  highlight = false,
}: {
  title: string;
  amount: string;
  subtitle: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-[#173b2a] bg-[#173b2a] text-white"
          : "border-[#e5e8e1] bg-white"
      }`}
    >
      <div className="flex items-start justify-between">

        <p
          className={`text-sm ${
            highlight
              ? "text-green-200"
              : "text-gray-500"
          }`}
        >
          {title}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            highlight
              ? "bg-white/10 text-white"
              : "bg-[#eef4ef] text-[#173b2a]"
          }`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-5 text-2xl font-bold">
        {amount}
      </p>

      <p
        className={`mt-2 text-xs ${
          highlight
            ? "text-green-200"
            : "text-gray-400"
        }`}
      >
        {subtitle}
      </p>

    </div>
  );
}