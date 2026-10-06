"use client";

import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api-client";
import { AuthCard } from "@/components/AuthCard";
import { z } from "zod";
import { useState } from "react";

const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

const LOCKOUT_MESSAGE = "Too many attempts, please wait a minute";

function isRateLimited(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  if (typeof e.status === "number" && e.status === 429) return true;
  if (typeof e.code === "string" && /rate.?limit/i.test(e.code)) return true;
  return false;
}

export default function LoginPage() {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const isLockedOut = lockoutUntil != null && lockoutUntil > Date.now();
  const disabled = isSubmitting || isLockedOut;

  let remainingSeconds = 0;
  if (isLockedOut && lockoutUntil != null) {
    remainingSeconds = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
  }

  async function handleLogin(values: z.infer<typeof loginSchema>) {
    setServerError(null);
    setIsSubmitting(true);

    const email = values.email;
    const password = values.password;

    try {
      // POST /api/auth/login sets the HTTP-only medidesk_session cookie;
      // authApi.login then reads GET /api/auth/me for the signed-in user.
      const user = await authApi.login({ email, password });

      const target =
        user.role === "doctor"
          ? "/doctor/dashboard"
          : user.role === "admin"
            ? "/admin/dashboard"
            : "/patient/dashboard";

      router.push(target);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && isRateLimited(error)) {
        setLockoutUntil(Date.now() + 60_000);
        setServerError(LOCKOUT_MESSAGE);
        return;
      }
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 400 || error.status === 404)
      ) {
        setServerError("Invalid email or password");
        return;
      }
      if (error instanceof ApiError) {
        setServerError(error.message);
        return;
      }
      setServerError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      logoSize="md"
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      tagline="Secure clinic and appointment management"
      footer={
        <p className="text-sm text-zinc-500">
          Do not have an account?{" "}
          <a href="/register" className="font-medium text-teal-700 underline">
            Create one
          </a>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const data = new FormData(form);
          const parsed = loginSchema.safeParse({
            email: data.get("email"),
            password: data.get("password"),
          });

          if (!parsed.success) {
            return;
          }

          handleLogin(parsed.data);
        }}
        className="flex flex-col gap-5"
      >
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className={`
            w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
            placeholder-zinc-400
            focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        />
        <input
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          minLength={8}
          className={`
            w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
            placeholder-zinc-400
            focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
            disabled:cursor-not-allowed disabled:opacity-50
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

        {isLockedOut && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <svg className="h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {LOCKOUT_MESSAGE}. Resumes in {remainingSeconds}s
          </div>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="
            w-full inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white
            transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {isLockedOut && remainingSeconds > 0 && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var target = ${lockoutUntil};
                var check = function(){
                  if (target <= Date.now()){
                    window.location.reload();
                  } else {
                    setTimeout(check, 250);
                  }
                };
                check();
              })();
            `,
          }}
        />
      )}
    </AuthCard>
  );
}
