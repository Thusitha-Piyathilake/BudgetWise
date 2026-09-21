"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

type RegisterResponse = {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest<RegisterResponse>(
        "/register",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
          }),
        }
      );

      localStorage.setItem("auth_token", data.token);

      router.push("/");
    } catch (error) {
      console.error("Register error:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Registration failed. Please try again.");
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

        {/* Register Card */}
        <div className="rounded-2xl border border-[#e5e8e1] bg-white p-8 shadow-sm">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172117]">
              Create your account
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Start managing your money with BudgetWise.
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
            onSubmit={handleRegister}
            className="space-y-5"
          >

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
              />
            </div>

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
                placeholder="Create a password"
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="passwordConfirmation"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>

              <input
                id="passwordConfirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(
                    event.target.value
                  )
                }
                placeholder="Confirm your password"
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition focus:border-[#173b2a] focus:ring-2 focus:ring-[#173b2a]/10"
              />
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#173b2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24543c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>

          {/* Login */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-[#173b2a] hover:underline"
            >
              Sign in
            </button>
          </p>

        </div>
      </div>
    </main>
  );
}