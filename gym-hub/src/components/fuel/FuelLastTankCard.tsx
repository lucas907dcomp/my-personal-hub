interface FuelLastTankCardProps {
  lastTankKmL: number
  avgGlobal: number | string
}

export function FuelLastTankCard({ lastTankKmL, avgGlobal }: FuelLastTankCardProps) {
  const avg = Number(avgGlobal)
  const isAbove = avg > 0 && lastTankKmL >= avg

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Último Tanque</p>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-100">{lastTankKmL.toFixed(2)}</span>
        <span className="text-slate-400 text-sm mb-1">km/L</span>
        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-lg ${
          isAbove
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isAbove ? '▲ Acima' : '▼ Abaixo'} da média
        </span>
      </div>
    </div>
  )
}
