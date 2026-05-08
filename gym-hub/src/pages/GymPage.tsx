import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/gym/Icon'
import { SupplementTracker } from '../components/gym/SupplementTracker'
import { WorkoutSelector } from '../components/gym/WorkoutSelector'
import { ExerciseCard } from '../components/gym/ExerciseCard'
import { AddExerciseForm } from '../components/gym/AddExerciseForm'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Toast } from '../components/Toast'
import { useWorkouts } from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import { useSupplements } from '../hooks/useSupplements'
import { supabase } from '../lib/supabaseClient'
import { ApiError } from '../lib/api'

interface GymPageProps {
  session: Session
}

type DeleteTarget = { type: 'workout'; id: string } | { type: 'exercise'; id: string } | null

export function GymPage({ session }: GymPageProps) {
  const navigate = useNavigate()
  const { workouts, addWorkout, deleteWorkout, reorderWorkouts } = useWorkouts(session)
  const { exercises, localChange, saveExercise, toggleIncreaseLoad, addExercise, deleteExercise } =
    useExercises(session)
  const { supplements, toggleSupplement } = useSupplements(session)

  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [newWorkoutName, setNewWorkoutName] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

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
    setToastMessage(msg)
  }

  const handleAddWorkout = async () => {
    if (!newWorkoutName.trim()) return
    try {
      const saved = await addWorkout(newWorkoutName.trim())
      setActiveWorkoutId(saved.id)
      setNewWorkoutName('')
    } catch (err) {
      showError(err)
    }
  }

  const handleDeleteWorkout = async (id: string) => {
    if (workouts.length <= 1) {
      setToastMessage('Você não pode deletar o seu último treino.')
      return
    }
    setDeleteTarget({ type: 'workout', id })
  }

  const handleDeleteExercise = (id: string) => {
    setDeleteTarget({ type: 'exercise', id })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'workout') {
        await deleteWorkout(deleteTarget.id)
        if (activeWorkoutId === deleteTarget.id) {
          const remaining = workouts.filter(w => w.id !== deleteTarget.id)
          setActiveWorkoutId(remaining[0]?.id ?? null)
        }
      } else {
        await deleteExercise(deleteTarget.id)
      }
    } catch (err) {
      showError(err)
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleMoveWorkout = async (id: string, direction: 'up' | 'down') => {
    const idx = workouts.findIndex(w => w.id === id)
    if (idx === -1) return
    const newOrder = [...workouts]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    try {
      await reorderWorkouts(newOrder.map(w => w.id))
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
    } catch (err) {
      showError(err)
    }
  }

  const confirmLabel =
    deleteTarget?.type === 'workout' ? 'Excluir treino' : 'Excluir exercício'
  const confirmMessage =
    deleteTarget?.type === 'workout'
      ? 'Excluir este treino irá remover todos os seus exercícios. Esta ação não pode ser desfeita.'
      : 'Tem certeza que deseja excluir este exercício?'

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="max-w-md mx-auto">
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
              className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
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
            onMoveWorkout={handleMoveWorkout}
          />

          {workouts.length === 0 ? (
            <EmptyState
              icon="dumbbell"
              title="Nenhum treino ainda"
              description="Use o botão acima para criar seu primeiro treino."
            />
          ) : (
            <div className="space-y-5">
              {currentExercises.length === 0 ? (
                <EmptyState
                  icon="dumbbell"
                  title="Nenhum exercício neste treino."
                  description="Clique abaixo para adicionar."
                />
              ) : (
                currentExercises.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onLocalChange={localChange}
                    onSave={saveExercise}
                    onDelete={handleDeleteExercise}
                    onToggleIncreaseLoad={toggleIncreaseLoad}
                  />
                ))
              )}
            </div>
          )}

          {workouts.length > 0 && !isAddingExercise && (
            <button
              onClick={() => setIsAddingExercise(true)}
              className="w-full py-5 mt-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-3xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
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

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Confirmar exclusão"
        message={confirmMessage}
        confirmLabel={confirmLabel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
        variant="error"
      />
    </div>
  )
}
