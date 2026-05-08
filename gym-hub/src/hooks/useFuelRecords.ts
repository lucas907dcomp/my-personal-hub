import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { CreateFuelRecord, FuelRecord } from '../types/fuel'

export function useFuelRecords(session: Session) {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<FuelRecord[]>('/api/v1/fuel', session)
      setRecords(data)
    } catch (err) {
      console.error('[useFuelRecords] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addRecord = async (payload: CreateFuelRecord): Promise<void> => {
    const saved = await apiFetch<FuelRecord>('/api/v1/fuel', session, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setRecords(prev => [saved, ...prev])
  }

  const deleteRecord = async (id: string): Promise<void> => {
    const snapshot = records
    setRecords(prev => prev.filter(r => r.id !== id))
    try {
      await apiFetch<void>(`/api/v1/fuel/${id}`, session, { method: 'DELETE' })
    } catch (err) {
      setRecords(snapshot)
      throw err
    }
  }

  return { records, loading, addRecord, deleteRecord }
}
