"use client";

import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /*
  |--------------------------------------------------------------------------
  | Authentication Pages
  |--------------------------------------------------------------------------
  |
  | Login and Register should NOT have the application sidebar.
  |
  */

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  /*
  |--------------------------------------------------------------------------
  | Application Pages
  |--------------------------------------------------------------------------
  |
  | All authenticated application pages use the same sidebar.
  |
  */

  return (
    <div className="flex min-h-screen bg-[#f7f8f5]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}