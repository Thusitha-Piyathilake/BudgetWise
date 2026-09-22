"use client";

import { usePathname, useRouter } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: "⌂",
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: "↕",
  },
  {
    name: "Recurring",
    path: "/recurring",
    icon: "↻",
  },
  {
    name: "Budget",
    path: "/budget",
    icon: "◔",
  },
  {
    name: "Savings",
    path: "/savings",
    icon: "◉",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[#e5e8e1] bg-white p-6 lg:flex lg:flex-col">
      {/* ================= LOGO ================= */}

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

      {/* ================= NAVIGATION ================= */}

      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive =
            item.path === "/"
              ? pathname === "/"
              : pathname.startsWith(item.path);

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => router.push(item.path)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-[#e8f1eb] text-[#173b2a]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">
                {item.icon}
              </span>

              {item.name}
            </button>
          );
        })}
      </nav>

      {/* ================= 50 / 30 / 20 INFORMATION ================= */}

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
  );
}