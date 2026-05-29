import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: Check,
  error: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'text-primary-container',
  error: 'text-error',
  info: 'text-secondary',
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { id, type, message }])
      window.setTimeout(() => removeToast(id), 4200)
    },
    [removeToast]
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-24 z-[200] w-[min(24rem,calc(100vw-2rem))] space-y-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="glass-strong rounded-2xl px-4 py-3 flex items-start gap-3"
              >
                <Icon className={`w-5 h-5 mt-0.5 ${colors[toast.type]}`} />
                <p className="text-sm font-medium flex-1">{toast.message}</p>
                <button onClick={() => removeToast(toast.id)} className="p-1 rounded-lg hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
