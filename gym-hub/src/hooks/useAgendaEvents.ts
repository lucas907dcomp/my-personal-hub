import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { AgendaEvent, CreateAgendaEvent } from '../types/agenda'

type DbAgendaEvent = {
  id: string
  user_id: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  reminder_minutes: number | null
  completed: boolean
  color: string | null
  created_at: string
}

function mapEvent(e: DbAgendaEvent): AgendaEvent {
  return {
    id: e.id,
    user_id: e.user_id,
    title: e.title,
    description: e.description,
    event_date: e.event_date,
    event_time: e.event_time,
    reminder_minutes: e.reminder_minutes,
    completed: e.completed,
    color: e.color as AgendaEvent['color'],
    created_at: e.created_at,
  }
}

// Returns today's date as 'YYYY-MM-DD' in local timezone
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useAgendaEvents(session: Session) {
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Load events from today onwards (not past events)
      const { data, error: fetchErr } = await supabase
        .from('tb_agenda_events')
        .select('id, user_id, title, description, event_date, event_time, reminder_minutes, completed, color, created_at')
        .gte('event_date', todayStr())
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true, nullsFirst: false })

      if (fetchErr) throw new Error(fetchErr.message)
      setEvents((data ?? []).map(mapEvent))
      setError(null)
    } catch (err) {
      console.error('[useAgendaEvents] load failed:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar agenda')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addEvent = async (payload: CreateAgendaEvent): Promise<void> => {
    const { data, error: insertErr } = await supabase
      .from('tb_agenda_events')
      .insert({
        user_id: session.user.id,
        title: payload.title,
        event_date: payload.event_date,
        event_time: payload.event_time ?? null,
        reminder_minutes: payload.reminder_minutes ?? null,
        description: payload.description ?? null,
        color: payload.color ?? null,
        completed: false,
      })
      .select('id, user_id, title, description, event_date, event_time, reminder_minutes, completed, color, created_at')
      .single()

    if (insertErr) throw new Error(insertErr.message)

    setEvents(prev =>
      [...prev, mapEvent(data)].sort((a, b) => {
        const dateCmp = a.event_date.localeCompare(b.event_date)
        if (dateCmp !== 0) return dateCmp
        if (!a.event_time) return 1
        if (!b.event_time) return -1
        return a.event_time.localeCompare(b.event_time)
      })
    )
  }

  const updateEvent = async (id: string, payload: Partial<CreateAgendaEvent>): Promise<void> => {
    const snapshot = events
    setEvents(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              ...(payload.title !== undefined && { title: payload.title }),
              ...(payload.event_date !== undefined && { event_date: payload.event_date }),
              ...(payload.event_time !== undefined && { event_time: payload.event_time ?? null }),
              ...(payload.reminder_minutes !== undefined && { reminder_minutes: payload.reminder_minutes ?? null }),
              ...(payload.description !== undefined && { description: payload.description ?? null }),
              ...(payload.color !== undefined && { color: payload.color ?? null }),
            }
          : e
      )
    )
    try {
      const update: Partial<DbAgendaEvent> = {}
      if (payload.title !== undefined) update.title = payload.title
      if (payload.event_date !== undefined) update.event_date = payload.event_date
      if (payload.event_time !== undefined) update.event_time = payload.event_time ?? null
      if (payload.reminder_minutes !== undefined) update.reminder_minutes = payload.reminder_minutes ?? null
      if (payload.description !== undefined) update.description = payload.description ?? null
      if (payload.color !== undefined) update.color = payload.color ?? null

      const { error: updateErr } = await supabase
        .from('tb_agenda_events')
        .update(update)
        .eq('id', id)
      if (updateErr) throw new Error(updateErr.message)
    } catch (err) {
      setEvents(snapshot)
      throw err
    }
  }

  const deleteEvent = async (id: string): Promise<void> => {
    const snapshot = events
    setEvents(prev => prev.filter(e => e.id !== id))
    try {
      const { error: deleteErr } = await supabase.from('tb_agenda_events').delete().eq('id', id)
      if (deleteErr) throw new Error(deleteErr.message)
    } catch (err) {
      setEvents(snapshot)
      throw err
    }
  }

  const toggleEvent = async (id: string): Promise<void> => {
    const event = events.find(e => e.id === id)
    if (!event) return
    const newCompleted = !event.completed
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: newCompleted } : e))
    try {
      const { error: toggleErr } = await supabase
        .from('tb_agenda_events')
        .update({ completed: newCompleted })
        .eq('id', id)
      if (toggleErr) throw new Error(toggleErr.message)
    } catch (err) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !newCompleted } : e))
      throw err
    }
  }

  return { events, loading, error, addEvent, updateEvent, deleteEvent, toggleEvent, reload: load }
}
