export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-soft
        ${hover ? 'hover:border-slate-300 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500/30' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, trend, color = 'emerald', className = '', ...props }) {
  const iconThemes = {
    emerald: 'text-emerald-600 bg-emerald-50/80 border-emerald-100',
    blue: 'text-blue-600 bg-blue-50/80 border-blue-100',
    red: 'text-rose-600 bg-rose-50/80 border-rose-100',
    amber: 'text-amber-600 bg-amber-50/80 border-amber-100',
    violet: 'text-violet-600 bg-violet-50/80 border-violet-100',
    cyan: 'text-cyan-600 bg-cyan-50/80 border-cyan-100',
  };

  const themeClass = iconThemes[color] || iconThemes.emerald;

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-soft
        flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all duration-200 ${className}`}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          {Icon && (
            <span className={`p-2.5 rounded-xl border ${themeClass}`}>
              <Icon size={18} />
            </span>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2.5">{value}</p>
      </div>

      {(sub || trend !== undefined) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {sub && <span className="text-slate-500">{sub}</span>}
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                trend >= 0
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                  : 'text-rose-700 bg-rose-50 border border-rose-200/60'
              }`}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              <span className="text-slate-400 font-normal ml-0.5">vs last mo</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
