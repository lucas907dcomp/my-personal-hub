import { useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from '../components/gym/Icon'
import { DashboardView } from '../components/productivity/DashboardView'
import { TaskListView } from '../components/productivity/TaskListView'
import { useProductivityTasks } from '../hooks/useProductivityTasks'
import { useProductivityNote } from '../hooks/useProductivityNote'
import { useProductivityStreak } from '../hooks/useProductivityStreak'

interface ProductivityPageProps {
  session: Session
}

type Tab = 'dashboard' | 'day'

export function ProductivityPage({ session }: ProductivityPageProps) {
  const { tasks, addTask, deleteTask, toggleTask, resetTasks } = useProductivityTasks(session)
  const { content: noteContent, updateContent: onNoteChange } = useProductivityNote(session)
  const { streak, reload: reloadStreak } = useProductivityStreak(session)

  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

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

  return (
    <div className="min-h-screen bg-slate-50">
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
                  <circle
                    stroke="#e2e8f0"
                    strokeWidth="3"
                    fill="transparent"
                    r="16" cx="18" cy="18"
                  />
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
                <button
                  onClick={handleReset}
                  className="text-[10px] font-black text-white bg-red-500 px-3 py-1 rounded-lg hover:bg-red-600 transition-all"
                >
                  SIM
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1"
                >
                  NÃO
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Tab pills */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('day')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              activeTab === 'day'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
            }`}
          >
            Meu Dia
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            nextTask={nextTask}
            noteContent={noteContent}
            onNoteChange={onNoteChange}
            onToggle={toggleTask}
          />
        )}
        {activeTab === 'day' && (
          <TaskListView
            tasks={tasks}
            progress={progress}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onAdd={addTask}
          />
        )}

      </div>
    </div>
  )
}
