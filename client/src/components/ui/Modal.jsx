import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      {/* Panel */}
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        className={`relative w-full ${sizes[size]} bg-white border border-slate-200 rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
