import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

function createToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = createToastId();
    setToasts((items) => [...items, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-card"
          >
            {toast.type === 'success' ? (
              <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
            )}
            <p className="text-sm font-medium text-slate-800">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
