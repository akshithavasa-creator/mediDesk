"use client";

import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api-client";
import { AuthCard } from "@/components/AuthCard";
import { StrengthMeter } from "@/components/StrengthMeter";
import { z } from "zod";
import { useState } from "react";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Name is too long"),
    email: z
      .string()
      .email("Enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

type RegisterState = "form" | "submitting" | "complete" | "email_confirmation" | "error";

export default function RegisterPage() {
  const router = useRouter();

  const [state, setState] = useState<RegisterState>("form");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleRegister(values: z.infer<typeof registerSchema>) {
    setState("submitting");
    setServerError(null);

    try {
      // POST /api/auth/register creates the account and sets the HTTP-only
      // medidesk_session cookie server-side; no client token is involved.
      await authApi.register({
        name: values.fullName,
        email: values.email,
        password: values.password,
      });
      setState("complete");
    } catch (error) {
      setState("form");
      if (error instanceof ApiError && error.status === 409) {
        setServerError("An account with this email already exists.");
      } else if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError("Could not reach the server. Please try again.");
      }
    }
  }

  return (
    <AuthCard
      logoSize="md"
      title="Create an account"
      subtitle="Sign up to get started with MediDesk"
      tagline="Secure clinic and appointment management"
      footer={
        state !== "complete" && (
          <p className="text-sm text-zinc-500">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-teal-700 underline">
              Sign in
            </a>
          </p>
        )
      }
    >
      {state === "form" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            const parsed = registerSchema.safeParse({
              fullName: data.get("fullName"),
              email: data.get("email"),
              password: data.get("password"),
              confirmPassword: data.get("confirmPassword"),
            });

            if (!parsed.success) {
              return;
            }

            handleRegister(parsed.data);
          }}
          className="flex flex-col gap-5"
        >
          <input
            name="fullName"
            type="text"
            placeholder="Jane Doe"
            required
            className={`
              w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
              placeholder-zinc-400
              focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
            `}
          />
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className={`
              w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
              placeholder-zinc-400
              focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
            `}
          />
          <div className="flex flex-col gap-1.5">
            <input
              name="password"
              type="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`
                w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                placeholder-zinc-400
                focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
              `}
            />
            <StrengthMeter password={password} />
          </div>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            required
            className={`
              w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
              placeholder-zinc-400
              focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
            `}
          />

          {serverError && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <svg className="h-4 w-4 shrink-0 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5Z" />
              </svg>
              {serverError}
            </div>
          )}

          <button
            type="submit"
            className="
              w-full inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white
              transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Create account
          </button>

          <p className="text-xs text-zinc-400">
            Registration is patient-only. Your role is set by the system.
          </p>
        </form>
      )}

      {state === "submitting" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <svg className="h-8 w-8 animate-spin text-teal-700" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-zinc-600">Creating your account...</p>
        </div>
      )}

      {state === "complete" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <svg className="h-10 w-10 text-teal-700" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h2 className="text-lg font-semibold text-zinc-900">Registration complete</h2>
          <p className="text-sm text-zinc-600">You can now sign in to your account.</p>
          <a
            href="/login"
            className="mt-1 inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            Sign in
          </a>
        </div>
      )}

      {state === "email_confirmation" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <svg className="h-10 w-10 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          <h2 className="text-lg font-semibold text-zinc-900">Check your email</h2>
          <p className="text-sm text-zinc-600">
            We sent a confirmation link to your inbox. Once confirmed, you can sign in.
          </p>
          <a
            href="/login"
            className="mt-1 inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            Back to sign in
          </a>
        </div>
      )}
    </AuthCard>
  );
}
