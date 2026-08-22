import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', id, ...props }, ref) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-slate-700">{label}</label>}
      <input 
        ref={ref} 
        id={inputId}
        aria-invalid={!!error}
        className={`input-field ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`} 
        {...props} 
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;

export function Select({ label, error, children, className = '', id, ...props }) {
  const generatedId = useId();
  const selectId = id || generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={selectId} className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        id={selectId}
        aria-invalid={!!error}
        className={`input-field appearance-none ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`}
        style={{ backgroundImage: 'none' }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', id, ...props }) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea 
        id={textareaId}
        aria-invalid={!!error}
        className={`input-field resize-none ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`} 
        {...props} 
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
