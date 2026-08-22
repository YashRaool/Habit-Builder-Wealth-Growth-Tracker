export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500 ${className}`} />
  );
}
