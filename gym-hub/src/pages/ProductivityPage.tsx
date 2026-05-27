import { useCallback, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from '../components/gym/Icon'
import { DashboardView } from '../components/productivity/DashboardView'
import { TaskListView } from '../components/productivity/TaskListView'
import { AgendaView } from '../components/agenda/AgendaView'
import { Toast } from '../components/Toast'
import { useProductivityTasks } from '../hooks/useProductivityTasks'
import { useProductivityNote } from '../hooks/useProductivityNote'
import { useProductivityStreak } from '../hooks/useProductivityStreak'
import { useAgendaEvents } from '../hooks/useAgendaEvents'
import { useReminders } from '../hooks/useReminders'
import { useProductivityStats } from '../hooks/useProductivityStats'

interface ProductivityPageProps {
  session: Session
}

type Tab = 'dashboard' | 'day' | 'agenda'

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  day: 'Meu Dia',
  agenda: 'Agenda',
}

export function ProductivityPage({ session }: ProductivityPageProps) {
  const { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask, resetTasks } = useProductivityTasks(session)
  const { content: noteContent, updateContent: onNoteChange } = useProductivityNote(session)
  const { streak, reload: reloadStreak } = useProductivityStreak(session)
  const { events, loading: agendaLoading, addEvent, updateEvent, deleteEvent, toggleEvent } = useAgendaEvents(session)
  const { stats, loading: statsLoading } = useProductivityStats(session)

  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }, [])

  // Lembretes — polling 60s com in-app toast e Browser Notification
  useReminders(events, { onToast: showToast })

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
  }, [tasks])

  const nextTask = useMemo(() => tasks.find(t => !t.done) ?? null, [tasks])

  const handleReset = async () => {
    await resetTasks()
    setShowResetConfirm(false)
    reloadStreak()
  }

  // Adiar tarefa → cria AgendaEvent para amanhã
  const handleDefer = useCallback(async (task: import('../types/productivity').RoutineTask) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    await addEvent({
      title: task.title,
      event_date: tomorrowStr,
      event_time: task.time || null,
      reminder_minutes: 30,
      color: 'amber',
    })
    showToast(`📅 Lembrete criado para amanhã${task.time ? ` às ${task.time}` : ''}`)
  }, [addEvent, showToast])

  return (
    <div className="min-h-screen bg-slate-50">
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} variant="success" />}

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase underline decoration-indigo-500 underline-offset-8">
              Cronograma Diário
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-slate-500 font-medium text-sm tracking-tight">
                Organize sua rotina diária com foco e consistência.
              </p>
              {streak.currentStreak >= 1 && (
                <span className="text-sm font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-xl">
                  🔥 {streak.currentStreak} dia{streak.currentStreak !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1">⚠️ Erro ao carregar tarefas. Verifique sua conexão.</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Progress ring */}
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Concluído</p>
                <p className="text-sm font-black text-indigo-600">{progress}%</p>
              </div>
              <div className="w-12 h-12 relative flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle stroke="#e2e8f0" strokeWidth="3" fill="transparent" r="16" cx="18" cy="18" />
                  <circle
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                    strokeDashoffset={100 - progress}
                    strokeLinecap="round"
                    fill="transparent"
                    r="16" cx="18" cy="18"
                    style={{ transition: 'stroke-dashoffset 0.35s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
              </div>
            </div>

            {/* Reset diário */}
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest px-2 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
              >
                <Icon name="refresh" size={14} /> Reset Diário
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                <span className="text-[10px] font-bold text-red-600 uppercase px-1">Certeza?</span>
                <button onClick={handleReset} className="text-[10px] font-black text-white bg-red-500 px-3 py-1 rounded-lg hover:bg-red-600 transition-all">SIM</button>
                <button onClick={() => setShowResetConfirm(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1">NÃO</button>
              </div>
            )}
          </div>
        </header>

        {/* Tab pills */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            nextTask={nextTask}
            noteContent={noteContent}
            onNoteChange={onNoteChange}
            onToggle={toggleTask}
            loading={loading}
            stats={stats}
            statsLoading={statsLoading}
            events={events}
            eventsLoading={agendaLoading}
            onAddEvent={addEvent}
            onToggleEvent={toggleEvent}
          />
        )}
        {activeTab === 'day' && (
          <TaskListView
            tasks={tasks}
            progress={progress}
            loading={loading}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onAdd={addTask}
            onUpdate={updateTask}
            onDefer={handleDefer}
          />
        )}
        {activeTab === 'agenda' && (
          <AgendaView
            events={events}
            loading={agendaLoading}
            onToggle={toggleEvent}
            onDelete={deleteEvent}
            onAdd={addEvent}
            onUpdate={updateEvent}
          />
        )}

      </div>
    </div>
  )
}
