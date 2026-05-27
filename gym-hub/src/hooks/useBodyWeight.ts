import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { BodyWeightEntry } from '../types/gym'

type DbEntry = {
  id: string
  date: string
  weight_kg: number
  created_at: string
}

function mapEntry(e: DbEntry): BodyWeightEntry {
  return {
    id: e.id,
    date: e.date,
    weight_kg: Number(e.weight_kg),
    created_at: e.created_at,
  }
}

export function useBodyWeight(session: Session) {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('tb_body_weight')
        .select('id, date, weight_kg, created_at')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
        .limit(90)
      setEntries((data ?? []).map(mapEntry))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  /** Upsert: one entry per day. Returns updated entry. */
  const addEntry = async (weight_kg: number, date?: string): Promise<BodyWeightEntry> => {
    const targetDate = date ?? new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('tb_body_weight')
      .upsert(
        { user_id: session.user.id, date: targetDate, weight_kg },
        { onConflict: 'user_id,date' },
      )
      .select('id, date, weight_kg, created_at')
      .single()
    if (error) throw new Error(error.message)
    const entry = mapEntry(data)
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== targetDate)
      return [entry, ...filtered].sort((a, b) => (a.date < b.date ? 1 : -1))
    })
    return entry
  }

  const removeEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('tb_body_weight').delete().eq('id', id)
    if (error) {
      // rollback
      await load()
      throw new Error(error.message)
    }
  }

  return { entries, loading, addEntry, removeEntry }
}
