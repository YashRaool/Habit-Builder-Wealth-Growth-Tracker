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
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200',
  };
  const sizes = { sm: 'text-sm px-3 py-1.5', md: 'px-4 py-2', lg: 'text-base px-6 py-3', icon: 'p-2' };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      aria-disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
