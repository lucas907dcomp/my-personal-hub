import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { GymSession } from '../types/gym'

interface SessionToast {
  msg: string
  variant: 'success' | 'error'
}

export function useExerciseSessions(session: Session, exerciseId: string) {
  const [lastSession, setLastSession] = useState<GymSession | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<SessionToast | null>(null)

  useEffect(() => {
    apiFetch<GymSession>(`/api/v1/gym/exercises/${exerciseId}/sessions/last`, session)
      .then(s => setLastSession(s))
      .catch(() => {}) // 404 means no session yet
  }, [exerciseId, session])

  const logSession = async (weight: number | null, reps: string | null, rpe: number | null) => {
    setIsSaving(true)
    try {
      const saved = await apiFetch<GymSession>(
        `/api/v1/gym/exercises/${exerciseId}/sessions`,
        session,
        { method: 'POST', body: JSON.stringify({ weight, reps, rpe }) },
      )
      setLastSession(saved)
      setToast({ msg: 'Sessão registrada! 💪', variant: 'success' })
    } catch {
      setToast({ msg: 'Erro ao salvar sessão.', variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const dismissToast = () => setToast(null)

  return { lastSession, logSession, isSaving, toast, dismissToast }
}
