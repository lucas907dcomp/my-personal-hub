import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Supplements } from '../types/gym'

export function useSupplements(session: Session) {
  const [supplements, setSupplements] = useState<Supplements>({ whey: false, creatina: false })
  const committed = useRef<Supplements>({ whey: false, creatina: false })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('tb_gym_supplements')
        .select('whey, creatina')
        .eq('user_id', session.user.id)
        .maybeSingle()
      const s: Supplements = data ?? { whey: false, creatina: false }
      setSupplements(s)
      committed.current = s
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const toggleSupplement = async (key: keyof Supplements) => {
    const snap = { ...committed.current }
    const updated = { ...supplements, [key]: !supplements[key] }
    setSupplements(updated)
    try {
      const { error } = await supabase
        .from('tb_gym_supplements')
        .upsert({ user_id: session.user.id, ...updated }, { onConflict: 'user_id' })
      if (error) throw new Error(error.message)
      committed.current = updated
    } catch {
      setSupplements(snap)
    }
  }

  return { supplements, loading, toggleSupplement }
}
