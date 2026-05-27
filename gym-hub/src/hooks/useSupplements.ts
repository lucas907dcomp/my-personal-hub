import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { SupplementItem } from '../types/gym'

const TODAY = () => new Date().toISOString().slice(0, 10)

export function useSupplements(session: Session) {
  const [items, setItems] = useState<SupplementItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Load legacy whey/creatina
      const { data: legacyData } = await supabase
        .from('tb_gym_supplements')
        .select('whey, creatina')
        .eq('user_id', session.user.id)
        .maybeSingle()
      const legacy = legacyData ?? { whey: false, creatina: false }

      // 2. Load custom supplement configs
      const { data: configData } = await supabase
        .from('tb_supplement_config')
        .select('id, name, icon, position, last_taken_date')
        .eq('user_id', session.user.id)
        .order('position', { ascending: true })

      const today = TODAY()

      const legacyItems: SupplementItem[] = [
        { id: 'whey', name: 'Whey Protein', icon: '🥛', takenToday: legacy.whey, isLegacy: true, legacyKey: 'whey' },
        { id: 'creatina', name: 'Creatina', icon: '⚡', takenToday: legacy.creatina, isLegacy: true, legacyKey: 'creatina' },
      ]

      const customItems: SupplementItem[] = (configData ?? []).map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon ?? '💊',
        takenToday: c.last_taken_date === today,
        isLegacy: false,
      }))

      setItems([...legacyItems, ...customItems])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const toggle = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, takenToday: !i.takenToday } : i))

    try {
      if (item.isLegacy && item.legacyKey) {
        // Toggle legacy column in tb_gym_supplements
        const newValue = !item.takenToday
        const current: Record<string, boolean> = {}
        items.filter(i => i.isLegacy && i.legacyKey).forEach(i => {
          current[i.legacyKey!] = i.id === id ? newValue : i.takenToday
        })
        const { error } = await supabase
          .from('tb_gym_supplements')
          .upsert({ user_id: session.user.id, ...current }, { onConflict: 'user_id' })
        if (error) throw new Error(error.message)
      } else {
        // Toggle custom supplement: set/clear last_taken_date
        const newDate = item.takenToday ? null : TODAY()
        const { error } = await supabase
          .from('tb_supplement_config')
          .update({ last_taken_date: newDate })
          .eq('id', id)
          .eq('user_id', session.user.id)
        if (error) throw new Error(error.message)
      }
    } catch {
      // Rollback
      setItems(prev => prev.map(i => i.id === id ? { ...i, takenToday: item.takenToday } : i))
    }
  }

  const addSupplement = async (name: string, icon: string = '💊') => {
    const maxPos = items.filter(i => !i.isLegacy).length
    const { data, error } = await supabase
      .from('tb_supplement_config')
      .insert({ user_id: session.user.id, name, icon, position: maxPos })
      .select('id, name, icon, position, last_taken_date')
      .single()
    if (error) throw new Error(error.message)
    const newItem: SupplementItem = {
      id: data.id,
      name: data.name,
      icon: data.icon ?? '💊',
      takenToday: false,
      isLegacy: false,
    }
    setItems(prev => [...prev, newItem])
  }

  const removeSupplement = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase
      .from('tb_supplement_config')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
    if (error) {
      await load()
      throw new Error(error.message)
    }
  }

  return { items, loading, toggle, addSupplement, removeSupplement }
}
