import { useState } from 'react'
import { MUSCLE_GROUPS } from '../../lib/muscleGroups'

interface AddExerciseFormProps {
  onSubmit: (data: { name: string; weight: number; reps: string; rpe: number | null; muscleGroup: string | null }) => void
  onCancel: () => void
}

export function AddExerciseForm({ onSubmit, onCancel }: AddExerciseFormProps) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const rpeValue = rpe.trim() === '' ? null : Number(rpe)
    onSubmit({
      name: name.trim(),
      weight: Number(weight),
      reps,
      rpe: rpeValue,
      muscleGroup,
    })
  }

  const inputCls =
    'w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-4 text-base font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 transition-all'

  const labelCls =
    'text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 mb-1 block'

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white dark:bg-slate-800 p-6 rounded-3xl card-shadow border border-slate-200 dark:border-slate-700 mt-4">
      <h4 className="font-black text-slate-800 dark:text-slate-100 mb-5 uppercase tracking-tighter">
        Cadastrar Exercício
      </h4>
      <div className="space-y-4 mb-5">
        <div>
          <label htmlFor="exercise-name" className={labelCls}>
            Nome do Exercício
          </label>
          <input
            id="exercise-name"
            required
            type="text"
            placeholder="Ex: Supino Inclinado c/ Halteres"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Muscle group picker */}
        <div>
          <p className={labelCls}>Grupo Muscular (opcional)</p>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setMuscleGroup(prev => prev === g.value ? null : g.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 border ${
                  muscleGroup === g.value
                    ? `${g.color} border-transparent scale-105`
                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-1/3">
            <label htmlFor="exercise-weight" className={labelCls}>
              Carga (kg)
            </label>
            <input
              id="exercise-weight"
              required
              type="number"
              placeholder="Kg"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="w-1/3">
            <label htmlFor="exercise-reps" className={labelCls}>
              Séries x Reps
            </label>
            <input
              id="exercise-reps"
              required
              type="text"
              placeholder="Ex: 3x10"
              value={reps}
              onChange={e => setReps(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="w-1/3">
            <label htmlFor="exercise-rpe" className={labelCls}>
              RPE (opcional)
            </label>
            <input
              id="exercise-rpe"
              type="text"
              inputMode="numeric"
              placeholder="1–10"
              value={rpe}
              onChange={e => setRpe(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 text-slate-500 dark:text-slate-300 font-black uppercase text-xs tracking-widest bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-4 text-white font-black uppercase text-xs tracking-widest gym-gradient rounded-2xl shadow-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          Salvar
        </button>
      </div>
    </form>
  )
}
