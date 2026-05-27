import { useState } from 'react'
import { Icon } from '../gym/Icon'
import { getTaskIcon } from '../../lib/taskIcons'
import { AddEventModal } from '../agenda/AddEventModal'
import type { RoutineTask } from '../../types/productivity'
import type { AgendaEvent, CreateAgendaEvent } from '../../types/agenda'
import type { ProductivityStats } from '../../hooks/useProductivityStats'

interface DashboardViewProps {
  tasks: RoutineTask[]
  nextTask: RoutineTask | null
  noteContent: string
  onNoteChange: (value: string) => void
  onToggle: (id: string) => void
  loading?: boolean
  stats?: ProductivityStats
  statsLoading?: boolean
  events?: AgendaEvent[]
  eventsLoading?: boolean
  onAddEvent?: (data: CreateAgendaEvent) => Promise<void>
  onToggleEvent?: (id: string) => void
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':')
  return `${h}:${m}`
}

const COLOR_DOT: Record<string, string> = {
  indigo:  'bg-indigo-400',
  amber:   'bg-amber-400',
  emerald: 'bg-emerald-400',
  rose:    'bg-rose-400',
  slate:   'bg-slate-400',
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] ${className}`} />
}

interface StatBoxProps { emoji: string; label: string; value: string }

function StatBox({ emoji, label, value }: StatBoxProps) {
  return (
    <div className="flex flex-col items-center text-center gap-1">
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  )
}

interface MiniEventItemProps { event: AgendaEvent; onToggle: () => void }

function MiniEventItem({ event, onToggle }: MiniEventItemProps) {
  const dotClass = event.color ? (COLOR_DOT[event.color] ?? 'bg-slate-300') : 'bg-slate-300'
  return (
    <div className={`flex items-center gap-2.5 transition-opacity ${event.completed ? 'opacity-40' : ''}`}>
      <button
        onClick={onToggle}
        aria-label={event.completed ? `Desmarcar ${event.title}` : `Concluir ${event.title}`}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          event.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-200 dark:border-slate-600 hover:border-emerald-400'
        }`}
      >
        {event.completed && <Icon name="check" size={11} className="text-white" />}
      </button>
      <span className={`flex-shrink-0 w-2 h-2 rounded-full ${dotClass}`} />
      <span className={`flex-1 text-xs font-medium truncate ${event.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>
        {event.title}
      </span>
      {event.event_time && (
        <span className="flex-shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
          {formatTime(event.event_time)}
        </span>
      )}
    </div>
  )
}

// ─── AgendaMiniCard ───────────────────────────────────────────────────────────

interface AgendaMiniCardProps {
  events: AgendaEvent[]
  loading: boolean
  onAdd: () => void
  onToggle: (id: string) => void
}

function AgendaMiniCard({ events, loading, onAdd, onToggle }: AgendaMiniCardProps) {
  const today    = todayStr()
  const tomorrow = tomorrowStr()

  const todayEvents    = events.filter(e => e.event_date === today)
  const tomorrowEvents = events.filter(e => e.event_date === tomorrow)
  const hasEvents = todayEvents.length > 0 || tomorrowEvents.length > 0

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tighter text-sm">
          <Icon name="calendar" size={16} className="text-indigo-500" />
          Agenda
        </h3>
        <button
          onClick={onAdd}
          aria-label="Adicionar evento"
          className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      ) : !hasEvents ? (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum evento hoje ou amanhã.</p>
          <button
            onClick={onAdd}
            className="mt-2 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            + Adicionar evento
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {todayEvents.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Hoje</p>
              <div className="space-y-2.5">
                {todayEvents.map(e => (
                  <MiniEventItem key={e.id} event={e} onToggle={() => onToggle(e.id)} />
                ))}
              </div>
            </div>
          )}
          {tomorrowEvents.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Amanhã</p>
              <div className="space-y-2.5">
                {tomorrowEvents.map(e => (
                  <MiniEventItem key={e.id} event={e} onToggle={() => onToggle(e.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── DashboardView ────────────────────────────────────────────────────────────

export function DashboardView({
  tasks, nextTask, noteContent, onNoteChange, onToggle, loading,
  stats, statsLoading,
  events = [], eventsLoading = false, onAddEvent, onToggleEvent,
}: DashboardViewProps) {
  const [showAddEventModal, setShowAddEventModal] = useState(false)

  const studyTasks        = tasks.filter(t => t.type === 'study')
  const professionalTasks = tasks.filter(t => t.type === 'work' || t.type === 'career')
  const displayTask = nextTask ?? { id: null, title: 'Dia concluído!', time: '—', type: 'basic' as const, done: true, isRecurring: true }
  const showStats = !statsLoading && stats && stats.totalDaysTracked > 0

  const handleAddEvent = async (data: CreateAgendaEvent) => {
    await onAddEvent?.(data)
    setShowAddEventModal(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Próximo Passo */}
          {loading ? (
            <SkeletonCard className="h-44" />
          ) : (
            <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-700 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4">Próximo Passo</h3>
                <div className="flex items-center gap-6">
                  <div className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{displayTask.time}</div>
                  <div>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{displayTask.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getTaskIcon(displayTask as RoutineTask)}
                      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Bloco ativo na rotina</p>
                    </div>
                  </div>
                </div>
                {nextTask && (
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => onToggle(nextTask.id)}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <Icon name="check" size={20} />
                      MARCAR COMO CONCLUÍDO
                    </button>
                  </div>
                )}
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-[0.03]">
                <Icon name="brain" size={200} />
              </div>
            </section>
          )}

          {/* Notes */}
          <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg dark:text-slate-100 flex items-center gap-2 italic">
                <Icon name="note" size={20} className="text-amber-500" />
                Rascunho / Demandas Extras
              </h3>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg font-bold uppercase italic tracking-wider">
                Salvo na Nuvem
              </span>
            </div>
            <textarea
              aria-label="Rascunho e demandas extras"
              className="w-full h-44 bg-slate-50 dark:bg-slate-700 rounded-3xl p-6 text-base border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 resize-none font-medium text-slate-600 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Links de vagas, detalhes ou compromissos que surgirem..."
              value={noteContent}
              onChange={e => onNoteChange(e.target.value)}
            />
          </section>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {loading ? (
            <>
              <SkeletonCard className="h-52" />
              <SkeletonCard className="h-52" />
            </>
          ) : (
            <>
              {/* Estudos */}
              <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 italic">
                  <Icon name="code" size={20} className="text-blue-400" />
                  Estudos
                </h3>
                <div className="space-y-4">
                  {studyTasks.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <button
                        onClick={() => onToggle(item.id)}
                        aria-label={item.done ? `Desmarcar ${item.title}` : `Concluir ${item.title}`}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          item.done ? 'bg-emerald-500 border-transparent' : 'bg-white/10 border border-white/20'
                        }`}
                      >
                        {item.done && <Icon name="check" size={14} />}
                      </button>
                      <span className={`text-sm font-medium ${item.done ? 'text-white/40 line-through' : 'text-white/90'}`}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                  {studyTasks.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Nenhum bloco de estudo agendado.</p>
                  )}
                </div>
              </div>

              {/* Profissional */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                  <Icon name="briefcase" size={20} className="text-indigo-500" />
                  Profissional
                </h3>
                <div className="space-y-4">
                  {professionalTasks.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <button
                        onClick={() => onToggle(item.id)}
                        aria-label={item.done ? `Desmarcar ${item.title}` : `Concluir ${item.title}`}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          item.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200 dark:border-slate-600'
                        }`}
                      />
                      <span className={`text-xs font-bold ${item.done ? 'text-slate-300 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-200'}`}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                  {professionalTasks.length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Nenhuma tarefa profissional.</p>
                  )}
                </div>
              </div>

              {/* Agenda mini-view */}
              <AgendaMiniCard
                events={events}
                loading={eventsLoading}
                onAdd={() => setShowAddEventModal(true)}
                onToggle={id => onToggleEvent?.(id)}
              />
            </>
          )}
        </div>

        {/* ── Meus Números — full width ──────────────────────────────── */}
        {statsLoading ? (
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-50 dark:border-slate-700 shadow-sm">
            <div className="h-5 w-40 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse" />
                  <div className="w-20 h-3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="w-12 h-6 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : showStats ? (
          <section className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-50 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Icon name="chart" size={16} className="text-indigo-500" />
              Meus Números
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <StatBox emoji="📊" label="Média 30 dias"      value={`${stats!.avgCompletionRate}%`} />
              <StatBox emoji="🏆" label="Melhor sequência"   value={`${stats!.bestStreak} dia${stats!.bestStreak !== 1 ? 's' : ''}`} />
              <StatBox emoji="⭐" label="Dia mais produtivo" value={stats!.mostProductiveDay ?? '—'} />
              <StatBox emoji="📅" label="Dias registrados"   value={String(stats!.totalDaysTracked)} />
            </div>
          </section>
        ) : null}

      </div>

      {/* Modal de adicionar evento */}
      {showAddEventModal && (
        <AddEventModal
          mode="create"
          onSave={handleAddEvent}
          onClose={() => setShowAddEventModal(false)}
        />
      )}
    </>
  )
}
