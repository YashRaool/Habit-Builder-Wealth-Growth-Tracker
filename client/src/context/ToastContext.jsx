import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const THEMES = {
  success: {
    iconClass: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    borderClass: 'border-emerald-200/60',
  },
  error: {
    iconClass: 'text-rose-600 bg-rose-50 border-rose-200/80',
    borderClass: 'border-rose-200/60',
  },
  info: {
    iconClass: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    borderClass: 'border-indigo-200/60',
  },
  warning: {
    iconClass: 'text-amber-600 bg-amber-50 border-amber-200/80',
    borderClass: 'border-amber-200/60',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Crisp Floating Pills Container */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          const theme = THEMES[t.type] || THEMES.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border ${theme.borderClass} shadow-xl shadow-slate-900/10 text-slate-800 transition-all animate-in slide-in-from-top-2 fade-in duration-200`}
            >
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${theme.iconClass}`}>
                <Icon size={16} strokeWidth={2.2} />
              </div>
              <p className="text-xs font-semibold text-slate-800 flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
