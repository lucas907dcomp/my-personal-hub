import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { Exercise, WorkoutDTO } from '../types/gym'

export function useExercises(session: Session) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  // Tracks the last successfully saved state for each exercise (enables rollback)
  const committed = useRef<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      // Exercises arrive embedded in workouts — single endpoint, no double-fetch
      const workouts = await apiFetch<WorkoutDTO[]>('/api/v1/gym/workouts', session)
      const flat = workouts.flatMap(w => w.exercises)
      setExercises(flat)
      committed.current = flat
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  // Called onChange — updates UI only, no backend call
  const localChange = (id: string, field: string, value: unknown) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  // Called onBlur — persists to backend, rolls back on error
  const saveExercise = async (id: string) => {
    const ex = exercises.find(e => e.id === id)
    const snap = committed.current.find(e => e.id === id)
    if (!ex || !snap) return
    try {
      const updated = await apiFetch<Exercise>(`/api/v1/gym/exercises/${id}`, session, {
        method: 'PUT',
        body: JSON.stringify({ weight: ex.weight, reps: ex.reps, rpe: ex.rpe, canIncreaseNext: ex.canIncreaseNext }),
      })
      committed.current = committed.current.map(e => e.id === id ? updated : e)
      setExercises(prev => prev.map(e => e.id === id ? updated : e))
    } catch {
      // Rollback to last committed value
      setExercises(prev => prev.map(e => e.id === id ? snap : e))
    }
  }

  // Optimistic toggle + immediate persist + rollback on error
  const toggleIncreaseLoad = async (id: string) => {
    const ex = exercises.find(e => e.id === id)
    const snap = committed.current.find(e => e.id === id)
    if (!ex || !snap) return
    const newValue = !ex.canIncreaseNext
    // 1. Optimistic update
    setExercises(prev => prev.map(e => e.id === id ? { ...e, canIncreaseNext: newValue } : e))
    try {
      // 2. Persist
      const updated = await apiFetch<Exercise>(`/api/v1/gym/exercises/${id}`, session, {
        method: 'PUT',
        body: JSON.stringify({ weight: ex.weight, reps: ex.reps, rpe: ex.rpe, canIncreaseNext: newValue }),
      })
      committed.current = committed.current.map(e => e.id === id ? updated : e)
      setExercises(prev => prev.map(e => e.id === id ? updated : e))
    } catch {
      // 3. Rollback
      setExercises(prev => prev.map(e => e.id === id ? snap : e))
    }
  }

  const addExercise = async (data: Omit<Exercise, 'id'>) => {
    const optimistic: Exercise = { ...data, id: crypto.randomUUID() }
    setExercises(prev => [...prev, optimistic])
    try {
      const saved = await apiFetch<Exercise>('/api/v1/gym/exercises', session, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      committed.current = [...committed.current, saved]
      setExercises(prev => prev.map(e => e.id === optimistic.id ? saved : e))
    } catch (err) {
      setExercises(prev => prev.filter(e => e.id !== optimistic.id))
      throw err
    }
  }

  const deleteExercise = async (id: string) => {
    const snapExercises = exercises
    const snapCommitted = committed.current
    setExercises(prev => prev.filter(e => e.id !== id))
    committed.current = committed.current.filter(e => e.id !== id)
    try {
      await apiFetch<void>(`/api/v1/gym/exercises/${id}`, session, { method: 'DELETE' })
    } catch {
      setExercises(snapExercises)
      committed.current = snapCommitted
    }
  }

  return { exercises, loading, localChange, saveExercise, toggleIncreaseLoad, addExercise, deleteExercise }
}
