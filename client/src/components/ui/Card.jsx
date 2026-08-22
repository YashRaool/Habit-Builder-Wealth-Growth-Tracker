export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`card ${hover ? 'hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, trend, color = 'emerald', className = '' }) {
  const colors = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    violet: 'text-violet-600 bg-violet-50',
    cyan: 'text-cyan-600 bg-cyan-50',
  };

  return (
    <div className={`stat-card ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {Icon && (
          <span className={`p-2 rounded-xl ${colors[color]}`}>
            <Icon size={20} className={colors[color].split(' ')[0]} />
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold text-slate-900 mt-2">{value}</p>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% <span className="text-slate-400 font-normal ml-1">vs last month</span>
        </p>
      )}
    </div>
  );
}
