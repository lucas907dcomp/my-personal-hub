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
  rpe: number
  canIncreaseNext: boolean
}

export interface Supplements {
  whey: boolean
  creatina: boolean
}

// Shape returned by GET /api/v1/gym/workouts (exercises embedded)
export interface WorkoutDTO extends Workout {
  exercises: Exercise[]
}
