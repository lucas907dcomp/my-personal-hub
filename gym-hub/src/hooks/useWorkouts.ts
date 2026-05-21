import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Workout } from '../types/gym'

export function useWorkouts(session: Session) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tb_gym_workouts')
        .select('id, name, position')
        .order('position', { ascending: true })
      if (error) throw new Error(error.message)
      setWorkouts(data ?? [])
    } catch (err) {
      console.error('[useWorkouts] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addWorkout = async (name: string): Promise<Workout> => {
    const position = workouts.length
    const optimistic: Workout = { id: crypto.randomUUID(), name, position }
    setWorkouts(prev => [...prev, optimistic])
    try {
      const { data, error } = await supabase
        .from('tb_gym_workouts')
        .insert({ name, position, user_id: session.user.id })
        .select('id, name, position')
        .single()
      if (error) throw new Error(error.message)
      setWorkouts(prev => prev.map(w => w.id === optimistic.id ? data : w))
      return data
    } catch (err) {
      setWorkouts(prev => prev.filter(w => w.id !== optimistic.id))
      throw err
    }
  }

  const deleteWorkout = async (id: string): Promise<void> => {
    const snapshot = workouts
    setWorkouts(prev => prev.filter(w => w.id !== id))
    try {
      const { error } = await supabase.from('tb_gym_workouts').delete().eq('id', id)
      if (error) throw new Error(error.message)
    } catch (err) {
      setWorkouts(snapshot)
      throw err
    }
  }

  const reorderWorkouts = async (orderedIds: string[]): Promise<void> => {
    const snapshot = workouts
    setWorkouts(orderedIds.map((id, i) => {
      const w = workouts.find(w => w.id === id)!
      return { ...w, position: i }
    }))
    try {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from('tb_gym_workouts').update({ position: i }).eq('id', id)
        )
      )
    } catch (err) {
      setWorkouts(snapshot)
      throw err
    }
  }

  return { workouts, loading, addWorkout, deleteWorkout, reorderWorkouts }
}
