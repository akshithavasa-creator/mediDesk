import type { AppointmentWithDoctor } from "@/lib/patients";
import { format } from "date-fns";

interface AppointmentCardProps {
  appointment: AppointmentWithDoctor;
  showReason?: boolean;
  showDoctor?: boolean;
  actions?: React.ReactNode;
  interactive?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  checked_in: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  no_show: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function AppointmentCard({
  appointment,
  showReason = false,
  showDoctor = true,
  actions,
  interactive = true,
}: AppointmentCardProps) {
  const { scheduledAtLocal, doctor, status } = appointment;
  const parsed = new Date(scheduledAtLocal);
  const dateLabel = format(parsed, "EEE, MMM d, yyyy");
  const timeLabel = format(parsed, "h:mm a");

  return (
    <div
      className={`
        rounded-xl border border-zinc-200 bg-white p-5 shadow-sm
        ${interactive ? "transition-colors hover:border-zinc-300 hover:shadow" : ""}
      `}
      role="article"
      aria-labelledby={`apt-${appointment.id}-title`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {showDoctor && doctor && (
            <div className="flex flex-col gap-0.5">
              <span id={`apt-${appointment.id}-title`} className="text-sm font-semibold text-zinc-900">
                {doctor.fullName ?? "Doctor"}
              </span>
              {doctor.specialization && (
                <span className="text-xs text-zinc-500">{doctor.specialization}</span>
              )}
            </div>
          )}
          <span
            className={`
              inline-flex rounded-full border px-2.5 py-1 text-xs font-medium
              ${STATUS_BADGE_CLASSES[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"}
            `}
            role="status"
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
          <time dateTime={appointment.scheduledAt} className="font-medium text-zinc-900">
            {dateLabel}
          </time>
          <span>{timeLabel}</span>
          {appointment.durationMinutes > 0 && (
            <span>
              {appointment.durationMinutes} min
            </span>
          )}
        </div>

        {showReason && appointment.notes && (
          <p className="text-sm leading-relaxed text-zinc-600">
            {appointment.notes}
          </p>
        )}

        {actions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
