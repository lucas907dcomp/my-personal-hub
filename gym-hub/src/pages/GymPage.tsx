import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from '../components/gym/Icon'
import { SupplementTracker } from '../components/gym/SupplementTracker'
import { WorkoutSelector } from '../components/gym/WorkoutSelector'
import { ExerciseCard } from '../components/gym/ExerciseCard'
import { AddExerciseForm } from '../components/gym/AddExerciseForm'

// Hardcoded test data — S2.1 (no backend connection yet)
const TEST_WORKOUTS = [
  { id: 'w1', name: 'Treino A' },
  { id: 'w2', name: 'Treino B' },
]
const TEST_EXERCISES = [
  { id: 'e1', workoutId: 'w1', name: 'Supino Reto', weight: 80, reps: '4x8', rpe: 8, canIncreaseNext: false },
  { id: 'e2', workoutId: 'w1', name: 'Remada Curvada', weight: 70, reps: '4x10', rpe: 7, canIncreaseNext: true },
  { id: 'e3', workoutId: 'w2', name: 'Agachamento', weight: 100, reps: '5x5', rpe: 9, canIncreaseNext: false },
]

interface GymPageProps {
  session: Session
}

export function GymPage({ session: _session }: GymPageProps) {
  const [workouts, setWorkouts] = useState(TEST_WORKOUTS)
  const [exercises, setExercises] = useState(TEST_EXERCISES)
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>('w1')
  const [supplements, setSupplements] = useState({ whey: false, creatina: false })
  const [isManaging, setIsManaging] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [newWorkoutName, setNewWorkoutName] = useState('')

  const currentExercises = exercises.filter(e => e.workoutId === activeWorkoutId)

  const handleToggleSupplement = (key: 'whey' | 'creatina') => {
    setSupplements(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAddWorkout = () => {
    if (!newWorkoutName.trim()) return
    const newWorkout = { id: `w${Date.now()}`, name: newWorkoutName.trim() }
    setWorkouts(prev => [...prev, newWorkout])
    setActiveWorkoutId(newWorkout.id)
    setNewWorkoutName('')
  }

  const handleDeleteWorkout = (id: string) => {
    if (workouts.length <= 1) {
      alert('Você não pode deletar o seu último treino.')
      return
    }
    setWorkouts(prev => {
      const remaining = prev.filter(w => w.id !== id)
      if (activeWorkoutId === id) setActiveWorkoutId(remaining[0].id)
      return remaining
    })
    setExercises(prev => prev.filter(e => e.workoutId !== id))
  }

  const handleLocalChange = (id: string, field: string, value: unknown) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const handleSaveExercise = (_id: string) => {
    // S2.2: wire to backend
  }

  const handleDeleteExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const handleToggleIncreaseLoad = (id: string) => {
    setExercises(prev =>
      prev.map(e => e.id === id ? { ...e, canIncreaseNext: !e.canIncreaseNext } : e),
    )
  }

  const handleAddExercise = (data: { name: string; weight: number; reps: string; rpe: number }) => {
    if (!activeWorkoutId) return
    const newEx = { ...data, id: `e${Date.now()}`, workoutId: activeWorkoutId, canIncreaseNext: false }
    setExercises(prev => [...prev, newEx])
    setIsAddingExercise(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="gym-gradient text-white p-6 rounded-b-[2.5rem] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Icon name="dumbbell" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight italic">Gym Hub</h1>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                Performance & Data
              </p>
            </div>
          </div>
        </div>
        <SupplementTracker
          whey={supplements.whey}
          creatina={supplements.creatina}
          onToggle={handleToggleSupplement}
        />
      </header>

      <main className="p-4 space-y-6 mt-2">
        <WorkoutSelector
          workouts={workouts}
          activeWorkoutId={activeWorkoutId}
          onSelect={setActiveWorkoutId}
          isManaging={isManaging}
          onToggleManage={() => setIsManaging(prev => !prev)}
          newWorkoutName={newWorkoutName}
          onNewWorkoutNameChange={setNewWorkoutName}
          onAddWorkout={handleAddWorkout}
          onDeleteWorkout={handleDeleteWorkout}
        />

        {workouts.length > 0 && (
          <div className="space-y-5">
            {currentExercises.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Icon name="dumbbell" size={32} />
                </div>
                <p className="text-slate-500 font-medium">Nenhum exercício neste treino.</p>
                <p className="text-slate-400 text-xs mt-1">Clique abaixo para adicionar.</p>
              </div>
            ) : (
              currentExercises.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onLocalChange={handleLocalChange}
                  onSave={handleSaveExercise}
                  onDelete={handleDeleteExercise}
                  onToggleIncreaseLoad={handleToggleIncreaseLoad}
                />
              ))
            )}
          </div>
        )}

        {workouts.length > 0 && !isAddingExercise && (
          <button
            onClick={() => setIsAddingExercise(true)}
            className="w-full py-5 mt-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-3xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-400 transition-all"
          >
            <Icon name="plus" /> Novo Exercício
          </button>
        )}

        {isAddingExercise && (
          <AddExerciseForm
            onSubmit={handleAddExercise}
            onCancel={() => setIsAddingExercise(false)}
          />
        )}
      </main>
    </div>
  )
}
