'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastContextType = {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[], onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm border
            animate-in slide-in-from-bottom-4 fade-in duration-300
            ${toast.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }
          `}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{toast.message}</p>
            <button 
              onClick={() => onDismiss(toast.id)}
              className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
