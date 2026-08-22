export default function Badge({ children, color = 'slate', size = 'md' }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    red: 'bg-red-50 text-red-700 border-red-200/60',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    violet: 'bg-violet-50 text-violet-700 border-violet-200/60',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
  };
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-xs px-2.5 py-1' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${colors[color]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
