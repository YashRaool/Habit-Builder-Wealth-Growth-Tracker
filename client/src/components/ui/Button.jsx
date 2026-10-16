import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled = false,
  ...props
}) {
  const variants = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-600/30 shadow-xs focus-visible:ring-emerald-500/40',
    secondary:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-xs focus-visible:ring-slate-300',
    outline:
      'bg-transparent hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 focus-visible:ring-slate-300',
    danger:
      'bg-red-50 hover:bg-red-100/80 active:bg-red-100 text-red-600 border border-red-200/80 shadow-xs focus-visible:ring-red-500/30',
    destructive:
      'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border border-red-600/30 shadow-xs focus-visible:ring-red-500/30',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent focus-visible:ring-slate-300',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
    icon: 'p-2 rounded-xl',
  };

  const isDisabled = loading || disabled;

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
