import { Icon } from './Icon'

interface Workout {
  id: string
  name: string
}

interface WorkoutSelectorProps {
  workouts: Workout[]
  activeWorkoutId: string | null
  onSelect: (id: string) => void
  isManaging: boolean
  onToggleManage: () => void
  newWorkoutName: string
  onNewWorkoutNameChange: (val: string) => void
  onAddWorkout: () => void
  onDeleteWorkout: (id: string) => void
}

export function WorkoutSelector({
  workouts,
  activeWorkoutId,
  onSelect,
  isManaging,
  onToggleManage,
  newWorkoutName,
  onNewWorkoutNameChange,
  onAddWorkout,
  onDeleteWorkout,
}: WorkoutSelectorProps) {
  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={onToggleManage}
          className="bg-white/10 p-3 rounded-xl hover:bg-white/20 transition text-white"
        >
          <Icon name="settings" size={20} />
        </button>
      </div>

      {isManaging && (
        <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-100 transition-all">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-4 tracking-tighter">
            Gerenciar Divisão de Treino
          </h3>
          <div className="space-y-3 mb-4">
            {workouts.map(w => (
              <div
                key={w.id}
                className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
              >
                <span className="font-bold text-slate-700 text-sm">{w.name}</span>
                <button
                  onClick={() => onDeleteWorkout(w.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-white rounded-lg shadow-sm"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Treino D (Core)"
              value={newWorkoutName}
              onChange={e => onNewWorkoutNameChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAddWorkout()}
              className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
            <button
              onClick={onAddWorkout}
              className="bg-orange-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 pt-2 snap-x">
        {workouts.map(w => (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            className={`snap-start whitespace-nowrap px-6 py-4 rounded-2xl font-black text-sm tracking-tighter uppercase transition-all flex-shrink-0 border-2 ${
              activeWorkoutId === w.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
            }`}
          >
            {w.name}
          </button>
        ))}
        {workouts.length === 0 && (
          <span className="text-sm font-bold text-slate-400 py-4 px-2">
            Crie um treino em 'Configurações'
          </span>
        )}
      </div>
    </>
  )
}
