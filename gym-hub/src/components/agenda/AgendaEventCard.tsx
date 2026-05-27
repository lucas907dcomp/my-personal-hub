import { useState } from 'react'
import { Icon } from '../gym/Icon'
import type { AgendaEvent, EventColor } from '../../types/agenda'

const COLOR_STYLES: Record<EventColor, { dot: string; badge: string }> = {
  indigo:  { dot: 'bg-indigo-500',  badge: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900' },
  amber:   { dot: 'bg-amber-500',   badge: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900' },
  emerald: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' },
  rose:    { dot: 'bg-rose-500',    badge: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900' },
  slate:   { dot: 'bg-slate-400',   badge: 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600' },
}

function formatTime(time: string | null): string | null {
  if (!time) return null
  const [h, m] = time.split(':')
  return `${h}:${m}`
}

interface AgendaEventCardProps {
  event: AgendaEvent
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AgendaEventCard({ event, onToggle, onEdit, onDelete }: AgendaEventCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const colorStyles = COLOR_STYLES[event.color ?? 'slate']
  const timeDisplay = formatTime(event.event_time)

  return (
    <div
      className={`p-4 rounded-3xl border transition-all flex items-start gap-4 ${
        event.completed
          ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60'
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
      }`}
    >
      {/* Color dot */}
      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${colorStyles.dot}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span
              className={`font-bold text-base ${
                event.completed
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {event.title}
            </span>
            {event.description && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 truncate">{event.description}</p>
            )}
          </div>

          {/* Time + reminder badge */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {timeDisplay && (
              <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-lg tracking-tighter">
                {timeDisplay}
              </span>
            )}
            {event.reminder_minutes != null && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Icon name="bell" size={10} /> {event.reminder_minutes}min
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {confirmDelete ? (
          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950 p-1 rounded-xl border border-red-100 dark:border-red-900">
            <span className="text-[10px] font-bold text-red-600 uppercase px-1">Excluir?</span>
            <button
              onClick={onDelete}
              aria-label="Confirmar exclusão"
              className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
            >
              <Icon name="check" size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              aria-label="Cancelar"
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onEdit}
              aria-label={`Editar ${event.title}`}
              className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl transition-all"
            >
              <Icon name="pencil" size={15} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label={`Excluir ${event.title}`}
              className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all"
            >
              <Icon name="trash" size={15} />
            </button>
            <button
              onClick={onToggle}
              aria-label={event.completed ? `Desmarcar ${event.title}` : `Concluir ${event.title}`}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                event.completed
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-300 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400'
              }`}
            >
              <Icon name="check" size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
