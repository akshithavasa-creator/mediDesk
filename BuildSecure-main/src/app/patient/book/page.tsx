"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api-client";
import { listActiveDoctors, loadAvailableSlots, bookAppointment } from "@/lib/bookings-browser";
import type { DoctorWithProfile } from "@/lib/bookings-browser";
import type { BookingSlot, BookingResult } from "@/types/bookings";
import { PatientLayout } from "@/components/PatientLayout";
import { ConfirmModal } from "@/components/ConfirmModal";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, BookOpen, Calendar, Clock, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const reasonSchema = z.object({
  reason: z.string().max(200, "Reason must be 200 characters or fewer"),
});

type ReasonFormValues = { reason: string };

type BookingStep =
  | { step: "choose_doctor" }
  | { step: "choose_date"; value: string }
  | { step: "choose_slot"; value: string }
  | { step: "enter_reason"; value: string }
  | { step: "confirming" }
  | { step: "success"; appointmentId: string; scheduledAt: string }
  | { step: "error"; message: string };

export default function BookAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>({ step: "choose_doctor" });
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reasonForm = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  const statusMessage = error ?? "";

  async function loadDoctors() {
    setLoading(true);
    try {
      const result = await listActiveDoctors();
      setDoctors(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectDoctor(id: string) {
    setSelectedDoctorId(id);
    setDate("");
    setSlots([]);
    setSelectedSlot(null);
    setError(null);
    setStep({ step: "choose_date", value: "" });
  }

  function selectDate(dateValue: string) {
    setDate(dateValue);
    setSelectedSlot(null);
    setError(null);
    setStep({ step: "choose_date", value: dateValue });
  }

  async function loadSlots() {
    if (!selectedDoctorId || !date) return;
    setLoading(true);
    try {
      const result = await loadAvailableSlots(selectedDoctorId, date);
      setSlots(result.slots);
      if (result.error) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  function selectSlot(value: string) {
    setSelectedSlot(value);
    setError(null);
    setStep({ step: "choose_slot", value });
  }

  function continueToReason() {
    if (!selectedSlot) return;
    setStep({ step: "enter_reason", value: selectedSlot });
  }

  async function submitBooking() {
    const values = reasonForm.getValues();

    let userId = "";
    try {
      const user = await authApi.me();
      userId = user.id;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        userId = "";
      } else {
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not reach the server. Please try again.";
        setError(message);
        setStep({ step: "error", message });
        return;
      }
    }
    const doctorId = selectedDoctorId;
    const slot = selectedSlot;

    if (!userId) {
      setError("You must be signed in to book an appointment.");
      setStep({ step: "error", message: "You must be signed in to book an appointment." });
      return;
    }

    if (!doctorId || !slot) {
      setError("Selection lost, please start again.");
      setStep({ step: "error", message: "Selection lost, please start again." });
      return;
    }

    setStep({ step: "confirming" });
    setLoading(true);

    try {
      const result = await bookAppointment(userId, doctorId, slot, values.reason);

      if (!result.ok) {
        setError(result.message);
        setStep({ step: "error", message: result.message });
        return;
      }

      setStep({
        step: "success",
        appointmentId: result.appointmentId,
        scheduledAt: slot,
      });
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setStep({ step: "choose_doctor" });
    setSelectedDoctorId(null);
    setDate("");
    setSlots([]);
    setSelectedSlot(null);
    setError(null);
    reasonForm.reset();
  }

  function goToStep(target: BookingStep) {
    setStep(target);
    setError(null);
  }

  return (
    <PatientLayout title="Book appointment">
      <div className="flex flex-col gap-6">
        {statusMessage && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Progress */}          <ol className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 sm:gap-4" aria-label="Booking progress">
          <StepItem current={isCurrentOrDone(step, "choose_doctor")} label="Choose a doctor" />
          <StepItem current={isCurrentOrDone(step, "choose_date")} label="Pick a date" />
          <StepItem current={isCurrentOrDone(step, "choose_slot")} label="Pick a slot" />
          <StepItem current={isCurrentOrDone(step, "enter_reason")} label="Reason" />
          <StepItem current={isCurrentOrDone(step, "success")} label="Confirm" />
        </ol>

        {/* Step content */}
        <div className="flex flex-col gap-6">
          {step.step === "choose_doctor" && (
            <ChooseDoctorStep
              doctors={doctors}
              loading={loading}
              onSelectDoctor={selectDoctor}
              onRefresh={loadDoctors}
            />
          )}

          {step.step === "choose_date" && (
            <ChooseDateStep
              doctorId={selectedDoctorId ?? ""}
              value={date}
              onSelectDate={selectDate}
              onContinue={loadSlots}
              loading={loading}
              onBack={resetFlow}
            />
          )}

          {step.step === "choose_slot" && (
            <ChooseSlotStep
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={selectSlot}
              onBack={() => setStep({ step: "choose_date", value: date })}
              onContinue={continueToReason}
              loading={loading}
              error={error}
            />
          )}

          {step.step === "enter_reason" && (
            <EnterReasonStep
              slotLabel={selectedSlot ? formatSlotLabel(selectedSlot) : ""}
              onBack={() => setStep({ step: "choose_slot", value: selectedSlot ?? "" })}
              onSubmit={submitBooking}
              form={reasonForm}
              loading={loading}
            />
          )}

          {step.step === "confirming" && (
            <ConfirmingStep />
          )}

          {step.step === "success" && (
            <SuccessStep
              appointmentId={step.appointmentId}
              scheduledAt={step.scheduledAt}
              onDone={() => router.push("/patient/appointments")}
              onBookAnother={() => resetFlow()}
            />
          )}

          {step.step === "error" && (
            <ErrorStep message={step.message} onTryAgain={resetFlow} />
          )}
        </div>

        <ConfirmModal
          open={confirmModal?.open ?? false}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal?.onConfirm ?? (() => {})}
          title={confirmModal?.title ?? ""}
          description={confirmModal?.description ?? ""}
        />
      </div>
    </PatientLayout>
  );
}

function isCurrentOrDone(step: BookingStep, name: string): boolean {
  const doneSteps = ["choose_doctor", "choose_date", "choose_slot", "enter_reason"];
  return step.step === name || doneSteps.includes(step.step as never);
}

function StepItem({
  current,
  label,
}: {
  current: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`
          flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium
          ${current ? "border-teal-600 bg-teal-100 text-teal-800" : "border-zinc-300 bg-zinc-50 text-zinc-400"}
        `}
      >
        {current ? <CheckCircle className="h-4 w-4" aria-hidden="true" /> : "•"}
      </span>
      <span className="hidden sm:block">{label}</span>
    </li>
  );
}

function ChooseDoctorStep({
  doctors,
  loading,
  onSelectDoctor,
  onRefresh,
}: {
  doctors: Awaited<ReturnType<typeof listActiveDoctors>>;
  loading: boolean;
  onSelectDoctor: (id: string) => void;
  onRefresh: () => void;
}) {
  if (loading && doctors.length === 0) {
    return (
      <div className="flex flex-col gap-3">          <SkeletonCard label="Doctor name" sub="Specialization" />
        <SkeletonCard label="Doctor name" sub="Specialization" />
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <AlertCircle className="h-6 w-6 text-amber-600" aria-hidden="true" />
        </div>
        <p className="text-sm text-zinc-600">
          No doctors are available right now.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500">
        Choose a doctor to see available times.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {doctors.map((doctor) => (
          <button
            key={doctor.id}
            type="button"
            onClick={() => onSelectDoctor(doctor.id)}
            className="
              group flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-teal-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
            "
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-zinc-900">
                {doctor.full_name ?? "Dr. "}
              </span>
              {doctor.specialization && (
                <span className="text-xs text-zinc-500">{doctor.specialization}</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
              <CheckCircle className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
              <span>Available</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChooseDateStep({
  doctorId,
  value,
  onSelectDate,
  onContinue,
  loading,
  onBack,
}: {
  doctorId: string;
  value: string;
  onSelectDate: (date: string) => void;
  onContinue: () => void;
  loading: boolean;
  onBack: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  const options = [];
  for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    options.push(iso);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <Calendar className="h-4 w-4 text-teal-600" aria-hidden="true" />
          Choose a date
        </label>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {options.map((iso) => {
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={`
                rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500
                ${selected
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"}
              `}
            >
              {formatDateLabel(iso)}
            </button>
          );
        })}
      </div>

      {value && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">
              {formatDateLabel(value)}
            </span>
            <button
              type="button"
              onClick={onContinue}
              disabled={loading}
              className="
                inline-flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Load slots
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChooseSlotStep({
  slots,
  selectedSlot,
  onSelectSlot,
  onBack,
  onContinue,
  loading,
  error,
}: {
  slots: Awaited<ReturnType<typeof loadAvailableSlots>>["slots"];
  selectedSlot: string | null;
  onSelectSlot: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <h3 className="text-base font-semibold text-zinc-900">
          Choose a time
        </h3>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {slots.length === 0 && !loading ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-6 w-6 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-sm text-zinc-600">
            No available times for this date.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Choose another date
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {slots.map((slot) => {
            const selected = slot.scheduledAt === selectedSlot;
            return (
              <button
                key={slot.scheduledAt}
                type="button"
                onClick={() => onSelectSlot(slot.scheduledAt)}
                className={`
                  rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500
                  ${selected
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"}
                `}
                aria-pressed={selected}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      )}

      {selectedSlot && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="
              inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function EnterReasonStep({
  slotLabel,
  onBack,
  onSubmit,
  form,
  loading,
}: {
  slotLabel: string;
  onBack: () => void;
  onSubmit: () => void;
  form: ReturnType<typeof useForm<ReasonFormValues>>;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>            <h3 className="text-base font-semibold text-zinc-900">
        Tell us why
      </h3>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        You are booking for{" "}
        <span className="font-medium text-zinc-900">{slotLabel}</span>.
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = form.getValues();
          if (!form.trigger()) return;
          onSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="text-sm font-medium text-zinc-700">
            Reason for visit <span className="text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            placeholder="Brief reason or symptoms"
            className={`
              w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder-zinc-400 resize-y
              focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
            `}
            {...form.register("reason")}
          />
          {form.formState.errors.reason && (
            <p className="text-sm text-red-600">{form.formState.errors.reason.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="
              inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Confirm booking"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmingStep() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-teal-700" aria-hidden="true" />
      <p className="text-sm text-zinc-600">Booking your appointment...</p>
    </div>
  );
}

function SuccessStep({
  appointmentId,
  scheduledAt,
  onDone,
  onBookAnother,
}: {
  appointmentId: string;
  scheduledAt: string;
  onDone: () => void;
  onBookAnother: () => void;
}) {
  const parsed = new Date(scheduledAt);

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
        <CheckCircle className="h-7 w-7 text-teal-700" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Booking confirmed
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Your appointment has been booked.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm text-zinc-600 w-full max-w-sm">
        Appointment #{appointmentId.slice(0, 8)} •{" "}
        {format(parsed, "EEE, MMM d, yyyy 'at' h:mm a")}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDone}
          className="
            inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50
          "
        >
          View appointments
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onBookAnother}
          className="
            inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800
          "
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Book another
        </button>
      </div>
    </div>
  );
}

function ErrorStep({ message, onTryAgain }: { message: string; onTryAgain: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-7 w-7 text-red-600" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Could not book this appointment
        </h3>
        <p className="mt-1 text-sm text-zinc-500">{message}</p>
      </div>
      <button
        type="button"
        onClick={onTryAgain}
        className="
          inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50
        "
      >
        Try again
      </button>
    </div>
  );
}

function SkeletonCard({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-200" />
        <div className="h-3 w-1/2 animate-pulse rounded-md bg-zinc-200" />
      </div>
    </div>
  );
}

import { format } from "date-fns";

function formatSlotLabel(scheduledAt: string): string {
  const parsed = new Date(scheduledAt);
  if (isNaN(parsed.getTime())) return scheduledAt;
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  const hours = local.getHours();
  const minutes = local.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${minutes} ${ampm}`;
}

function formatDateLabel(iso: string): string {
  const parsed = new Date(iso + "T00:00:00");
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
