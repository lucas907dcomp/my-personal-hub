import { useState } from 'react'
import type { MonthlyFuelRecord } from '../../types/fuel'

interface FuelMonthlyHistoryProps {
  history: MonthlyFuelRecord[]
}

function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('.', '')
    .replace(/^(.)/, c => c.toUpperCase())
}

export function FuelMonthlyHistory({ history }: FuelMonthlyHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (history.length === 0) return null

  return (
    <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-700/50 transition-colors focus:outline-none"
      >
        <span className="text-sm font-semibold text-slate-200 uppercase tracking-widest">
          Histórico Mensal
        </span>
        <span className="text-slate-400 text-lg">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <ul className="border-t border-slate-700 divide-y divide-slate-700/50">
          {history.map(entry => (
            <li key={entry.month} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-300 font-medium">{formatMonth(entry.month)}</span>
              <span className="text-slate-400">
                {entry.fillUps} abastecimento{entry.fillUps !== 1 ? 's' : ''} ·{' '}
                <span className="text-emerald-400 font-semibold">
                  R$ {entry.totalSpent.toFixed(2).replace('.', ',')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
