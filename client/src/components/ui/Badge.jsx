export default function Badge({
  children,
  color = 'slate',
  size = 'md',
  variant = 'pill',
  className = '',
  ...props
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    red: 'bg-rose-50 text-rose-700 border-rose-200/70',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/70',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/70',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/70',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200/70',
    violet: 'bg-violet-50 text-violet-700 border-violet-200/70',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/70',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/70',
    slate: 'bg-slate-100/80 text-slate-700 border-slate-200/90',
  };

  const sizes = {
    sm: 'text-2xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  const radii = {
    pill: 'rounded-full',
    rounded: 'rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border leading-none tracking-tight select-none
        ${colors[color] || colors.slate} ${sizes[size] || sizes.md} ${radii[variant] || radii.pill} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
