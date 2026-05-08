import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { StreakData } from '../types/productivity'

export function useProductivityStreak(session: Session) {
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, totalDays: 0 })

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<StreakData>('/api/v1/productivity/streak', session)
      setStreak(data)
    } catch {
      // streak is non-critical, fail silently
    }
  }, [session])

  useEffect(() => { load() }, [load])

  return { streak, reload: load }
}
