import { Activity } from "lucide-react";

export function MediDeskLogo({ size = "md", showText = true }: { size?: "sm" | "md" | "lg"; showText?: boolean }) {
  const sizes: Record<string, string> = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizes: Record<string, string> = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center rounded-full border border-teal-200 bg-teal-50 p-1">
        <Activity
          className={`${sizes[size]} text-teal-700`}
          aria-hidden="true"
        />
      </div>
      {showText && (
        <span
          className={`font-semibold tracking-tight text-zinc-900 ${textSizes[size]}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          MediDesk
        </span>
      )}
    </div>
  );
}
