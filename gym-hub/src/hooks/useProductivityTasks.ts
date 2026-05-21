import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { RoutineTask, CreateRoutineTask } from '../types/productivity'

type DbTask = {
  id: string
  title: string
  time: string
  done: boolean
  type: string
  is_recurring: boolean
}

function mapTask(t: DbTask): RoutineTask {
  return {
    id: t.id,
    title: t.title,
    time: t.time,
    done: t.done,
    type: t.type as RoutineTask['type'],
    isRecurring: t.is_recurring,
  }
}

export function useProductivityTasks(session: Session) {
  const [tasks, setTasks] = useState<RoutineTask[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tb_routine_tasks')
        .select('id, title, time, done, type, is_recurring')
        .order('time', { ascending: true })
      if (error) throw new Error(error.message)
      setTasks((data ?? []).map(mapTask))
    } catch (err) {
      console.error('[useProductivityTasks] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addTask = async (payload: CreateRoutineTask): Promise<void> => {
    const { data, error } = await supabase
      .from('tb_routine_tasks')
      .insert({
        user_id: session.user.id,
        title: payload.title,
        time: payload.time,
        type: payload.type,
        done: false,
        is_recurring: payload.isRecurring ?? true,
      })
      .select('id, title, time, done, type, is_recurring')
      .single()
    if (error) throw new Error(error.message)
    setTasks(prev => [...prev, mapTask(data)].sort((a, b) => a.time.localeCompare(b.time)))
  }

  const deleteTask = async (id: string): Promise<void> => {
    const snapshot = tasks
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      const { error } = await supabase.from('tb_routine_tasks').delete().eq('id', id)
      if (error) throw new Error(error.message)
    } catch (err) {
      setTasks(snapshot)
      throw err
    }
  }

  const toggleTask = async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newDone = !task.done
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t))
    try {
      const { error } = await supabase
        .from('tb_routine_tasks')
        .update({ done: newDone })
        .eq('id', id)
      if (error) throw new Error(error.message)
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !newDone } : t))
      throw err
    }
  }

  const resetTasks = async (): Promise<void> => {
    try {
      const { error } = await supabase.rpc('reset_daily_routine')
      if (error) throw new Error(error.message)
      await load()
    } catch (err) {
      await load()
      throw err
    }
  }

  return { tasks, loading, addTask, deleteTask, toggleTask, resetTasks }
}
