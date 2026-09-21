"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest<LoginResponse>("/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("auth_token", data.token);

      router.push("/");
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173b2a] text-2xl text-white">
            ₿
          </div>

          <h1 className="mt-4 text-3xl font-bold text-[#172117]">
            BudgetWise
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Smart money management
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#e5e8e1] bg-white p-8 shadow-sm">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172117]">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Sign in to manage your finances.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
              />
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#173b2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          {/* Register */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="font-semibold text-[#173b2a] hover:underline"
            >
              Create an account
            </button>
          </p>

        </div>
      </div>
    </main>
  );
}