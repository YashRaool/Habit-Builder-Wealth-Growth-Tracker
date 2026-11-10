export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`card ${hover ? 'hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'indigo',
  className = '',
  ...props
}) {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50 border border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    rose: 'text-rose-600 bg-rose-50 border border-rose-100',
    red: 'text-rose-600 bg-rose-50 border border-rose-100',
    amber: 'text-amber-700 bg-amber-50 border border-amber-100',
    orange: 'text-amber-700 bg-amber-50 border border-amber-100',
    blue: 'text-blue-600 bg-blue-50 border border-blue-100',
    violet: 'text-violet-600 bg-violet-50 border border-violet-100',
    slate: 'text-slate-600 bg-slate-100 border border-slate-200/60',
  };

  const activeColor = colors[color] || colors.indigo;

  return (
    <div className={`stat-card ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <span className={`p-2 rounded-xl shrink-0 ${activeColor}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs font-medium mt-1.5 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-slate-400 font-normal ml-0.5">vs last month</span>
        </p>
      )}
    </div>
  );
}
