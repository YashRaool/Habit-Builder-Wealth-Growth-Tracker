import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Alert({
  variant = 'error',
  title,
  message,
  children,
  onClose,
  className = '',
}) {
  const variants = {
    error: {
      container: 'bg-rose-50/90 border-rose-200/80 text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      closeBtn: 'text-rose-500 hover:text-rose-800 hover:bg-rose-100/60 focus-visible:ring-rose-400',
    },
    success: {
      container: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      closeBtn: 'text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100/60 focus-visible:ring-emerald-400',
    },
    warning: {
      container: 'bg-amber-50/90 border-amber-200/80 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      closeBtn: 'text-amber-500 hover:text-amber-800 hover:bg-amber-100/60 focus-visible:ring-amber-400',
    },
    info: {
      container: 'bg-blue-50/90 border-blue-200/80 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
      closeBtn: 'text-blue-500 hover:text-blue-800 hover:bg-blue-100/60 focus-visible:ring-blue-400',
    },
  };

  const current = variants[variant] || variants.error;
  const IconComponent = current.icon;
  const content = message || children;

  if (!content) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all duration-150 animate-fade-in ${current.container} ${className}`}
    >
      <IconComponent size={18} className={`shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 leading-relaxed">
        {title && <p className="font-semibold text-xs tracking-tight mb-0.5">{title}</p>}
        <div className="text-xs sm:text-sm">{content}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 p-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 ${current.closeBtn}`}
          aria-label="Dismiss alert"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
