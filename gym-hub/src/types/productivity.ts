export type TaskType = 'basic' | 'study' | 'career' | 'work' | 'health'

export interface RoutineTask {
  id: string
  title: string
  time: string
  done: boolean
  type: TaskType
  isRecurring: boolean
}

export interface CreateRoutineTask {
  title: string
  time: string
  type: TaskType
  isRecurring: boolean
}

export interface WorkspaceNote {
  content: string
}

export interface StreakData {
  currentStreak: number
  totalDays: number
}
