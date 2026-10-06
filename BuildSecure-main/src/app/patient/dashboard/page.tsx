import { redirect } from "next/navigation";
import { requirePatient } from "@/lib/auth";
import { getPatientDashboardData } from "@/lib/patients";
import { PatientLayout } from "@/components/PatientLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { BookOpen, CheckCircle, XCircle, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AppointmentCardSkeleton } from "@/components/Skeleton";

export const metadata = {
  title: "Dashboard",
};

export default async function PatientDashboardPage() {
  const session = await requirePatient();
  const { counts, upcomingAppointments, error } = await getPatientDashboardData();

  return (
    <PatientLayout title="Dashboard">
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900">
          Hi, {session.fullName ?? "there"} 👋
        </h2>
        <p className="mt-1 text-zinc-500">
          Here is a quick summary of your appointments.
        </p>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-3" aria-label="Appointment summary">
        <SummaryCard
          icon={<Calendar className="h-5 w-5 text-teal-700" />}
          label="Upcoming"
          value={counts.upcoming}
          color="teal"
          href="/patient/appointments?filter=upcoming"
        />
        <SummaryCard
          icon={<CheckCircle className="h-5 w-5 text-green-700" />}
          label="Completed"
          value={counts.completed}
          color="green"
        />
        <SummaryCard
          icon={<XCircle className="h-5 w-5 text-zinc-500" />}
          label="Cancelled"
          value={counts.cancelled}
          color="zinc"
        />
      </section>

      <section className="mb-8" aria-label="Upcoming appointments">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">
            Next appointments
          </h3>
          <Link
            href="/patient/appointments?filter=upcoming"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            See all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : upcomingAppointments.length === 0 ? (
            <EmptyAppointmentList />
          ) : (
            upcomingAppointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} showDoctor />
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-zinc-900">
            No upcoming appointments?
          </h3>
          <p className="text-sm text-zinc-500">
            Book a visit with one of our doctors.
          </p>
        </div>
        <div className="mt-4">
          <Link
            href="/patient/book"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Book appointment
          </Link>
        </div>
      </section>
    </PatientLayout>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "teal" | "green" | "zinc";
  href?: string;
}) {
  const colors: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800",
    green: "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800",
    zinc: "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800",
  };

  const content = (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{label}</span>
        {icon}
      </div>
      <span className="text-3xl font-semibold text-zinc-900">{value}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={colors[color]}>
        {content}
      </Link>
    );
  }

  return <div className={colors[color]}>{content}</div>;
}

function EmptyAppointmentList() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
        <Calendar className="h-6 w-6 text-teal-600" aria-hidden="true" />
      </div>
      <p className="text-sm text-zinc-600">
        You do not have any upcoming appointments.
      </p>
      <Link
        href="/patient/book"
        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        Book one
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
