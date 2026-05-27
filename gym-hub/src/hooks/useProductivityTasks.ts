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
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Auto-reset diário (ADR-025): idempotente, não bloqueia em caso de falha
      try {
        const { error: resetErr } = await supabase.rpc('check_and_auto_reset')
        if (resetErr) console.warn('[useProductivityTasks] auto-reset (non-fatal):', resetErr.message)
      } catch (resetEx) {
        console.warn('[useProductivityTasks] auto-reset exception (non-fatal):', resetEx)
      }

      const { data, error: fetchErr } = await supabase
        .from('tb_routine_tasks')
        .select('id, title, time, done, type, is_recurring')
        .order('time', { ascending: true })

      if (fetchErr) throw new Error(fetchErr.message)
      setTasks((data ?? []).map(mapTask))
      setError(null)
    } catch (err) {
      console.error('[useProductivityTasks] load failed:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addTask = async (payload: CreateRoutineTask): Promise<void> => {
    const { data, error: insertErr } = await supabase
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
    if (insertErr) throw new Error(insertErr.message)
    setTasks(prev => [...prev, mapTask(data)].sort((a, b) => a.time.localeCompare(b.time)))
  }

  const updateTask = async (id: string, payload: Partial<CreateRoutineTask>): Promise<void> => {
    const snapshot = tasks
    // Optimistic update
    setTasks(prev =>
      prev
        .map(t =>
          t.id === id
            ? {
                ...t,
                ...(payload.title !== undefined && { title: payload.title }),
                ...(payload.time !== undefined && { time: payload.time }),
                ...(payload.type !== undefined && { type: payload.type }),
                ...(payload.isRecurring !== undefined && { isRecurring: payload.isRecurring }),
              }
            : t
        )
        .sort((a, b) => a.time.localeCompare(b.time))
    )
    try {
      const update: Partial<{ title: string; time: string; type: string; is_recurring: boolean }> = {}
      if (payload.title !== undefined) update.title = payload.title
      if (payload.time !== undefined) update.time = payload.time
      if (payload.type !== undefined) update.type = payload.type
      if (payload.isRecurring !== undefined) update.is_recurring = payload.isRecurring

      const { error: updateErr } = await supabase
        .from('tb_routine_tasks')
        .update(update)
        .eq('id', id)
      if (updateErr) throw new Error(updateErr.message)
    } catch (err) {
      setTasks(snapshot)
      throw err
    }
  }

  const deleteTask = async (id: string): Promise<void> => {
    const snapshot = tasks
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      const { error: deleteErr } = await supabase.from('tb_routine_tasks').delete().eq('id', id)
      if (deleteErr) throw new Error(deleteErr.message)
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
      const { error: toggleErr } = await supabase
        .from('tb_routine_tasks')
        .update({ done: newDone })
        .eq('id', id)
      if (toggleErr) throw new Error(toggleErr.message)
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !newDone } : t))
      throw err
    }
  }

  const resetTasks = async (): Promise<void> => {
    try {
      const { error: resetErr } = await supabase.rpc('reset_daily_routine')
      if (resetErr) throw new Error(resetErr.message)
      await load()
    } catch (err) {
      await load()
      throw err
    }
  }

  return { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask, resetTasks }
}
