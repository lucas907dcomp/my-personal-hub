import { useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from './Icon'
import { RPEBadge } from './RPEBadge'
import { Toast } from '../Toast'
import { useExerciseSessions } from '../../hooks/useExerciseSessions'

interface Exercise {
  id: string
  name: string
  weight: number
  reps: string
  rpe: number | null
  canIncreaseNext: boolean
}

interface ExerciseCardProps {
  exercise: Exercise
  session: Session
  onLocalChange: (id: string, field: string, value: unknown) => void
  onSave: (id: string) => void
  onDelete: (id: string) => void
  onToggleIncreaseLoad: (id: string) => void
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
  const { lastSession, logSession, isSaving, toast, dismissToast } = useExerciseSessions(session, ex.id)

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

  const handleSaveSession = () => {
    logSession(ex.weight, ex.reps, ex.rpe)
  }

  return (
    <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-100 relative overflow-hidden transition-all hover:border-slate-200">
      {ex.canIncreaseNext && (
        <div
          className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          aria-hidden="true"
        />
      )}

      <div className="flex justify-between items-start mb-5 pl-2">
        <div className="flex items-center gap-2">
          <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{ex.name}</h4>
          <RPEBadge value={ex.rpe} />
        </div>
        <button
          onClick={() => onDelete(ex.id)}
          aria-label={`Excluir exercício ${ex.name}`}
          className="text-slate-300 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-3 gap-3 mb-2 pl-2">
        {/* Weight with steppers */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label
            htmlFor={`weight-${ex.id}`}
            className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest"
          >
            Carga
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepWeight(-2.5)}
              aria-label="Reduzir 2.5 kg"
              className="text-slate-400 hover:text-orange-500 transition-colors p-0.5 focus:outline-none"
            >
              <Icon name="minus" size={14} />
            </button>
            <div className="flex items-end gap-0.5 flex-1 min-w-0">
              <input
                id={`weight-${ex.id}`}
                type="number"
                value={ex.weight}
                onChange={e => onLocalChange(ex.id, 'weight', Number(e.target.value))}
                onBlur={() => onSave(ex.id)}
                className="w-full bg-transparent text-slate-800 font-black text-xl focus:outline-none min-w-0"
              />
              <span className="text-xs font-bold text-slate-400 mb-0.5">kg</span>
            </div>
            <button
              type="button"
              onClick={() => stepWeight(2.5)}
              aria-label="Adicionar 2.5 kg"
              className="text-slate-400 hover:text-orange-500 transition-colors p-0.5 focus:outline-none"
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
        </div>

        {/* Reps with conditional steppers */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <label
            htmlFor={`reps-${ex.id}`}
            className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest"
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
                className="w-full bg-transparent text-slate-800 font-black text-xl focus:outline-none text-center min-w-0"
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
              className="w-full bg-transparent text-slate-800 font-black text-xl lg:text-2xl focus:outline-none"
            />
          )}
        </div>

        {/* RPE — optional */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <label
            htmlFor={`rpe-${ex.id}`}
            className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest"
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
            className="w-full bg-transparent text-slate-800 font-black text-2xl focus:outline-none"
          />
        </div>
      </div>

      {/* 1RM Epley (ADR-018) */}
      {oneRM !== null && (
        <p className="pl-2 text-xs font-medium text-slate-400 mb-3">
          ~1RM: {oneRM} kg
        </p>
      )}

      {/* Last session (ADR-022) */}
      {lastSession && (
        <div className="pl-2 mb-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Último treino</p>
          <p className="text-xs text-slate-500 font-medium">
            {formatRelativeTime(lastSession.loggedAt)}
            {lastSession.weight != null && ` · ${lastSession.weight} kg`}
            {lastSession.reps && ` · ${lastSession.reps}`}
            {lastSession.rpe != null && ` · RPE ${lastSession.rpe}`}
          </p>
        </div>
      )}

      <div className="pl-2 space-y-3">
        {/* Save session button (ADR-022) */}
        <button
          onClick={handleSaveSession}
          disabled={isSaving}
          className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
        >
          <Icon name="check" size={16} />
          {isSaving ? 'Salvando...' : 'Salvar Sessão'}
        </button>

        {/* Increase load toggle */}
        <button
          onClick={() => onToggleIncreaseLoad(ex.id)}
          aria-label={ex.canIncreaseNext ? 'Carga programada para subir no próximo treino' : 'Marcar para progredir no próximo treino'}
          aria-pressed={ex.canIncreaseNext}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            ex.canIncreaseNext
              ? 'bg-emerald-500 text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
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
    </div>
  )
}
