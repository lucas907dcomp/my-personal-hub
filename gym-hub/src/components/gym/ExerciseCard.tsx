import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from './Icon'
import { RPEBadge } from './RPEBadge'
import { PRBadge } from './PRBadge'
import { MuscleGroupBadge } from './MuscleGroupBadge'
import { Toast } from '../Toast'
import { useExerciseSessions } from '../../hooks/useExerciseSessions'

const HistoryModal = lazy(() =>
  import('./HistoryModal').then(m => ({ default: m.HistoryModal }))
)

interface Exercise {
  id: string
  name: string
  weight: number
  reps: string
  rpe: number | null
  canIncreaseNext: boolean
  muscleGroup?: string | null
}

interface ExerciseCardProps {
  exercise: Exercise
  session: Session
  onLocalChange: (id: string, field: string, value: unknown) => void
  onSave: (id: string) => void
  onDelete: (id: string) => void
  onToggleIncreaseLoad: (id: string) => void
}

/** Catches chunk-load failures and render errors inside HistoryModal */
class HistoryErrorBoundary extends Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onClose: () => void }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={this.props.onClose} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl p-8 text-center border-t border-slate-100 dark:border-slate-700">
            <p className="text-3xl mb-3">📉</p>
            <p className="font-black text-slate-800 dark:text-slate-100 mb-1 uppercase tracking-tight">
              Erro ao carregar histórico
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">
              Verifique sua conexão e tente novamente.
            </p>
            <button
              onClick={this.props.onClose}
              className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors focus:outline-none"
            >
              Fechar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Epley 1RM formula: weight * (1 + reps/30), 1 decimal
function calcOneRM(weight: number, repsStr: string): string | null {
  if (!/^\d+$/.test(repsStr)) return null
  const reps = parseInt(repsStr, 10)
  if (reps < 1 || reps > 20 || weight <= 0) return null
  return (weight * (1 + reps / 30)).toFixed(1)
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return 'ontem'
  return `há ${diffDays} dias`
}

