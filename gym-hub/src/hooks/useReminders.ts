import { useEffect, useRef } from 'react'
import type { AgendaEvent } from '../types/agenda'

interface UseRemindersOptions {
  onToast?: (message: string) => void
}

/**
 * Polling de lembretes a cada 60 segundos.
 * Dispara browser Notification (se permitido) ou callback de toast.
 * Idempotente por sessão: cada evento só notifica uma vez.
 */
export function useReminders(events: AgendaEvent[], options: UseRemindersOptions = {}) {
  const notifiedIds = useRef<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Sem suporte a Notification API no browser → skip silenciosamente
    if (typeof window === 'undefined') return

    function checkReminders() {
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      for (const event of events) {
        if (event.completed) continue
        if (event.event_date !== todayStr) continue
        if (!event.event_time) continue
        if (event.reminder_minutes == null) continue
        if (notifiedIds.current.has(event.id)) continue

        // event_time format: 'HH:MM:SS' or 'HH:MM'
        const [h, m] = event.event_time.split(':').map(Number)
        const eventMinutes = h * 60 + m
        const minutesUntil = eventMinutes - nowMinutes

        // Notifica se está dentro da janela de lembrete (entre 0 e reminder_minutes minutos)
        if (minutesUntil >= 0 && minutesUntil <= event.reminder_minutes) {
          notifiedIds.current.add(event.id)
          const message = minutesUntil <= 0
            ? `${event.title} — agora!`
            : `${event.title} — em ${minutesUntil} minuto${minutesUntil !== 1 ? 's' : ''}`

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('⏰ Lembrete', {
                body: message,
                icon: '/favicon.ico',
                tag: event.id, // impede notificações duplicadas no browser
              })
            } catch {
              options.onToast?.(message)
            }
          } else {
            options.onToast?.(message)
          }
        }
      }
    }

    // Checar imediatamente ao montar (caso já haja evento próximo)
    checkReminders()

    // Polling a cada 60 segundos
    intervalRef.current = setInterval(checkReminders, 60_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [events, options.onToast])
}
