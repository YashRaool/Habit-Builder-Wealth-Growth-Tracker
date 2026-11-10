import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', id, ...props }, ref) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={`input-field ${
          error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
});

export default Input;

export function Select({ label, error, children, className = '', id, ...props }) {
  const generatedId = useId();
  const selectId = id || generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={!!error}
        className={`input-field appearance-none cursor-pointer ${
          error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', id, ...props }) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={!!error}
        className={`input-field resize-none ${
          error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
