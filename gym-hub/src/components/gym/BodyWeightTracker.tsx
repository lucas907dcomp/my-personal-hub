import { lazy, Suspense, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useBodyWeight } from '../../hooks/useBodyWeight'

const BodyWeightChart = lazy(() =>
  import('./BodyWeightChart').then(m => ({ default: m.BodyWeightChart }))
)

interface BodyWeightTrackerProps {
  session: Session
}

export function BodyWeightTracker({ session }: BodyWeightTrackerProps) {
  const { entries, loading, addEntry, removeEntry } = useBodyWeight(session)
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const todayEntry = entries.find(e => e.date === today)

  const handleSave = async () => {
    const kg = parseFloat(inputValue.replace(',', '.'))
    if (isNaN(kg) || kg <= 0 || kg > 500) {
      setError('Peso inválido')
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      await addEntry(kg)
      setInputValue('')
    } catch {
      setError('Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  // Chart data: last 30 entries in chronological order
  const chartData = [...entries]
    .slice(0, 30)
    .reverse()
    .map(e => ({
      date: new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weight: e.weight_kg,
    }))

  // Weight delta vs 30 days ago
  const latestWeight = entries[0]?.weight_kg
  const oldestInRange = entries[Math.min(entries.length - 1, 29)]
  const delta = latestWeight !== undefined && oldestInRange && entries.length > 1
    ? latestWeight - oldestInRange.weight_kg
    : null

  if (loading) {
    return <div className="h-40 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Peso Corporal
          </p>
          {latestWeight !== undefined && (
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                {latestWeight.toFixed(1)}
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-1">kg</span>
              </p>
              {delta !== null && (
                <span className={`text-xs font-black ${
                  delta < 0 ? 'text-emerald-500' : delta > 0 ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} {Math.abs(delta).toFixed(1)} kg
                </span>
              )}
            </div>
          )}
        </div>
        {todayEntry && (
          <button
            onClick={() => removeEntry(todayEntry.id)}
            className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 font-bold transition-colors focus:outline-none"
          >
            Resetar hoje
          </button>
        )}
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="px-2 pb-2">
          <Suspense fallback={<div className="h-[140px] bg-slate-50 dark:bg-slate-700/50 rounded-xl animate-pulse" />}>
            <BodyWeightChart data={chartData} />
          </Suspense>
        </div>
      )}

      {chartData.length < 2 && (
        <p className="px-4 pb-3 text-xs text-slate-400 dark:text-slate-500">
          Registre pelo menos 2 dias para ver o gráfico de evolução.
        </p>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-1">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              min="1"
              max="500"
              placeholder={todayEntry ? `Hoje: ${todayEntry.weight_kg.toFixed(1)} kg` : 'Peso de hoje (kg)'}
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!inputValue.trim() || isSaving}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          >
            {isSaving ? '...' : todayEntry ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
        {error && (
          <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
        )}
      </div>
    </div>
  )
}
