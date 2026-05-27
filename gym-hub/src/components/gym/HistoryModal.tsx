import { useEffect } from 'react'
import { useExerciseHistory } from '../../hooks/useExerciseHistory'
import { ProgressChart } from './ProgressChart'

interface HistoryModalProps {
  exerciseId: string
  exerciseName: string
  onClose: () => void
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatRelative(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return 'ontem'
  return `há ${diffDays}d`
}

export function HistoryModal({ exerciseId, exerciseName, onClose }: HistoryModalProps) {
  const { sessions, chartData, loading } = useExerciseHistory(exerciseId)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Histórico de ${exerciseName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl border-t border-slate-100 dark:border-slate-700 max-h-[82vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 pb-3 shrink-0">
          <div>
            <h2 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              {exerciseName}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {sessions.length > 0 ? `${sessions.length} sessão${sessions.length !== 1 ? 'ões' : ''}` : 'Histórico'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar histórico"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            ✕
          </button>
        </div>

        {/* Chart */}
        {chartData.length >= 2 && (
          <div className="px-5 pb-3 shrink-0">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Progressão de Carga
            </p>
            <ProgressChart data={chartData} />
          </div>
        )}

        {/* Session list */}
        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {loading ? (
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                Nenhuma sessão registrada ainda.
              </p>
              <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">
                Use "Salvar Sessão" para começar a registrar.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {sessions.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-600"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-center min-w-[40px] shrink-0">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                        {formatDate(s.loggedAt)}
                      </p>
                      <p className="text-[10px] text-slate-300 dark:text-slate-600">
                        {formatRelative(s.loggedAt)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      {s.weight !== null && (
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                          {s.weight} kg
                        </p>
                      )}
                      {s.reps && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.reps} reps</p>
                      )}
                      {s.notes && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5 truncate max-w-[160px]">
                          "{s.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.rpe !== null && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded-lg">
                        RPE {s.rpe}
                      </span>
                    )}
                    {idx === 0 && (
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                        Última
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
