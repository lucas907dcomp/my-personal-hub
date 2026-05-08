export interface Workout {
  id: string
  name: string
}

export interface Exercise {
  id: string
  workoutId: string
  name: string
  weight: number
  reps: string
  rpe: number
  canIncreaseNext: boolean
}

export interface Supplements {
  whey: boolean
  creatina: boolean
}

// Shape returned by GET /api/gym/workouts (exercises embedded)
export interface WorkoutDTO extends Workout {
  exercises: Exercise[]
}
