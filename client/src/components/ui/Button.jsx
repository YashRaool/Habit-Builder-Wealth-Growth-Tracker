import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    destructive: 'btn-danger',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
    outline: 'bg-transparent border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 px-4 py-2 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2.5 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-xl',
    icon: 'p-2 rounded-xl',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium cursor-pointer ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={loading || props.disabled}
      aria-disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="shrink-0">
          <Spinner size="sm" className="border-current border-t-transparent" />
        </span>
      )}
      {children}
    </button>
  );
}
