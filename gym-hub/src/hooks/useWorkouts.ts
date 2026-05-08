import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { Workout, WorkoutDTO } from '../types/gym'

export function useWorkouts(session: Session) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<WorkoutDTO[]>('/api/gym/workouts', session)
      setWorkouts(data.map(({ id, name }) => ({ id, name })))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addWorkout = async (name: string): Promise<Workout> => {
    const optimistic: Workout = { id: crypto.randomUUID(), name }
    setWorkouts(prev => [...prev, optimistic])
    try {
      const saved = await apiFetch<WorkoutDTO>('/api/gym/workouts', session, {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      const workout: Workout = { id: saved.id, name: saved.name }
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
      await apiFetch<void>(`/api/gym/workouts/${id}`, session, { method: 'DELETE' })
    } catch {
      setWorkouts(snapshot)
    }
  }

  return { workouts, loading, addWorkout, deleteWorkout }
}
