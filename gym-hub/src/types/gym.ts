export interface Workout {
  id: string
  name: string
  position: number
}

export interface Exercise {
  id: string
  workoutId: string
  name: string
  weight: number
  reps: string
  rpe: number | null
  canIncreaseNext: boolean
  muscleGroup: string | null
  position: number
}

export interface GymSession {
  id: string
  exerciseId: string
  loggedAt: string
  weight: number | null
  reps: string | null
  rpe: number | null
  notes: string | null
}

export interface Supplements {
  whey: boolean
  creatina: boolean
}

export interface BodyWeightEntry {
  id: string
  date: string       // 'YYYY-MM-DD'
  weight_kg: number
  created_at: string
}

/** Unified supplement item — covers both legacy (whey/creatina) and dynamic configs */
export interface SupplementItem {
  id: string                       // 'whey' | 'creatina' | uuid from tb_supplement_config
  name: string
  icon: string
  takenToday: boolean
  isLegacy: boolean
  legacyKey?: 'whey' | 'creatina'
}

// Shape returned by GET /api/v1/gym/workouts (exercises embedded)
export interface WorkoutDTO extends Workout {
  exercises: Exercise[]
}
