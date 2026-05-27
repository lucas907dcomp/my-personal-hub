import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface PREntry {
  exerciseId: string
  exerciseName: string
  maxWeight: number
  lastLoggedAt: string
}

export interface GymStats {
  currentStreak: number
  totalSessionsThisMonth: number
  weeklyVolume: number   // sum of weight × reps (integers only), in kg
  totalSessions: number
  topPRs: PREntry[]
}

// ---- helpers ---------------------------------------------------------------

function toDateStr(iso: string) {
  return iso.slice(0, 10)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function prevDay(dateStr: string) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function startOfWeekStr() {
  const d = new Date()
  const day = d.getDay() // 0 = Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function startOfMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function calcStreak(loggedAts: string[]): number {
  if (loggedAts.length === 0) return 0
  const uniqueDates = [...new Set(loggedAts.map(toDateStr))].sort().reverse()
  const today = todayStr()
  const yesterday = prevDay(today)
  // streak starts from today OR yesterday
  let expected = uniqueDates[0] === today ? today : uniqueDates[0] === yesterday ? yesterday : null
  if (!expected) return 0
  let streak = 0
  for (const date of uniqueDates) {
    if (date === expected) {
      streak++
      expected = prevDay(expected)
    } else if (date < expected) {
      break
    }
  }
  return streak
}

function calcWeeklyVolume(
  sessions: { logged_at: string; weight: number | null; reps: string | null }[]
): number {
  const weekStart = startOfWeekStr()
  return sessions
    .filter(s => toDateStr(s.logged_at) >= weekStart)
    .reduce((sum, s) => {
      if (s.weight == null || !s.reps) return sum
      const repsInt = parseInt(s.reps, 10)
      if (isNaN(repsInt)) return sum
      return sum + s.weight * repsInt
    }, 0)
}

// ---- hook ------------------------------------------------------------------

export function useGymStats(session: Session) {
  const [stats, setStats] = useState<GymStats>({
    currentStreak: 0,
    totalSessionsThisMonth: 0,
    weeklyVolume: 0,
    totalSessions: 0,
    topPRs: [],
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all sessions (we need them for streak + volume)
      const { data: sessionsData } = await supabase
        .from('tb_gym_sessions')
        .select('id, exercise_id, logged_at, weight, reps')
        .order('logged_at', { ascending: false })

      const sessions = sessionsData ?? []

      // Fetch exercises for names
      const { data: exercisesData } = await supabase
        .from('tb_gym_exercises')
        .select('id, name')

      const exerciseMap = Object.fromEntries(
        (exercisesData ?? []).map(e => [e.id, e.name as string])
      )

      // Streak
      const currentStreak = calcStreak(sessions.map(s => s.logged_at))

      // Total sessions this month
      const monthStart = startOfMonthStr()
      const totalSessionsThisMonth = sessions.filter(
        s => toDateStr(s.logged_at) >= monthStart
      ).length

      // Weekly volume
      const weeklyVolume = calcWeeklyVolume(sessions)

      // Total sessions all-time
      const totalSessions = sessions.length

      // Top PRs: max weight per exercise (only sessions with weight)
      const prMap = new Map<string, { maxWeight: number; lastLoggedAt: string }>()
      for (const s of sessions) {
        if (s.weight == null) continue
        const existing = prMap.get(s.exercise_id)
        if (!existing || s.weight > existing.maxWeight) {
          prMap.set(s.exercise_id, { maxWeight: s.weight, lastLoggedAt: s.logged_at })
        }
      }

      const topPRs: PREntry[] = [...prMap.entries()]
        .map(([exerciseId, { maxWeight, lastLoggedAt }]) => ({
          exerciseId,
          exerciseName: exerciseMap[exerciseId] ?? 'Exercício',
          maxWeight,
          lastLoggedAt,
        }))
        .sort((a, b) => b.maxWeight - a.maxWeight)
        .slice(0, 3)

      setStats({ currentStreak, totalSessionsThisMonth, weeklyVolume, totalSessions, topPRs })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  return { stats, loading, refresh: load }
}
