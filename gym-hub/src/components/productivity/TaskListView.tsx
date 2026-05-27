import { useMemo, useState } from 'react'
import { Icon } from '../gym/Icon'
import { TaskCard } from './TaskCard'
import { AddTaskModal } from './AddTaskModal'
import { matchesFilter } from '../../lib/taskUtils'
import type { RoutineTask, CreateRoutineTask, TaskType } from '../../types/productivity'

interface TaskListViewProps {
  tasks: RoutineTask[]
  progress: number
  loading?: boolean
  onToggle: (id: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onAdd: (data: CreateRoutineTask) => void | Promise<void>
  onUpdate: (id: string, data: CreateRoutineTask) => void | Promise<void>
  onDefer?: (task: RoutineTask) => void
}

type FilterOption = TaskType | 'all'

interface ChipConfig {
  label: string
  value: FilterOption
}

const CHIPS: ChipConfig[] = [
  { label: 'Todos',    value: 'all' },
  { label: 'Básico',   value: 'basic' },
  { label: 'Estudo',   value: 'study' },
  { label: 'Carreira', value: 'career' },
  { label: 'Trabalho', value: 'work' },
  { label: 'Saúde',    value: 'health' },
]

function SkeletonCard() {
  return <div className="animate-pulse bg-slate-100 rounded-3xl h-20" />
}

export function TaskListView({ tasks, progress, loading, onToggle, onDelete, onAdd, onUpdate, onDefer }: TaskListViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<RoutineTask | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')

  const filteredTasks = useMemo(
    () => tasks.filter(t => matchesFilter(t, activeFilter)),
    [tasks, activeFilter],
  )

  // Count per chip (used for badge labels)
  const chipCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length }
    for (const chip of CHIPS) {
      if (chip.value !== 'all') {
        counts[chip.value] = tasks.filter(t => matchesFilter(t, chip.value)).length
      }
    }
    return counts
  }, [tasks])

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return
    await onDelete(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  const handleEditSave = async (data: CreateRoutineTask) => {
    if (!editingTask) return
    await onUpdate(editingTask.id, data)
    setEditingTask(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Filter chips (S10.1) */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {CHIPS.map(chip => {
          const count = chipCounts[chip.value] ?? 0
          const isActive = activeFilter === chip.value
          return (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
              }`}
            >
              {chip.label}{count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isConfirming={confirmDeleteId === task.id}
              onToggle={() => onToggle(task.id)}
              onDeleteRequest={() => setConfirmDeleteId(task.id)}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={() => setConfirmDeleteId(null)}
              onEdit={() => setEditingTask(task)}
              onDefer={onDefer ? () => onDefer(task) : undefined}
            />
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              {activeFilter !== 'all' ? (
                <p className="text-slate-500">Nenhuma tarefa desta categoria.</p>
              ) : (
                <>
                  <p className="text-slate-500">Sua rotina está vazia.</p>
                  <p className="text-sm text-slate-400 mt-1">Adicione tarefas para organizar seu dia.</p>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddTaskModal
          mode="create"
          onAdd={onAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingTask && (
        <AddTaskModal
          mode="edit"
          initialValues={editingTask}
          onAdd={handleEditSave}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}
