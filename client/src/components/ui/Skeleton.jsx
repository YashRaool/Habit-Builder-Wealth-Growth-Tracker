export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/70 rounded-2xl ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-36 rounded-xl" />
      <Skeleton className="h-3 w-48 rounded-md" />
    </div>
  );
}

export function SkeletonRow({ cols = 4, className = '' }) {
  return (
    <div className={`flex items-center gap-4 p-4 border-b border-slate-100 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1 rounded-md" />
      ))}
    </div>
  );
}

