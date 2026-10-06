export type BookingDoctor = {
  id: string;
  fullName: string | null;
  specialization: string | null;
  bio: string | null;
};

export type BookingSlot = {
  scheduledAt: string; // ISO 8601 UTC
  label: string; // local-friendly display label
};

export type BookingResult =
  | { ok: true; appointmentId: string }
  | {
      ok: false;
      code: "slot_taken" | "outside_working_hours" | "too_many_active_bookings" | "doctor_inactive" | "past_slot" | "reason_too_long" | "invalid_patient" | "unknown";
      message: string;
    };

type BookingFailureCode = Extract<BookingResult, { ok: false }>["code"];

export function bookingCodeLabel(code: BookingFailureCode): string {
  switch (code) {
    case "slot_taken":
      return "This slot is no longer available";
    case "outside_working_hours":
      return "This time is outside the doctor's working hours";
    case "too_many_active_bookings":
      return "You already have too many active bookings";
    case "doctor_inactive":
      return "This doctor is not currently available";
    case "past_slot":
      return "Cannot book a past time";
    case "reason_too_long":
      return "Reason must be 200 characters or fewer";
    case "invalid_patient":
      return "Invalid patient";
    default:
      return "Could not book the appointment";
  }
}
