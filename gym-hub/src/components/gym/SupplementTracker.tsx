import { Icon } from './Icon'

interface SupplementTrackerProps {
  whey: boolean
  creatina: boolean
  onToggle: (key: 'whey' | 'creatina') => void
}

export function SupplementTracker({ whey, creatina, onToggle }: SupplementTrackerProps) {
  return (
    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 flex items-center gap-1">
        <Icon name="target" size={14} /> Suplementação Diária
      </h2>
      <div className="flex justify-between gap-3">
        <button
          onClick={() => onToggle('whey')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
            whey
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-inner scale-[0.98]'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          Whey Protein
        </button>
        <button
          onClick={() => onToggle('creatina')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
            creatina
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-inner scale-[0.98]'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          Creatina
        </button>
      </div>
    </div>
  )
}
