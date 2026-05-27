import { useState } from 'react'
import { Icon } from '../gym/Icon'
import type { AgendaEvent, CreateAgendaEvent, EventColor } from '../../types/agenda'

interface AddEventModalProps {
  mode?: 'create' | 'edit'
  initialValues?: AgendaEvent
  onSave: (data: CreateAgendaEvent) => void | Promise<void>
  onClose: () => void
}

const COLORS: { value: EventColor; label: string; bg: string; ring: string }[] = [
  { value: 'indigo',  label: 'Azul',    bg: 'bg-indigo-500',  ring: 'ring-indigo-500' },
  { value: 'emerald', label: 'Verde',   bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { value: 'amber',   label: 'Âmbar',   bg: 'bg-amber-500',   ring: 'ring-amber-500' },
  { value: 'rose',    label: 'Rosa',    bg: 'bg-rose-500',    ring: 'ring-rose-500' },
  { value: 'slate',   label: 'Neutro',  bg: 'bg-slate-400',   ring: 'ring-slate-400' },
]

const REMINDER_OPTIONS = [
  { value: null,  label: 'Sem lembrete' },
  { value: 5,     label: '5 minutos antes' },
  { value: 10,    label: '10 minutos antes' },
  { value: 15,    label: '15 minutos antes' },
  { value: 30,    label: '30 minutos antes' },
  { value: 60,    label: '1 hora antes' },
]

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AddEventModal({ mode = 'create', initialValues, onSave, onClose }: AddEventModalProps) {
  const isEdit = mode === 'edit'

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [eventDate, setEventDate] = useState(initialValues?.event_date ?? todayStr())
  const [eventTime, setEventTime] = useState(initialValues?.event_time?.slice(0, 5) ?? '')
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(initialValues?.reminder_minutes ?? null)
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [color, setColor] = useState<EventColor>(initialValues?.color ?? 'indigo')

  const canSave = title.trim() && eventDate

  const handleSubmit = async () => {
    if (!canSave) return
    await onSave({
      title: title.trim(),
      event_date: eventDate,
      event_time: eventTime || null,
      reminder_minutes: reminderMinutes,
      description: description.trim() || null,
      color,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight italic flex items-center gap-2">
            <Icon name="calendar" size={20} className="text-indigo-500" />
            {isEdit ? 'Editar Evento' : 'Novo Evento'}
          </h3>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-slate-700 bg-slate-50 p-2 rounded-full">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label htmlFor="event-title" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Título *
            </label>
            <input
              id="event-title"
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Reunião de alinhamento"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Data + Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-date" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Data *
              </label>
              <input
                id="event-date"
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="event-time" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Horário <span className="text-slate-400 font-normal normal-case">(opcional)</span>
              </label>
              <input
                id="event-time"
                type="time"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                value={eventTime}
                onChange={e => setEventTime(e.target.value)}
              />
            </div>
          </div>

          {/* Lembrete */}
          <div>
            <label htmlFor="event-reminder" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Lembrete
            </label>
            <select
              id="event-reminder"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              value={reminderMinutes ?? ''}
              onChange={e => setReminderMinutes(e.target.value === '' ? null : Number(e.target.value))}
              disabled={!eventTime}
            >
              {REMINDER_OPTIONS.map(opt => (
                <option key={String(opt.value)} value={opt.value ?? ''}>
                  {!eventTime && opt.value != null ? `${opt.label} (defina um horário)` : opt.label}
                </option>
              ))}
            </select>
            {!eventTime && (
              <p className="text-[11px] text-slate-400 mt-1">Defina um horário para ativar lembretes.</p>
            )}
          </div>

          {/* Cor */}
          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Cor
            </span>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-all ${
                    color === c.value ? `ring-2 ring-offset-2 ${c.ring} scale-110` : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="event-desc" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Descrição <span className="text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              id="event-desc"
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className="w-full mt-2 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? 'SALVAR ALTERAÇÕES' : 'ADICIONAR À AGENDA'}
          </button>
        </div>
      </div>
    </div>
  )
}
