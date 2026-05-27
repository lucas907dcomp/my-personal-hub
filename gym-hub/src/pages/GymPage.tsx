import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/gym/Icon'
import { SupplementTracker } from '../components/gym/SupplementTracker'
import { WorkoutSelector } from '../components/gym/WorkoutSelector'
import { ExerciseCard } from '../components/gym/ExerciseCard'
import { AddExerciseForm } from '../components/gym/AddExerciseForm'
import { GymDashboardView } from '../components/gym/GymDashboardView'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Toast } from '../components/Toast'
import { useWorkouts } from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import { useSupplements } from '../hooks/useSupplements'
import { supabase } from '../lib/supabaseClient'
import { MUSCLE_GROUPS } from '../lib/muscleGroups'

type GymView = 'workouts' | 'dashboard'

interface GymPageProps {
  session: Session
}

type DeleteTarget = { type: 'workout'; id: string } | { type: 'exercise'; id: string } | null

export function GymPage({ session }: GymPageProps) {
  const navigate = useNavigate()
  const { workouts, addWorkout, deleteWorkout, reorderWorkouts } = useWorkouts(session)
  const { exercises, localChange, saveExercise, toggleIncreaseLoad, addExercise, deleteExercise, reorderExercises } =
    useExercises(session)
  const { items: supplementItems, toggle: toggleSupplement, addSupplement, removeSupplement } = useSupplements(session)

  const [gymView, setGymView] = useState<GymView>('workouts')
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
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

  // Reset filters and reorder mode when switching workouts
  useEffect(() => {
    setMuscleFilter(null)
    setIsReordering(false)
  }, [activeWorkoutId])

  const currentExercises = exercises.filter(e => e.workoutId === activeWorkoutId)

  // Muscle group filter chips — only show groups present in current workout
  const presentGroups = useMemo(() => {
    const groups = new Set(currentExercises.map(e => e.muscleGroup).filter(Boolean) as string[])
    return MUSCLE_GROUPS.filter(g => groups.has(g.value))
  }, [currentExercises])

  const filteredExercises = useMemo(() => {
    if (!muscleFilter) return currentExercises
    return currentExercises.filter(e => e.muscleGroup === muscleFilter)
  }, [currentExercises, muscleFilter])

  // Live volume for current workout: Σ(weight × parseInt(reps)) — integer reps only
  const workoutVolume = currentExercises.reduce((sum, ex) => {
    const repsInt = parseInt(ex.reps, 10)
    if (isNaN(repsInt) || ex.weight <= 0) return sum
    return sum + ex.weight * repsInt
  }, 0)
  const workoutVolumeLabel =
    workoutVolume > 0
      ? workoutVolume >= 1000
        ? `${(workoutVolume / 1000).toFixed(1)} t`
        : `${Math.round(workoutVolume)} kg`
      : null

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const showError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
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
    rpe: number | null
    muscleGroup: string | null
  }) => {
    if (!activeWorkoutId) return
    try {
      await addExercise({ ...data, workoutId: activeWorkoutId, canIncreaseNext: false })
      setIsAddingExercise(false)
    } catch (err) {
      showError(err)
    }
  }

  const handleMoveExercise = async (id: string, direction: 'up' | 'down') => {
    const idx = currentExercises.findIndex(e => e.id === id)
    if (idx === -1) return
    const newOrder = [...currentExercises]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= newOrder.length) return
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    try {
      await reorderExercises(newOrder.map(e => e.id))
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
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
            items={supplementItems}
            onToggle={toggleSupplement}
            onAdd={addSupplement}
            onRemove={removeSupplement}
          />

          {/* View tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setGymView('workouts')}
              aria-pressed={gymView === 'workouts'}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                gymView === 'workouts'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-white/15 text-white/80 hover:bg-white/25'
              }`}
            >
              🏋️ Treinos
            </button>
            <button
              onClick={() => setGymView('dashboard')}
              aria-pressed={gymView === 'dashboard'}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                gymView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-white/15 text-white/80 hover:bg-white/25'
              }`}
            >
              📊 Dashboard
            </button>
          </div>
        </header>

        <main className="p-4 space-y-6 mt-2">
          {gymView === 'dashboard' && (
            <GymDashboardView session={session} />
          )}

          {gymView === 'workouts' && (
            <>
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

              {/* Muscle group filter chips — only when >1 group present */}
              {presentGroups.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  <button
                    onClick={() => setMuscleFilter(null)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 border ${
                      muscleFilter === null
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Todos ({currentExercises.length})
                  </button>
                  {presentGroups.map(g => (
                    <button
                      key={g.value}
                      onClick={() => setMuscleFilter(prev => prev === g.value ? null : g.value)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 border ${
                        muscleFilter === g.value
                          ? `${g.color} border-transparent`
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {g.icon} {g.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Live volume bar */}
              {workoutVolumeLabel && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl px-4 py-2.5 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Volume hoje</p>
                  <p className="font-black text-orange-500 text-sm">{workoutVolumeLabel}</p>
                </div>
              )}

              {workouts.length === 0 ? (
                <EmptyState
                  icon="dumbbell"
                  title="Nenhum treino ainda"
                  description="Use o botão acima para criar seu primeiro treino."
                />
              ) : (
                <div className="space-y-5">
                  {/* Reorder toggle — only when ≥2 exercises */}
                  {currentExercises.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setIsReordering(prev => !prev)}
                        className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isReordering
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isReordering ? '✓ Concluir' : '⇅ Reordenar'}
                      </button>
                    </div>
                  )}

                  {currentExercises.length === 0 ? (
                    <EmptyState
                      icon="dumbbell"
                      title="Nenhum exercício neste treino."
                      description="Clique abaixo para adicionar."
                    />
                  ) : (
                    (isReordering ? currentExercises : filteredExercises).map((ex, idx, arr) => (
                      <div key={ex.id} className={isReordering ? 'flex items-center gap-2' : ''}>
                        {isReordering && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveExercise(ex.id, 'up')}
                              disabled={idx === 0}
                              aria-label="Mover exercício para cima"
                              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-orange-500 disabled:opacity-30 transition-colors shadow-sm font-bold text-sm"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveExercise(ex.id, 'down')}
                              disabled={idx === arr.length - 1}
                              aria-label="Mover exercício para baixo"
                              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-orange-500 disabled:opacity-30 transition-colors shadow-sm font-bold text-sm"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <div className={isReordering ? 'flex-1 min-w-0' : ''}>
                          <ExerciseCard
                            exercise={ex}
                            session={session}
                            onLocalChange={localChange}
                            onSave={saveExercise}
                            onDelete={handleDeleteExercise}
                            onToggleIncreaseLoad={toggleIncreaseLoad}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {workouts.length > 0 && !isAddingExercise && (
                <button
                  onClick={() => setIsAddingExercise(true)}
                  className="w-full py-5 mt-4 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-3xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            </>
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
