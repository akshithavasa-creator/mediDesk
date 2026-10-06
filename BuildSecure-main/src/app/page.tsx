import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { MediDeskLogo } from "@/components/MediDeskLogo";
import { BookOpen, ClipboardList, Shield, LogIn, UserPlus } from "lucide-react";

export default async function LandingPage() {
  const user = await getSessionUser();

  if (user) {
    const target =
      user.role === "doctor"
        ? "/doctor/dashboard"
        : user.role === "admin"
          ? "/admin/dashboard"
          : "/patient/dashboard";

    redirect(target);
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <MediDeskLogo size="md" />
          <nav className="flex gap-6 text-sm font-medium text-zinc-600">
            <Link href="#features" className="hover:text-zinc-900">
              Features
            </Link>
            <Link href="/login" className="text-teal-700 hover:text-teal-800">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <MediDeskLogo size="lg" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Clinics run smoother,{" "}
            <span className="text-teal-700">care runs safer</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
            MediDesk is a secure clinic and appointment management platform
            built for patients, doctors, and administrators.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
            >
              <UserPlus className="h-4 w-4" />
              Create account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          </div>
        </div>

        <section className="mx-auto mt-20 max-w-5xl" id="features">
          <h2 className="mb-2 text-center text-2xl font-semibold text-zinc-900">
            What you can do
          </h2>
          <p className="mb-10 text-center text-zinc-500">
            Three roles, one secure system.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6 text-teal-700" />}
              title="Book appointments"
              description="Patients can schedule visits, view upcoming appointments, and keep their care history in one place."
            />
            <FeatureCard
              icon={<ClipboardList className="h-6 w-6 text-teal-700" />}
              title="Doctor dashboard"
              description="Doctors manage their schedule, review patient charts, and record diagnoses and prescriptions securely."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-teal-700" />}
              title="Secure records"
              description="Every profile, record, and audit event is protected by authentication and row-level security."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-sm text-zinc-500">
        MediDesk · Built for a security-focused hackathon · Demo environment only
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}
