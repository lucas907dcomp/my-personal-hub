import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { Supplements } from '../types/gym'

export function useSupplements(session: Session) {
  const [supplements, setSupplements] = useState<Supplements>({ whey: false, creatina: false })
  const committed = useRef<Supplements>({ whey: false, creatina: false })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Supplements>('/api/v1/gym/supplements', session)
      setSupplements(data)
      committed.current = data
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const toggleSupplement = async (key: keyof Supplements) => {
    const snap = { ...committed.current }
    const updated = { ...supplements, [key]: !supplements[key] }
    // 1. Optimistic update
    setSupplements(updated)
    try {
      // 2. Persist
      const saved = await apiFetch<Supplements>('/api/v1/gym/supplements', session, {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
      committed.current = saved
      setSupplements(saved)
    } catch {
      // 3. Rollback
      setSupplements(snap)
    }
  }

  return { supplements, loading, toggleSupplement }
}
