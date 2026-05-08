export type TaskType = 'basic' | 'study' | 'career' | 'work' | 'health'

export interface RoutineTask {
  id: string
  title: string
  time: string
  done: boolean
  type: TaskType
}

export interface CreateRoutineTask {
  title: string
  time: string
  type: TaskType
}

export interface WorkspaceNote {
  content: string
}
