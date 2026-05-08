import { useEffect } from 'react'

interface ToastProps {
  message: string | null
  onDismiss: () => void
  variant?: 'error' | 'success'
}

export function Toast({ message, onDismiss, variant = 'error' }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  const colors =
    variant === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 border rounded-2xl p-4 flex items-start justify-between gap-3 shadow-lg animate-in slide-in-from-bottom-4 ${colors}`}
    >
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Fechar notificação"
        className="flex-shrink-0 font-bold text-base leading-none opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}
