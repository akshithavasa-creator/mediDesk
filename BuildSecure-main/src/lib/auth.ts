import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side session helpers for the MediDesk frontend.
 *
 * Authentication is handled by the backend's HTTP-only `medidesk_session`
 * cookie (server-side Prisma sessions). This module never stores or reads a
 * token in the browser; on the server it simply forwards the cookie to
 * GET /api/auth/me and maps the response to a `SessionUser`.
 *
 * `API_BASE_URL` lets the frontend reach the backend when it runs on a
 * different origin/port (defaults to same-origin).
 */

export type SessionUser = {
  id: string;
  email?: string;
  fullName?: string | null;
  role: "patient" | "doctor" | "admin";
};

const DEFAULT_API_BASE = "http://localhost:3000";

function apiBase(): string {
  return (process.env.API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/+$/, "");
}

export function requireRole(
  user: SessionUser | null,
  allowedRole: "patient" | "doctor" | "admin",
  fallbackPath = "/login",
): void {
  if (!user) {
    redirect(fallbackPath);
  }

  if (user.role !== allowedRole) {
    const dashboardMap: Record<SessionUser["role"], string> = {
      patient: "/patient/dashboard",
      doctor: "/doctor/dashboard",
      admin: "/admin/dashboard",
    };
    redirect(dashboardMap[user.role] ?? fallbackPath);
  }
}

/**
 * Returns the signed-in user for the current request by validating the
 * session cookie against GET /api/auth/me, or null when there is no valid
 * session (or the backend is unreachable — logged server-side, never faked).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  let cookieValue: string | undefined;
  try {
    const store = await cookies();
    cookieValue = store.get("medidesk_session")?.value;
  } catch {
    return null;
  }
  if (!cookieValue) return null;

  try {
    const res = await fetch(`${apiBase()}/api/auth/me`, {
      headers: {
        accept: "application/json",
        cookie: `medidesk_session=${cookieValue}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      id?: unknown;
      email?: unknown;
      name?: unknown;
      fullName?: unknown;
      role?: unknown;
    };

    const role =
      data.role === "patient" || data.role === "doctor" || data.role === "admin"
        ? data.role
        : null;
    if (typeof data.id !== "string" || !role) {
      return null;
    }

    return {
      id: data.id,
      email: typeof data.email === "string" ? data.email : undefined,
      fullName:
        typeof data.fullName === "string"
          ? data.fullName
          : typeof data.name === "string"
            ? data.name
            : null,
      role,
    };
  } catch (err) {
    console.error("[auth] could not reach GET /api/auth/me:", err);
    return null;
  }
}

export async function requireAuthSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePatientSession(): Promise<SessionUser> {
  const user = await requireAuthSession();
  requireRole(user, "patient");
  return user;
}

export async function requireDoctorSession(): Promise<SessionUser> {
  const user = await requireAuthSession();
  requireRole(user, "doctor");
  return user;
}

export async function requireAdminSession(): Promise<SessionUser> {
  const user = await requireAuthSession();
  requireRole(user, "admin");
  return user;
}

export const requirePatient: typeof requirePatientSession = requirePatientSession;
export const requireDoctor: typeof requireDoctorSession = requireDoctorSession;
export const requireAdmin: typeof requireAdminSession = requireAdminSession;
