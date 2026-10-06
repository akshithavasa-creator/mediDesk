interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse rounded-md bg-zinc-200
        ${className}
      `}
      aria-hidden="true"
    />
  );
}

export function AppointmentCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full border border-zinc-200" />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
    </div>
  );
}

export function EmptyStateSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
