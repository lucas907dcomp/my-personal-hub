import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { Workout, WorkoutDTO } from '../types/gym'

export function useWorkouts(session: Session) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<WorkoutDTO[]>('/api/v1/gym/workouts', session)
      setWorkouts(data.map(({ id, name, position }) => ({ id, name, position })))
    } catch (err) {
      console.error('[useWorkouts] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addWorkout = async (name: string): Promise<Workout> => {
    const optimistic: Workout = { id: crypto.randomUUID(), name, position: workouts.length }
    setWorkouts(prev => [...prev, optimistic])
    try {
      const saved = await apiFetch<WorkoutDTO>('/api/v1/gym/workouts', session, {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      const workout: Workout = { id: saved.id, name: saved.name, position: saved.position }
      setWorkouts(prev => prev.map(w => w.id === optimistic.id ? workout : w))
      return workout
    } catch (err) {
      setWorkouts(prev => prev.filter(w => w.id !== optimistic.id))
      throw err
    }
  }

  const deleteWorkout = async (id: string): Promise<void> => {
    const snapshot = workouts
    setWorkouts(prev => prev.filter(w => w.id !== id))
    try {
      await apiFetch<void>(`/api/v1/gym/workouts/${id}`, session, { method: 'DELETE' })
    } catch (err) {
      setWorkouts(snapshot)
      throw err
    }
  }

  const reorderWorkouts = async (orderedIds: string[]): Promise<void> => {
    const snapshot = workouts
    const reordered = orderedIds.map((id, i) => {
      const w = workouts.find(w => w.id === id)!
      return { ...w, position: i }
    })
    setWorkouts(reordered)
    try {
      await apiFetch<void>('/api/v1/gym/workouts/order', session, {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds }),
      })
    } catch (err) {
      setWorkouts(snapshot)
      throw err
    }
  }

  return { workouts, loading, addWorkout, deleteWorkout, reorderWorkouts }
}
