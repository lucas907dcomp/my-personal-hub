import { useState } from 'react'

interface AddExerciseFormProps {
  onSubmit: (data: { name: string; weight: number; reps: string; rpe: number }) => void
  onCancel: () => void
}

export function AddExerciseForm({ onSubmit, onCancel }: AddExerciseFormProps) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('8')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    onSubmit({ name, weight: Number(weight), reps, rpe: Number(rpe) })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl card-shadow border border-slate-200 mt-4">
      <h4 className="font-black text-slate-800 mb-5 uppercase tracking-tighter">
        Cadastrar Equipamento
      </h4>
      <div className="space-y-4 mb-5">
        <div>
          <label htmlFor="exercise-name" className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">
            Nome do Exercício
          </label>
          <input
            id="exercise-name"
            required
            type="text"
            placeholder="Ex: Supino Inclinado c/ Halteres"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base font-bold focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <div className="w-1/3">
            <label htmlFor="exercise-weight" className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">
              Carga (kg)
            </label>
            <input
              id="exercise-weight"
              required
              type="number"
              placeholder="Kg"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base font-bold focus:outline-none focus:border-orange-400 transition-all"
            />
          </div>
          <div className="w-1/3">
            <label htmlFor="exercise-reps" className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">
              Séries x Reps
            </label>
            <input
              id="exercise-reps"
              required
              type="text"
              placeholder="Ex: 3x10"
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base font-bold focus:outline-none focus:border-orange-400 transition-all"
            />
          </div>
          <div className="w-1/3">
            <label htmlFor="exercise-rpe" className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">
              Esforço (RPE)
            </label>
            <input
              id="exercise-rpe"
              required
              type="number"
              min="1"
              max="10"
              placeholder="RPE"
              value={rpe}
              onChange={e => setRpe(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base font-bold focus:outline-none focus:border-orange-400 transition-all"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
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
