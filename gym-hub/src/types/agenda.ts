export type EventColor = 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate'

export interface AgendaEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  event_date: string   // 'YYYY-MM-DD'
  event_time: string | null  // 'HH:MM:SS' or null (all-day)
  reminder_minutes: number | null
  completed: boolean
  color: EventColor | null
  created_at: string
}

export interface CreateAgendaEvent {
  title: string
  event_date: string
  event_time?: string | null
  reminder_minutes?: number | null
  description?: string | null
  color?: EventColor | null
}

export type AgendaSection = 'today' | 'tomorrow' | 'this_week' | 'upcoming'

export interface GroupedAgendaEvents {
  today: AgendaEvent[]
  tomorrow: AgendaEvent[]
  thisWeek: AgendaEvent[]
  upcoming: AgendaEvent[]
}
