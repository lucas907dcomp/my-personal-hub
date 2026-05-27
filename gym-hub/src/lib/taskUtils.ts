import type { RoutineTask, TaskType } from '../types/productivity'

/**
 * Verifica se uma tarefa corresponde ao filtro selecionado.
 * 'health' como filtro casa com 'health' E 'health_medicine'.
 */
export function matchesFilter(task: RoutineTask, filter: TaskType | 'all'): boolean {
  if (filter === 'all') return true
  if (filter === 'health') return task.type === 'health' || task.type === 'health_medicine'
  return task.type === filter
}

/**
 * Label de exibição por tipo de tarefa.
 */
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  basic:           'Básico',
  study:           'Estudo',
  career:          'Carreira',
  work:            'Trabalho',
  health:          'Saúde / Fitness',
  health_medicine: 'Saúde / Remédio',
}
