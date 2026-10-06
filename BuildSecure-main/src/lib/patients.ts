import { appointmentsApi, ApiError, type Appointment } from "@/lib/api-client";

/**
 * Patient dashboard data loader.
 *
 * Replaces the old Supabase service with real calls to the new backend via
 * the shared API client (HTTP-only session cookie). No data is ever faked:
 * when the API call fails, `error` carries the real message and the
 * appointment lists are empty.
 */

export type AppointmentWithDoctor = {
  id: string;
  /** ISO timestamp used for <time dateTime> and date/time labels. */
  scheduledAt: string;
  /** Local display timestamp parsed by AppointmentCard. */
  scheduledAtLocal: string;
  status: string;
  durationMinutes: number;
  notes?: string | null;
  doctor?: {
    fullName: string | null;
    specialization: string | null;
  } | null;
};

export type PatientDashboardData = {
  counts: {
    upcoming: number;
    completed: number;
    cancelled: number;
  };
  upcomingAppointments: AppointmentWithDoctor[];
  error: string | null;
};

const UPCOMING_STATUSES = new Set(["pending", "confirmed", "scheduled"]);

function toAppointmentWithDoctor(apt: Appointment): AppointmentWithDoctor {
  const scheduledAt = `${apt.date}T${apt.time ?? "00:00"}:00`;
  return {
    id: apt.id,
    scheduledAt,
    scheduledAtLocal: scheduledAt,
    status: apt.status,
    durationMinutes: 0,
    notes: apt.reason ?? null,
    doctor:
      apt.doctorName || apt.specialty
        ? {
            fullName: apt.doctorName ?? null,
            specialization: apt.specialty ?? null,
          }
        : null,
  };
}

export async function getPatientDashboardData(): Promise<PatientDashboardData> {
  try {
    const appointments = await appointmentsApi.list();

    if (!Array.isArray(appointments)) {
      return {
        counts: { upcoming: 0, completed: 0, cancelled: 0 },
        upcomingAppointments: [],
        error: "The server returned an unexpected response.",
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;
    const upcomingAppointments: AppointmentWithDoctor[] = [];

    for (const apt of appointments) {
      if (apt.status === "completed") {
        completed += 1;
      } else if (apt.status === "cancelled") {
        cancelled += 1;
      } else if (UPCOMING_STATUSES.has(apt.status) && apt.date >= today) {
        upcoming += 1;
        upcomingAppointments.push(toAppointmentWithDoctor(apt));
      }
    }

    upcomingAppointments.sort((a, b) =>
      a.scheduledAtLocal.localeCompare(b.scheduledAtLocal),
    );

    return {
      counts: { upcoming, completed, cancelled },
      upcomingAppointments,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : "Could not reach the server. Please try again.";
    return {
      counts: { upcoming: 0, completed: 0, cancelled: 0 },
      upcomingAppointments: [],
      error: message,
    };
  }
}
