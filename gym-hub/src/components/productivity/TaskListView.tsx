import { useState } from 'react'
import { Icon } from '../gym/Icon'
import { TaskCard } from './TaskCard'
import { AddTaskModal } from './AddTaskModal'
import type { RoutineTask, CreateRoutineTask } from '../../types/productivity'

interface TaskListViewProps {
  tasks: RoutineTask[]
  progress: number
  onToggle: (id: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onAdd: (data: CreateRoutineTask) => void | Promise<void>
}

export function TaskListView({ tasks, progress, onToggle, onDelete, onAdd }: TaskListViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return
    await onDelete(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 italic uppercase tracking-tighter">
          <div className="w-2 h-8 bg-indigo-600 rounded-full" />
          Bloco a Bloco
        </h3>
        <div className="flex items-center gap-3">
          {progress === 100 && tasks.length > 0 && (
            <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full uppercase tracking-widest border border-emerald-100 animate-bounce">
              Metas Batidas! 🏆
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Icon name="plus" size={16} /> Adicionar Tarefa
          </button>
        </div>
      </div>

      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          isConfirming={confirmDeleteId === task.id}
          onToggle={() => onToggle(task.id)}
          onDeleteRequest={() => setConfirmDeleteId(task.id)}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={() => setConfirmDeleteId(null)}
        />
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">Sua rotina está vazia.</p>
          <p className="text-sm text-slate-400 mt-1">Adicione tarefas para organizar seu dia.</p>
        </div>
      )}

      {showAddModal && (
        <AddTaskModal
          onAdd={onAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