export function ExerciseCard({
  exercise: ex,
  session,
  onLocalChange,
  onSave,
  onDelete,
  onToggleIncreaseLoad,
}: ExerciseCardProps) {
  const { lastSession, logSession, isSaving, toast, dismissToast, isNewPR } = useExerciseSessions(session, ex.id)
  const [showHistory, setShowHistory] = useState(false)
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')

  // Debounced save: ensures state is committed before the API call
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)
  useEffect(() => { onSaveRef.current = onSave }, [onSave])

  const scheduleSave = (id: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => onSaveRef.current(id), 300)
  }

  const isIntegerReps = /^\d+$/.test(ex.reps ?? '')
  const oneRM = calcOneRM(ex.weight, ex.reps)

  const stepWeight = (delta: number) => {
    const rounded = Math.round(Math.max(0, (ex.weight ?? 0) + delta) * 10) / 10
    onLocalChange(ex.id, 'weight', rounded)
    scheduleSave(ex.id)
  }

  const stepReps = (delta: number) => {
    if (!isIntegerReps) return
    const newReps = Math.max(0, parseInt(ex.reps, 10) + delta)
    onLocalChange(ex.id, 'reps', String(newReps))
    scheduleSave(ex.id)
  }

  const handleSaveSession = (notes: string | null = null) => {
    logSession(ex.weight, ex.reps, ex.rpe, notes)
    setShowNotesInput(false)
    setNotesDraft('')
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl card-shadow border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-all hover:border-slate-200 dark:hover:border-slate-600">
      {ex.canIncreaseNext && (
        <div
          className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          aria-hidden="true"
        />
      )}

      <div className="flex justify-between items-start mb-5 pl-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg uppercase tracking-tight">{ex.name}</h4>
          <RPEBadge value={ex.rpe} />
          <MuscleGroupBadge value={ex.muscleGroup} />
          <PRBadge visible={isNewPR} />
        </div>
        <button
          onClick={() => onDelete(ex.id)}
          aria-label={`Excluir exercício ${ex.name}`}
          className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-3 gap-3 mb-2 pl-2">
        {/* Weight with steppers below value */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-600 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 dark:focus-within:ring-orange-900/20 transition-all">
          <label
            htmlFor={`weight-${ex.id}`}
            className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block mb-1 tracking-widest"
          >
            Carga
          </label>
          <div className="flex items-end gap-0.5 mb-1">
            <input
              id={`weight-${ex.id}`}
              type="number"
              value={ex.weight}
              onChange={e => onLocalChange(ex.id, 'weight', Number(e.target.value))}
              onBlur={() => onSave(ex.id)}
              className="w-full bg-transparent text-slate-800 dark:text-slate-100 font-black text-xl focus:outline-none min-w-0"
            />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-0.5 shrink-0">kg</span>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => stepWeight(-2.5)}
              aria-label="Reduzir 2.5 kg"
              className="text-slate-400 hover:text-orange-500 transition-colors px-1 py-0.5 text-[10px] font-bold focus:outline-none flex items-center gap-0.5"
            >
              <Icon name="minus" size={12} />2.5
            </button>
            <button
              type="button"
              onClick={() => stepWeight(2.5)}
              aria-label="Adicionar 2.5 kg"
              className="text-slate-400 hover:text-orange-500 transition-colors px-1 py-0.5 text-[10px] font-bold focus:outline-none flex items-center gap-0.5"
            >
              2.5<Icon name="plus" size={12} />
            </button>
          </div>
        </div>

        {/* Reps with conditional steppers */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-600 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/20 transition-all">
          <label
            htmlFor={`reps-${ex.id}`}
            className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block mb-1 tracking-widest"
          >
            Reps
          </label>
          {isIntegerReps ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepReps(-1)}
                aria-label="Reduzir 1 rep"
                className="text-slate-400 hover:text-blue-500 transition-colors p-0.5 focus:outline-none"
              >
                <Icon name="minus" size={14} />
              </button>
              <input
                id={`reps-${ex.id}`}
                type="text"
                value={ex.reps}
                onChange={e => onLocalChange(ex.id, 'reps', e.target.value)}
                onBlur={() => onSave(ex.id)}
                className="w-full bg-transparent text-slate-800 dark:text-slate-100 font-black text-xl focus:outline-none text-center min-w-0"
              />
              <button
                type="button"
                onClick={() => stepReps(1)}
                aria-label="Adicionar 1 rep"
                className="text-slate-400 hover:text-blue-500 transition-colors p-0.5 focus:outline-none"
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
          ) : (
            <input
              id={`reps-${ex.id}`}
              type="text"
              value={ex.reps}
              onChange={e => onLocalChange(ex.id, 'reps', e.target.value)}
              onBlur={() => onSave(ex.id)}
              className="w-full bg-transparent text-slate-800 dark:text-slate-100 font-black text-xl lg:text-2xl focus:outline-none"
            />
          )}
        </div>

        {/* RPE — optional */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-600 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-900/20 transition-all">
          <label
            htmlFor={`rpe-${ex.id}`}
            className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block mb-1 tracking-widest"
          >
            RPE (opcional)
          </label>
          <input
            id={`rpe-${ex.id}`}
            type="number"
            min="1"
            max="10"
            placeholder="—"
            value={ex.rpe ?? ''}
            onChange={e => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              onLocalChange(ex.id, 'rpe', val)
            }}
            onBlur={() => onSave(ex.id)}
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 font-black text-2xl focus:outline-none"
          />
        </div>
      </div>

      {/* 1RM Epley (ADR-018) */}
      {oneRM !== null && (
        <p className="pl-2 text-xs font-medium text-slate-400 dark:text-slate-500 mb-3">
          ~1RM: {oneRM} kg
        </p>
      )}

      {/* Last session (ADR-022) */}
      {lastSession && (
        <div className="pl-2 mb-3">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Último treino</p>
            <button
              onClick={() => setShowHistory(true)}
              aria-label={`Ver histórico de ${ex.name}`}
              className="text-[10px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest flex items-center gap-1 transition-colors focus:outline-none"
            >
              <Icon name="chart" size={12} /> Histórico
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {formatRelativeTime(lastSession.loggedAt)}
            {lastSession.weight != null && ` · ${lastSession.weight} kg`}
            {lastSession.reps && ` · ${lastSession.reps}`}
            {lastSession.rpe != null && ` · RPE ${lastSession.rpe}`}
          </p>
          {lastSession.notes && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5 line-clamp-1">
              "{lastSession.notes.length > 60 ? `${lastSession.notes.slice(0, 60)}...` : lastSession.notes}"
            </p>
          )}
        </div>
      )}

      <div className="pl-2 space-y-3">
        {/* Save session — expands notes field before confirming */}
        {!showNotesInput ? (
          <button
            onClick={() => setShowNotesInput(true)}
            disabled={isSaving}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
          >
            <Icon name="check" size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Sessão'}
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              placeholder="Notas opcionais... (dor, energia, ambiente)"
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 transition-all"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSaveSession(null)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Sem nota
              </button>
              <button
                type="button"
                onClick={() => handleSaveSession(notesDraft.trim() || null)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar ✓'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setShowNotesInput(false); setNotesDraft('') }}
              className="w-full text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
            >
              cancelar
            </button>
          </div>
        )}

        {/* Increase load toggle */}
        <button
          onClick={() => onToggleIncreaseLoad(ex.id)}
          aria-label={ex.canIncreaseNext ? 'Carga programada para subir no próximo treino' : 'Marcar para progredir no próximo treino'}
          aria-pressed={ex.canIncreaseNext}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            ex.canIncreaseNext
              ? 'bg-emerald-500 text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]'
              : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
          }`}
        >
          {ex.canIncreaseNext ? (
            <Icon name="check" size={18} />
          ) : (
            <Icon name="trendingUp" size={18} />
          )}
          {ex.canIncreaseNext ? 'Carga sobe no próximo' : 'Progredir no próximo treino?'}
        </button>
      </div>

      {/* Session toast */}
      {toast && (
        <Toast
          message={toast.msg}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      {/* History modal — lazy loaded; ErrorBoundary prevents app-level crash */}
      {showHistory && (
        <HistoryErrorBoundary onClose={() => setShowHistory(false)}>
          <Suspense fallback={null}>
            <HistoryModal
              exerciseId={ex.id}
              exerciseName={ex.name}
              onClose={() => setShowHistory(false)}
            />
          </Suspense>
        </HistoryErrorBoundary>
      )}
    </div>
  )
}
