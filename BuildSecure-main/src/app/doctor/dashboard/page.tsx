import { redirect } from "next/navigation";
import { requireDoctorSession } from "@/lib/auth";
import { Calendar, ClipboardList, Users, Activity } from "lucide-react";

export default async function DoctorDashboardPage() {
  await requireDoctorSession();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-zinc-900">
            <svg
              className="h-7 w-7 text-blue-600"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8ZM7 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM7 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM13 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
            </svg>
            <span className="text-lg font-semibold">MediDesk</span>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-zinc-600">
            <a href="#schedule" className="hover:text-zinc-900">
              Schedule
            </a>
            <a href="#patients" className="hover:text-zinc-900">
              Patients
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Doctor Dashboard
          </h1>
          <p className="mt-2 text-zinc-500">
            Manage appointments, patient records, and clinical notes.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex cursor-pointer flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-zinc-500">
                  Today&apos;s schedule
                </h2>
                <p className="text-lg font-semibold text-zinc-900">
                  4 appointments
                </p>
              </div>
            </div>

            <div className="flex cursor-pointer flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-zinc-500">
                  Pending charts
                </h2>
                <p className="text-lg font-semibold text-zinc-900">
                  2 to review
                </p>
              </div>
            </div>

            <div className="flex cursor-pointer flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-zinc-500">Active patients</h2>
                <p className="text-lg font-semibold text-zinc-900">
                  18 this month
                </p>
              </div>
            </div>

            <div className="flex cursor-pointer flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-zinc-500">
                  Recent activity
                </h2>
                <p className="text-lg font-semibold text-zinc-900">
                  6 updates
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
