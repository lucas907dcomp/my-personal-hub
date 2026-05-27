import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { GymSession } from '../types/gym'

interface SessionToast {
  msg: string
  variant: 'success' | 'error'
}

type DbSession = {
  id: string
  exercise_id: string
  logged_at: string
  weight: number | null
  reps: string | null
  rpe: number | null
}

function mapSession(s: DbSession): GymSession {
  return {
    id: s.id,
    exerciseId: s.exercise_id,
    loggedAt: s.logged_at,
    weight: s.weight,
    reps: s.reps,
    rpe: s.rpe,
  }
}

export function useExerciseSessions(session: Session, exerciseId: string) {
  const [lastSession, setLastSession] = useState<GymSession | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<SessionToast | null>(null)
  const [isNewPR, setIsNewPR] = useState(false)

  useEffect(() => {
    supabase
      .from('tb_gym_sessions')
      .select('id, exercise_id, logged_at, weight, reps, rpe')
      .eq('exercise_id', exerciseId)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLastSession(mapSession(data))
      })
  }, [exerciseId, session])

  const logSession = async (weight: number | null, reps: string | null, rpe: number | null) => {
    setIsSaving(true)
    setIsNewPR(false)
    try {
      // Check current max weight BEFORE inserting (PR detection)
      let maxHistorical: number | null = null
      if (weight !== null) {
        const { data: maxData } = await supabase
          .from('tb_gym_sessions')
          .select('weight')
          .eq('exercise_id', exerciseId)
          .not('weight', 'is', null)
          .order('weight', { ascending: false })
          .limit(1)
          .maybeSingle()
        maxHistorical = maxData?.weight ?? null
      }

      const { data, error } = await supabase
        .from('tb_gym_sessions')
        .insert({
          user_id: session.user.id,
          exercise_id: exerciseId,
          logged_at: new Date().toISOString(),
          weight,
          reps,
          rpe,
        })
        .select('id, exercise_id, logged_at, weight, reps, rpe')
        .single()
      if (error) throw new Error(error.message)

      setLastSession(mapSession(data))

      // PR detection: new weight strictly greater than previous max AND there was a previous session
      const newPR = weight !== null && maxHistorical !== null && weight > maxHistorical
      setIsNewPR(newPR)

      const prLabel = newPR ? ' 🏆 Novo PR!' : ''
      setToast({ msg: `Sessão registrada! 💪${prLabel}`, variant: 'success' })
    } catch {
      setToast({ msg: 'Erro ao salvar sessão.', variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const dismissToast = () => setToast(null)

  return { lastSession, logSession, isSaving, toast, dismissToast, isNewPR }
}
