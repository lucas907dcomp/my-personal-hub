import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'
import type { RoutineTask, CreateRoutineTask } from '../types/productivity'

export function useProductivityTasks(session: Session) {
  const [tasks, setTasks] = useState<RoutineTask[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<RoutineTask[]>('/api/v1/productivity/tasks', session)
      setTasks(data)
    } catch (err) {
      console.error('[useProductivityTasks] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addTask = async (payload: CreateRoutineTask): Promise<void> => {
    const saved = await apiFetch<RoutineTask>('/api/v1/productivity/tasks', session, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setTasks(prev => [...prev, saved].sort((a, b) => a.time.localeCompare(b.time)))
  }

  const deleteTask = async (id: string): Promise<void> => {
    const snapshot = tasks
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await apiFetch<void>(`/api/v1/productivity/tasks/${id}`, session, { method: 'DELETE' })
    } catch (err) {
      setTasks(snapshot)
      throw err
    }
  }

  const toggleTask = async (id: string): Promise<void> => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    try {
      const updated = await apiFetch<RoutineTask>(
        `/api/v1/productivity/tasks/${id}/toggle`,
        session,
        { method: 'PUT' },
      )
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
      throw err
    }
  }

  const resetTasks = async (): Promise<void> => {
    setTasks(prev => prev.map(t => ({ ...t, done: false })))
    try {
      await apiFetch<void>('/api/v1/productivity/tasks/reset', session, { method: 'POST' })
    } catch (err) {
      await load()
      throw err
    }
  }

  return { tasks, loading, addTask, deleteTask, toggleTask, resetTasks }
}
