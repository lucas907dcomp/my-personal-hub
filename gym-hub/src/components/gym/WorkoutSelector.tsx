import { Icon } from './Icon'

interface Workout {
  id: string
  name: string
  position: number
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
  onMoveWorkout: (id: string, direction: 'up' | 'down') => void
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
  onMoveWorkout,
}: WorkoutSelectorProps) {
  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={onToggleManage}
          aria-label="Gerenciar treinos"
          aria-expanded={isManaging}
          className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Icon name="settings" size={20} />
        </button>
      </div>

      {isManaging && (
        <div
          role="region"
          aria-label="Gerenciar divisão de treino"
          className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
        >
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase mb-4 tracking-tighter">
            Gerenciar Divisão de Treino
          </h3>
          <div className="space-y-3 mb-4">
            {workouts.map((w, idx) => (
              <div
                key={w.id}
                className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => onMoveWorkout(w.id, 'up')}
                      disabled={idx === 0}
                      aria-label={`Mover ${w.name} para cima`}
                      className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-20 transition-colors p-0.5 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => onMoveWorkout(w.id, 'down')}
                      disabled={idx === workouts.length - 1}
                      aria-label={`Mover ${w.name} para baixo`}
                      className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-20 transition-colors p-0.5 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded"
                    >
                      ▼
                    </button>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{w.name}</span>
                </div>
                <button
                  onClick={() => onDeleteWorkout(w.id)}
                  aria-label={`Excluir treino ${w.name}`}
                  className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
              aria-label="Nome do novo treino"
              className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-base font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
            <button
              onClick={onAddWorkout}
              aria-label="Adicionar treino"
              className="bg-orange-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[52px] min-h-[52px]"
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 pt-2 snap-x">
          {workouts.map(w => (
            <button
              key={w.id}
              onClick={() => onSelect(w.id)}
              aria-pressed={activeWorkoutId === w.id}
              className={`snap-start whitespace-nowrap px-6 py-4 rounded-2xl font-black text-sm tracking-tighter uppercase transition-all flex-shrink-0 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                activeWorkoutId === w.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              {w.name}
            </button>
          ))}
          {workouts.length === 0 && (
            <button
              onClick={onToggleManage}
              className="text-sm font-bold text-orange-500 hover:text-orange-600 py-4 px-2 underline underline-offset-2 transition-colors"
            >
              + Criar primeiro treino
            </button>
          )}
        </div>
        {workouts.length > 1 && (
          <div
            className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  )
}
