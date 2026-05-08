import { Icon } from './Icon'

interface Exercise {
  id: string
  name: string
  weight: number
  reps: string
  rpe: number
  canIncreaseNext: boolean
}

interface ExerciseCardProps {
  exercise: Exercise
  onLocalChange: (id: string, field: string, value: unknown) => void
  onSave: (id: string) => void
  onDelete: (id: string) => void
  onToggleIncreaseLoad: (id: string) => void
}

export function ExerciseCard({
  exercise: ex,
  onLocalChange,
  onSave,
  onDelete,
  onToggleIncreaseLoad,
}: ExerciseCardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-100 relative overflow-hidden transition-all hover:border-slate-200">
      {ex.canIncreaseNext && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      )}

      <div className="flex justify-between items-start mb-5 pl-2">
        <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{ex.name}</h4>
        <button
          onClick={() => onDelete(ex.id)}
          className="text-slate-300 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-lg"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5 pl-2">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">
            Carga
          </label>
          <div className="flex items-end gap-1">
            <input
              type="number"
              value={ex.weight}
              onChange={e => onLocalChange(ex.id, 'weight', Number(e.target.value))}
              onBlur={() => onSave(ex.id)}
              className="w-full bg-transparent text-slate-800 font-black text-2xl focus:outline-none"
            />
            <span className="text-xs font-bold text-slate-400 mb-1">kg</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">
            Reps
          </label>
          <input
            type="text"
            value={ex.reps}
            onChange={e => onLocalChange(ex.id, 'reps', e.target.value)}
            onBlur={() => onSave(ex.id)}
            className="w-full bg-transparent text-slate-800 font-black text-xl lg:text-2xl focus:outline-none"
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">
            RPE
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={ex.rpe}
            onChange={e => onLocalChange(ex.id, 'rpe', Number(e.target.value))}
            onBlur={() => onSave(ex.id)}
            className="w-full bg-transparent text-slate-800 font-black text-2xl focus:outline-none"
          />
        </div>
      </div>

      <div className="pl-2">
        <button
          onClick={() => onToggleIncreaseLoad(ex.id)}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
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
    </div>
  )
}
