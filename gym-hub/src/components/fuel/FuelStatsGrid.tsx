import type { FuelStats } from '../../types/fuel'

interface FuelStatsGridProps {
  stats: FuelStats
}

export function FuelStatsGrid({ stats }: FuelStatsGridProps) {
  const ratioPercentage = (stats.myRatio * 100).toFixed(1)

  return (
    <section
      className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      aria-label="Estatísticas de consumo"
    >
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-1">Média Global</h3>
        <p className="text-2xl font-semibold text-white">
          {stats.avgGlobal} <span className="text-sm font-normal text-slate-400">km/L</span>
        </p>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-1">Média Gasolina</h3>
        <p className="text-2xl font-semibold text-blue-400">
          {stats.gasAvg} <span className="text-sm font-normal text-slate-400">km/L</span>
        </p>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-1">Média Etanol</h3>
        <p className="text-2xl font-semibold text-green-400">
          {stats.ethAvg} <span className="text-sm font-normal text-slate-400">km/L</span>
        </p>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-1">Seu Coeficiente</h3>
        <p className="text-2xl font-semibold text-amber-400">{ratioPercentage}%</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 col-span-2 lg:col-span-1">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-1">Custo por km</h3>
        <p className="text-2xl font-semibold text-rose-400">R$ {stats.costPerKm}</p>
      </div>
    </section>
  )
}
