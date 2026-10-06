import type { ReactNode } from "react";
import Link from "next/link";
import { MediDeskLogo } from "@/components/MediDeskLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { Calendar, FileText, Plus, Home, ClipboardList, LogOut } from "lucide-react";

interface PatientLayoutProps {
  children: ReactNode;
  title: string;
}

const NAV_ITEMS = [
  { href: "/patient/dashboard", label: "Dashboard", icon: Home },
  { href: "/patient/book", label: "Book", icon: Plus },
  { href: "/patient/appointments", label: "Appointments", icon: Calendar },
  { href: "/patient/records", label: "Records", icon: ClipboardList },
];

export function PatientLayout({ children, title }: PatientLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/patient/dashboard" className="flex items-center gap-2 text-zinc-900 transition-colors hover:text-zinc-700">
            <MediDeskLogo size="sm" />
            <span className="text-base font-semibold sm:hidden">MediDesk</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Patient menu">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.href === `/patient/${title.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`
                   inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                    ${active
                      ? "bg-teal-50 text-teal-800"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}
                  `}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-zinc-500 sm:block">
              Patient
            </span>
            <LogoutButton />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-zinc-200 bg-white">
          <nav className="flex flex-wrap justify-center gap-1 p-2" aria-label="Patient menu">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.href === `/patient/${title.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`
                   flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${active
                      ? "bg-teal-50 text-teal-800"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}
                  `}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500 sm:hidden">
            <MediDeskLogo size="sm" />
            <span className="font-semibold text-zinc-900">MediDesk</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-1 text-zinc-500">
            Manage your appointments, records, and care details.
          </p>

          <div className="mt-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
