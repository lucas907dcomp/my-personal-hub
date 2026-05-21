import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { StreakData } from '../types/productivity'

export function useProductivityStreak(session: Session) {
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, totalDays: 0 })

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_streak')
      if (error) throw error
      setStreak(data as StreakData)
    } catch {
      // streak is non-critical, fail silently
    }
  }, [session])

  useEffect(() => { load() }, [load])

  return { streak, reload: load }
}
