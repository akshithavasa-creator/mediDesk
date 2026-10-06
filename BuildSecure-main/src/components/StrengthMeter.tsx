import { useMemo } from "react";

interface StrengthMeterProps {
  password: string;
}

type Level = "empty" | "weak" | "fair" | "good" | "strong";

function scorePassword(password: string): Level {
  if (!password) return "empty";

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  if (score <= 4) return "good";
  return "strong";
}

const LABELS: Record<Level, string> = {
  empty: "",
  weak: "Weak — add mixed characters",
  fair: "Fair — try adding symbols or length",
  good: "Good — decent mix of characters",
  strong: "Strong",
};

const BARS: Record<Level, string> = {
  empty: "bg-zinc-200",
  weak: "bg-red-500",
  fair: "bg-amber-500",
  good: "bg-blue-500",
  strong: "bg-teal-600",
};

export function StrengthMeter({ password }: StrengthMeterProps) {
  const level = useMemo(() => scorePassword(password), [password]);

  if (level === "empty") {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        <div className={`h-1.5 w-full rounded-full ${BARS[level]}`} />
      </div>
      <p className="text-xs text-zinc-500">{LABELS[level]}</p>
    </div>
  );
}
