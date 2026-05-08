import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/gym/Icon'
import { SupplementTracker } from '../components/gym/SupplementTracker'
import { WorkoutSelector } from '../components/gym/WorkoutSelector'
import { ExerciseCard } from '../components/gym/ExerciseCard'
import { AddExerciseForm } from '../components/gym/AddExerciseForm'
import { useWorkouts } from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import { useSupplements } from '../hooks/useSupplements'
import { supabase } from '../lib/supabaseClient'
import { ApiError } from '../lib/api'

interface GymPageProps {
  session: Session
}

export function GymPage({ session }: GymPageProps) {
  const navigate = useNavigate()
  const { workouts, addWorkout, deleteWorkout } = useWorkouts(session)
  const { exercises, localChange, saveExercise, toggleIncreaseLoad, addExercise, deleteExercise } =
    useExercises(session)
  const { supplements, toggleSupplement } = useSupplements(session)

  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [newWorkoutName, setNewWorkoutName] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  // Select first workout once data loads
  useEffect(() => {
    if (workouts.length > 0 && !activeWorkoutId) {
      setActiveWorkoutId(workouts[0].id)
    }
  }, [workouts, activeWorkoutId])

  const currentExercises = exercises.filter(e => e.workoutId === activeWorkoutId)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const showError = (err: unknown) => {
    const msg = err instanceof ApiError ? err.userMessage : String(err)
    setApiError(msg)
  }

  const handleAddWorkout = async () => {
    if (!newWorkoutName.trim()) return
    try {
      const saved = await addWorkout(newWorkoutName.trim())
      setActiveWorkoutId(saved.id)
      setNewWorkoutName('')
      setApiError(null)
    } catch (err) {
      showError(err)
    }
  }

  const handleDeleteWorkout = async (id: string) => {
    if (workouts.length <= 1) {
      alert('Você não pode deletar o seu último treino.')
      return
    }
    try {
      await deleteWorkout(id)
      if (activeWorkoutId === id) {
        const remaining = workouts.filter(w => w.id !== id)
        setActiveWorkoutId(remaining[0]?.id ?? null)
      }
      setApiError(null)
    } catch (err) {
      showError(err)
    }
  }

  const handleAddExercise = async (data: {
    name: string
    weight: number
    reps: string
    rpe: number
  }) => {
    if (!activeWorkoutId) return
    try {
      await addExercise({ ...data, workoutId: activeWorkoutId, canIncreaseNext: false })
      setIsAddingExercise(false)
      setApiError(null)
    } catch (err) {
      showError(err)
    }
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
          <button
            onClick={handleSignOut}
            className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Sair
          </button>
        </div>
        <SupplementTracker
          whey={supplements.whey}
          creatina={supplements.creatina}
          onToggle={toggleSupplement}
        />
      </header>

      <main className="p-4 space-y-4 mt-2">
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <p className="text-red-700 text-sm font-medium leading-snug">{apiError}</p>
            <button
              onClick={() => setApiError(null)}
              className="text-red-400 hover:text-red-600 flex-shrink-0 font-bold text-base leading-none"
            >
              ✕
            </button>
          </div>
        )}

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
                  onLocalChange={localChange}
                  onSave={saveExercise}
                  onDelete={deleteExercise}
                  onToggleIncreaseLoad={toggleIncreaseLoad}
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
