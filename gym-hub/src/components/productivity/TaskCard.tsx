import { Icon } from '../gym/Icon'
import type { RoutineTask } from '../../types/productivity'

function getTaskIcon(task: RoutineTask) {
  if (task.type === 'health') {
    return task.title.includes('Remédio')
      ? <Icon name="pill" size={18} className="text-pink-500" />
      : <Icon name="fitness" size={18} className="text-orange-500" />
  }
  if (task.type === 'study') return <Icon name="code" size={18} className="text-blue-500" />
  if (task.type === 'career') return <Icon name="linkedin" size={18} className="text-emerald-500" />
  if (task.type === 'work') return <Icon name="briefcase" size={18} className="text-indigo-500" />
  return <Icon name="clock" size={18} className="text-slate-400" />
}

interface TaskCardProps {
  task: RoutineTask
  isConfirming: boolean
  onToggle: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

export function TaskCard({
  task,
  isConfirming,
  onToggle,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: TaskCardProps) {
  return (
    <div
      className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${
        task.done
          ? 'bg-emerald-50 border-transparent opacity-60'
          : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg w-20 text-center uppercase tracking-tighter">
          {task.time}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-lg ${
                task.done ? 'text-emerald-700 line-through' : 'text-slate-800'
              }`}
            >
              {task.title}
            </span>
            {!task.isRecurring && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                Única
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {getTaskIcon(task)}
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              {task.type}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isConfirming ? (
          <div className="flex items-center gap-2 bg-red-50 p-1 rounded-xl border border-red-100">
            <span className="text-[10px] font-bold text-red-600 uppercase px-2">Excluir?</span>
            <button
              onClick={onDeleteConfirm}
              aria-label="Confirmar exclusão"
              className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
            >
              <Icon name="check" size={16} />
            </button>
            <button
              onClick={onDeleteCancel}
              aria-label="Cancelar exclusão"
              className="w-8 h-8 rounded-lg bg-white text-slate-400 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onDeleteRequest}
              aria-label={`Excluir tarefa ${task.title}`}
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <Icon name="trash" size={18} />
            </button>
            <button
              onClick={onToggle}
              aria-label={task.done ? `Desmarcar ${task.title}` : `Concluir ${task.title}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                task.done
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-50 text-slate-400 hover:text-indigo-500'
              }`}
            >
              <Icon name="check" size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
