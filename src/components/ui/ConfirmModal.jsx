import React, { useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation Required',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary', // 'danger' | 'warning' | 'primary'
  loading = false
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !loading) onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertCircle,
      iconBg: 'bg-red-100 text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 text-amber-700',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500'
    },
    primary: {
      icon: HelpCircle,
      iconBg: 'bg-emerald-100 text-emerald-800',
      confirmBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-emerald-500'
    }
  };

  const config = typeConfig[type] || typeConfig.primary;
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {title}
                </h3>
                <div className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {message}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${config.confirmBtn}`}
              >
                {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
