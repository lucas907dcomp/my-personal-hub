import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface SessionPoint {
  id: string
  loggedAt: string
  weight: number | null
  reps: string | null
  rpe: number | null
}

function mapSessionPoint(s: {
  id: string
  logged_at: string
  weight: number | null
  reps: string | null
  rpe: number | null
}): SessionPoint {
  return {
    id: s.id,
    loggedAt: s.logged_at,
    weight: s.weight,
    reps: s.reps,
    rpe: s.rpe,
  }
}

export function useExerciseHistory(exerciseId: string, limit = 30) {
  const [sessions, setSessions] = useState<SessionPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exerciseId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('tb_gym_sessions')
      .select('id, logged_at, weight, reps, rpe')
      .eq('exercise_id', exerciseId)
      .order('logged_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setSessions((data ?? []).map(mapSessionPoint))
        setLoading(false)
      })
  }, [exerciseId, limit])

  // Chart data: chronological order (ASC) with numeric weight only
  const chartData = [...sessions]
    .reverse()
    .filter(s => s.weight !== null)
    .map(s => ({
      date: new Date(s.loggedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weight: s.weight as number,
      fullDate: new Date(s.loggedAt).toLocaleDateString('pt-BR'),
      reps: s.reps,
    }))

  return { sessions, chartData, loading }
}
