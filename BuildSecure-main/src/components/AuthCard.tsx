import type { ReactNode } from "react";
import { MediDeskLogo } from "./MediDeskLogo";

interface AuthCardProps {
  logoSize?: "sm" | "md" | "lg";
  title: string;
  subtitle: string;
  tagline?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ logoSize = "md", title, subtitle, tagline, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <MediDeskLogo size={logoSize} />
          <p className="mt-3 text-sm text-teal-700">{tagline ?? "Secure clinic and appointment management"}</p>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-zinc-500">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">{footer}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Only synthetic/demo data is used. Do not use real credentials.
      </p>
    </div>
  );
}
