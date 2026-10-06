"use client";

import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api-client";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      // POST /api/auth/logout invalidates the HTTP-only session cookie
      // server-side; there is no client-stored token to clear.
      await authApi.logout();
      router.push("/login");
      router.refresh();
    } catch {
      // Session could not be invalidated (e.g. server unreachable) —
      // allow the user to retry instead of pretending the sign-out worked.
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="
        inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5
        text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
