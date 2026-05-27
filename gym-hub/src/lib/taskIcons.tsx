import React from 'react'
import { Icon } from '../components/gym/Icon'
import type { RoutineTask } from '../types/productivity'

/**
 * Retorna o elemento de ícone correto para um tipo de tarefa.
 * Single source of truth — sem lógica baseada em task.title.
 */
export function getTaskIcon(task: Pick<RoutineTask, 'type'>, size = 18): React.ReactElement {
  switch (task.type) {
    case 'health_medicine':
      return <Icon name="pill" size={size} className="text-pink-500" />
    case 'health':
      return <Icon name="fitness" size={size} className="text-orange-500" />
    case 'study':
      return <Icon name="code" size={size} className="text-blue-500" />
    case 'career':
      return <Icon name="linkedin" size={size} className="text-emerald-500" />
    case 'work':
      return <Icon name="briefcase" size={size} className="text-indigo-500" />
    default:
      return <Icon name="clock" size={size} className="text-slate-400" />
  }
}
