import type { FuelRecord } from '../../types/fuel'

interface FuelRecordCardProps {
  record: FuelRecord
  onDelete: (id: string) => void
}

export function FuelRecordCard({ record, onDelete }: FuelRecordCardProps) {
  const isGas = record.fuelType === 'Gasolina'
  const badgeClass = isGas
    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-colors gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass}`}>
            {record.fuelType}
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{Number(record.liters).toFixed(3)} Litros</span>
          <span className="text-slate-500 dark:text-slate-400 text-sm hidden sm:inline">
            • R$ {Number(record.pricePerLiter).toFixed(2)}/L
          </span>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-500">
          Odômetro: <span className="text-slate-700 dark:text-slate-300">{record.odometer} km</span> |
          Data: {new Date(record.date).toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6">
        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Pago</p>
          <p className="font-bold text-rose-500 dark:text-rose-400">R$ {Number(record.totalValue).toFixed(2)}</p>
        </div>
        <button
          onClick={() => onDelete(record.id)}
          aria-label={`Excluir abastecimento de ${new Date(record.date).toLocaleDateString('pt-BR')}`}
          className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Excluir registro"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}
