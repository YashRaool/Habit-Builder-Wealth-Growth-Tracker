export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-soft flex flex-col justify-between h-[120px] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200/80 rounded" />
        <div className="h-8 w-8 bg-slate-200/80 rounded-xl" />
      </div>
      <div>
        <div className="h-7 w-32 bg-slate-200/80 rounded mt-2" />
        <div className="h-3 w-20 bg-slate-100 rounded mt-2" />
      </div>
    </div>
  );
}

export function CardSkeleton({ className = '', children }) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-soft animate-pulse ${className}`}>
      {children || (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-slate-200/80 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
          <div className="h-32 bg-slate-100/70 rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-4/5 bg-slate-100 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-soft animate-pulse">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-200/80 rounded" />
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 bg-slate-200/80 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-3.5 w-3/4 bg-slate-200/80 rounded" />
                <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-3.5 w-20 bg-slate-100 rounded hidden sm:block" />
            <div className="h-3.5 w-16 bg-slate-200/80 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-soft animate-pulse flex flex-col justify-between ${height}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-40 bg-slate-200/80 rounded" />
        <div className="h-4 w-16 bg-slate-100 rounded" />
      </div>
      <div className="flex-1 bg-slate-50/80 rounded-xl flex items-end justify-between p-4 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 flex gap-1 items-end justify-center h-full">
            <div
              className="w-1/2 bg-slate-200/70 rounded-t"
              style={{ height: `${20 + (i * 12) % 65}%` }}
            />
            <div
              className="w-1/2 bg-slate-200/40 rounded-t"
              style={{ height: `${15 + (i * 15) % 50}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
