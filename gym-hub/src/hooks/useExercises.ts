import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Exercise } from '../types/gym'

type DbExercise = {
  id: string
  workout_id: string
  name: string
  weight: number
  reps: string
  rpe: number | null
  can_increase_next: boolean
}

function mapEx(e: DbExercise): Exercise {
  return {
    id: e.id,
    workoutId: e.workout_id,
    name: e.name,
    weight: e.weight,
    reps: e.reps,
    rpe: e.rpe,
    canIncreaseNext: e.can_increase_next,
  }
}

export function useExercises(session: Session) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const committed = useRef<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tb_gym_exercises')
        .select('id, workout_id, name, weight, reps, rpe, can_increase_next')
      if (error) throw new Error(error.message)
      const mapped = (data ?? []).map(mapEx)
      setExercises(mapped)
      committed.current = mapped
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const localChange = (id: string, field: string, value: unknown) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const saveExercise = async (id: string) => {
    const ex = exercises.find(e => e.id === id)
    const snap = committed.current.find(e => e.id === id)
    if (!ex || !snap) return
    try {
      const { data, error } = await supabase
        .from('tb_gym_exercises')
        .update({ weight: ex.weight, reps: ex.reps, rpe: ex.rpe, can_increase_next: ex.canIncreaseNext })
        .eq('id', id)
        .select('id, workout_id, name, weight, reps, rpe, can_increase_next')
        .single()
      if (error) throw new Error(error.message)
      const updated = mapEx(data)
      committed.current = committed.current.map(e => e.id === id ? updated : e)
      setExercises(prev => prev.map(e => e.id === id ? updated : e))
    } catch {
      setExercises(prev => prev.map(e => e.id === id ? snap : e))
    }
  }

  const toggleIncreaseLoad = async (id: string) => {
    const ex = exercises.find(e => e.id === id)
    const snap = committed.current.find(e => e.id === id)
    if (!ex || !snap) return
    const newValue = !ex.canIncreaseNext
    setExercises(prev => prev.map(e => e.id === id ? { ...e, canIncreaseNext: newValue } : e))
    try {
      const { data, error } = await supabase
        .from('tb_gym_exercises')
        .update({ weight: ex.weight, reps: ex.reps, rpe: ex.rpe, can_increase_next: newValue })
        .eq('id', id)
        .select('id, workout_id, name, weight, reps, rpe, can_increase_next')
        .single()
      if (error) throw new Error(error.message)
      const updated = mapEx(data)
      committed.current = committed.current.map(e => e.id === id ? updated : e)
      setExercises(prev => prev.map(e => e.id === id ? updated : e))
    } catch {
      setExercises(prev => prev.map(e => e.id === id ? snap : e))
    }
  }

  const addExercise = async (data: Omit<Exercise, 'id'>) => {
    const optimistic: Exercise = { ...data, id: crypto.randomUUID() }
    setExercises(prev => [...prev, optimistic])
    try {
      const { data: saved, error } = await supabase
        .from('tb_gym_exercises')
        .insert({
          workout_id: data.workoutId,
          user_id: session.user.id,
          name: data.name,
          weight: data.weight,
          reps: data.reps,
          rpe: data.rpe,
          can_increase_next: data.canIncreaseNext ?? false,
        })
        .select('id, workout_id, name, weight, reps, rpe, can_increase_next')
        .single()
      if (error) throw new Error(error.message)
      const exercise = mapEx(saved)
      committed.current = [...committed.current, exercise]
      setExercises(prev => prev.map(e => e.id === optimistic.id ? exercise : e))
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
      const { error } = await supabase.from('tb_gym_exercises').delete().eq('id', id)
      if (error) throw new Error(error.message)
    } catch {
      setExercises(snapExercises)
      committed.current = snapCommitted
    }
  }

  return { exercises, loading, localChange, saveExercise, toggleIncreaseLoad, addExercise, deleteExercise }
}
