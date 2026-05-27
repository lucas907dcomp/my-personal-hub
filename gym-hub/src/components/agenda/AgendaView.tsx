import { useState } from 'react'
import { Icon } from '../gym/Icon'
import { AgendaEventCard } from './AgendaEventCard'
import { AddEventModal } from './AddEventModal'
import type { AgendaEvent, CreateAgendaEvent } from '../../types/agenda'

interface AgendaViewProps {
  events: AgendaEvent[]
  loading: boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAdd: (data: CreateAgendaEvent) => Promise<void>
  onUpdate: (id: string, data: Partial<CreateAgendaEvent>) => Promise<void>
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatSectionDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
}

function SkeletonCard() {
  return <div className="animate-pulse bg-slate-100 rounded-3xl h-16" />
}

interface SectionProps {
  title: string
  subtitle?: string
  events: AgendaEvent[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (e: AgendaEvent) => void
}

function AgendaSection({ title, subtitle, events, onToggle, onDelete, onEdit }: SectionProps) {
  if (events.length === 0) return null
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</h3>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
      <div className="space-y-3">
        {events.map(event => (
          <AgendaEventCard
            key={event.id}
            event={event}
            onToggle={() => onToggle(event.id)}
            onEdit={() => onEdit(event)}
            onDelete={() => onDelete(event.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function AgendaView({ events, loading, onToggle, onDelete, onAdd, onUpdate }: AgendaViewProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null)
  const [notificationBanner, setNotificationBanner] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default'
  )

  const today = todayStr()
  const tomorrow = addDays(today, 1)
  const inSevenDays = addDays(today, 7)

  const todayEvents = events.filter(e => e.event_date === today)
  const tomorrowEvents = events.filter(e => e.event_date === tomorrow)
  const thisWeekEvents = events.filter(e => e.event_date > tomorrow && e.event_date <= inSevenDays)
  const upcomingEvents = events.filter(e => e.event_date > inSevenDays)

  const hasAnyEvent = events.length > 0

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    if (result !== 'default') setNotificationBanner(false)
  }

  const handleEditSave = async (data: CreateAgendaEvent) => {
    if (!editingEvent) return
    await onUpdate(editingEvent.id, data)
    setEditingEvent(null)
  }

  return (
    <div className="space-y-6">
      {/* Notification permission banner */}
      {notificationBanner && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="bell" size={16} className="text-indigo-500" />
            <p className="text-sm font-medium text-indigo-700">Ative lembretes para avisos de eventos próximos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestPermission}
              className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all"
            >
              Ativar
            </button>
            <button
              onClick={() => setNotificationBanner(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 italic uppercase tracking-tighter">
          <div className="w-2 h-8 bg-indigo-600 rounded-full" />
          Agenda
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Icon name="plus" size={16} /> Adicionar Evento
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !hasAnyEvent ? (
        <div className="text-center py-16">
          <Icon name="calendar" size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Nenhum evento agendado.</p>
          <p className="text-sm text-slate-400 mt-1">Adicione compromissos importantes para não esquecer nada.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <AgendaSection
            title="Hoje"
            subtitle={formatSectionDate(today)}
            events={todayEvents}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={setEditingEvent}
          />
          <AgendaSection
            title="Amanhã"
            subtitle={formatSectionDate(tomorrow)}
            events={tomorrowEvents}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={setEditingEvent}
          />
          <AgendaSection
            title="Esta Semana"
            events={thisWeekEvents}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={setEditingEvent}
          />
          <AgendaSection
            title="Próximos"
            events={upcomingEvents}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={setEditingEvent}
          />
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEventModal
          mode="create"
          onSave={onAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingEvent && (
        <AddEventModal
          mode="edit"
          initialValues={editingEvent}
          onSave={handleEditSave}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  )
}
