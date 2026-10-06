import {
  ApiError,
  appointmentsApi,
  doctorsApi,
  type Doctor,
} from "@/lib/api-client";
import type { BookingResult, BookingSlot } from "@/types/bookings";

/**
 * Browser booking service for the patient booking flow.
 *
 * Replaces the old Supabase-backed module with real calls to the new
 * backend through the shared API client (HTTP-only session cookie).
 * Loader functions never fake data: failures surface as real error
 * messages, and `bookAppointment` maps HTTP failures to a `{ ok: false }`
 * result carrying the server's own message.
 */

export type DoctorWithProfile = {
  id: string;
  full_name: string | null;
  specialization: string | null;
  bio: string | null;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "09:30" -> "9:30 AM" */
function to12h(time: string): string {
  const [hRaw, m] = time.split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

export async function listActiveDoctors(): Promise<DoctorWithProfile[]> {
  const doctors = await doctorsApi.list();
  if (!Array.isArray(doctors)) {
    throw new ApiError("The server returned an unexpected response.", 0);
  }
  return doctors
    .filter((d: Doctor) => d.isActive !== false)
    .map((d: Doctor) => ({
      id: d.id,
      full_name: d.name ?? null,
      specialization: d.specialty ?? null,
      bio: d.bio ?? null,
    }));
}

export async function loadAvailableSlots(
  doctorId: string,
  date: string,
): Promise<{ slots: BookingSlot[]; error: string | null }> {
  try {
    const times = await doctorsApi.getSlots(doctorId, date);
    if (!Array.isArray(times)) {
      return { slots: [], error: "The server returned an unexpected response." };
    }
    return {
      slots: times.map((time) => ({
        scheduledAt: `${date}T${time}:00`,
        label: to12h(time),
      })),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : "Could not reach the server. Please try again.";
    return { slots: [], error: message };
  }
}

export async function bookAppointment(
  _userId: string,
  doctorId: string,
  scheduledAt: string,
  reason: string,
): Promise<BookingResult> {
  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return {
      ok: false,
      code: "unknown",
      message: "The selected time slot is no longer valid. Please try again.",
    };
  }

  const date = `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  const time = `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;

  try {
    const appointment = await appointmentsApi.create({
      doctorId,
      date,
      time,
      reason: reason || undefined,
    });
    return { ok: true, appointmentId: appointment.id };
  } catch (err) {
    if (err instanceof ApiError) {
      const code =
        err.status === 409
          ? "slot_taken"
          : err.status === 404
            ? "doctor_inactive"
            : err.status === 403
              ? "invalid_patient"
              : "unknown";
      return { ok: false, code, message: err.message };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Could not reach the server. Please try again.",
    };
  }
}
