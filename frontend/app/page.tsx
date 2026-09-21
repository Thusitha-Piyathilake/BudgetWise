"use client";

import { useState } from "react";

const budgetData = [
  {
    name: "Essential Needs",
    percentage: 50,
    amount: 75000,
    spent: 32500,
    remaining: 42500,
    description: "Rent, groceries, bills & essentials",
  },
  {
    name: "Personal Wants",
    percentage: 30,
    amount: 45000,
    spent: 18500,
    remaining: 26500,
    description: "Shopping, entertainment & travel",
  },
  {
    name: "Savings",
    percentage: 20,
    amount: 30000,
    spent: 12000,
    remaining: 18000,
    description: "Emergency fund & investments",
  },
];

const transactions = [
  {
    name: "Grocery Shopping",
    category: "Essential Need",
    amount: -8500,
    date: "Today",
  },
  {
    name: "Monthly Salary",
    category: "Income",
    amount: 150000,
    date: "Sep 20",
  },
  {
    name: "Netflix",
    category: "Personal Want",
    amount: -1200,
    date: "Sep 19",
  },
  {
    name: "Electricity Bill",
    category: "Essential Need",
    amount: -4500,
    date: "Sep 18",
  },
];

export default function Home() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#172117]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-[#e5e8e1] bg-white p-6 lg:flex lg:flex-col">
          <div className="mb-10">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173b2a] text-xl text-white">
                ₿
              </div>
              <div>
                <h1 className="text-xl font-bold">BudgetWise</h1>
                <p className="text-xs text-gray-500">Smart money management</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {["Dashboard", "Transactions", "Budget", "Savings"].map((item) => (
              <button
                key={item}
                onClick={() => setActiveMenu(item)}
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
            <p className="text-xs text-green-200">50 / 30 / 20 Rule</p>
            <h3 className="mt-2 text-lg font-semibold">
              Build better money habits
            </h3>
            <p className="mt-2 text-xs leading-5 text-green-100">
              Keep your needs, wants and savings balanced every month.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-[#e5e8e1] bg-white px-6 py-5 lg:px-10">
            <div>
              <p className="text-sm text-gray-500">Monday, September 21, 2026</p>
              <h2 className="mt-1 text-2xl font-bold">Good evening 👋</h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 sm:block">
                September 2026
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

            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                title="Monthly Income"
                amount="LKR 150,000"
                subtitle="This month"
                icon="↗"
              />

              <SummaryCard
                title="Total Expenses"
                amount="LKR 69,000"
                subtitle="46% of your income"
                icon="↘"
              />

              <SummaryCard
                title="Available Balance"
                amount="LKR 81,000"
                subtitle="54% remaining"
                icon="✓"
                highlight
              />
            </div>

            {/* Budget section */}
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-[#e5e8e1] bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">50 / 30 / 20 Budget</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your monthly allocation
                    </p>
                  </div>

                  <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50">
                    Manage
                  </button>
                </div>

                <div className="mt-7 space-y-6">
                  {budgetData.map((budget) => {
                    const progress = Math.min(
                      (budget.spent / budget.amount) * 100,
                      100
                    );

                    return (
                      <div key={budget.name}>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{budget.name}</h4>
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
                              LKR {budget.spent.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              of LKR {budget.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-[#173b2a]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          LKR {budget.remaining.toLocaleString()} remaining
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Savings */}
              <div className="rounded-2xl border border-[#e5e8e1] bg-[#173b2a] p-6 text-white">
                <p className="text-sm text-green-200">Savings goal</p>

                <h3 className="mt-2 text-2xl font-bold">
                  Emergency Fund
                </h3>

                <p className="mt-1 text-sm text-green-100">
                  Building your financial safety net
                </p>

                <div className="mt-8">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold">LKR 72,000</p>
                      <p className="mt-1 text-xs text-green-200">
                        of LKR 150,000 goal
                      </p>
                    </div>

                    <span className="text-lg font-semibold">48%</span>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: "48%" }}
                    />
                  </div>
                </div>

                <button className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#173b2a] hover:bg-gray-100">
                  View Savings Goals
                </button>
              </div>
            </div>

            {/* Transactions */}
            <div className="rounded-2xl border border-[#e5e8e1] bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <div>
                  <h3 className="text-lg font-bold">Recent transactions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your latest income and expenses
                  </p>
                </div>

                <button className="text-sm font-semibold text-[#173b2a] hover:underline">
                  View all
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <div
                    key={`${transaction.name}-${transaction.date}`}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f3ef] text-lg">
                        {transaction.amount > 0 ? "↗" : "↘"}
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          {transaction.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {transaction.category} · {transaction.date}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`text-sm font-bold ${
                        transaction.amount > 0
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      LKR {Math.abs(transaction.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-6 sm:flex-row">
              <div>
                <h3 className="font-bold">Ready to update your budget?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your latest income or expense to keep your dashboard
                  accurate.
                </p>
              </div>

              <div className="flex gap-3">
                <button className="rounded-xl bg-[#173b2a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#24543c]">
                  + Add Expense
                </button>

                <button className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50">
                  + Add Income
                </button>
              </div>
            </div>
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
            highlight ? "text-green-200" : "text-gray-500"
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

      <p className="mt-5 text-2xl font-bold">{amount}</p>

      <p
        className={`mt-2 text-xs ${
          highlight ? "text-green-200" : "text-gray-400"
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}