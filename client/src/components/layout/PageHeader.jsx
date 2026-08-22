export default function PageHeader({ title, description, children, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
