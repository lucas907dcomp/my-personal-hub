import { useState } from 'react'
import { Icon } from '../gym/Icon'
import type { CreateRoutineTask, RoutineTask, TaskType } from '../../types/productivity'

interface AddTaskModalProps {
  mode?: 'create' | 'edit'
  initialValues?: RoutineTask
  onAdd: (data: CreateRoutineTask) => void | Promise<void>
  onClose: () => void
}

export function AddTaskModal({ mode = 'create', initialValues, onAdd, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [time, setTime] = useState(initialValues?.time ?? '')
  const [type, setType] = useState<TaskType>(initialValues?.type ?? 'basic')
  const [isRecurring, setIsRecurring] = useState(initialValues?.isRecurring ?? true)

  const isEdit = mode === 'edit'

  const handleSubmit = async () => {
    if (!title.trim() || !time) return
    await onAdd({ title: title.trim(), time, type, isRecurring })
    onClose()
  }

  const inputCls = 'w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-base font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none'
  const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1'

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight italic">
            {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-700 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className={labelCls}>Título</label>
            <input
              id="task-title"
              type="text"
              className={inputCls}
              placeholder="Ex: Revisão de Pull Requests"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-time" className={labelCls}>Horário</label>
              <input
                id="task-time"
                type="time"
                className={inputCls}
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="task-type" className={labelCls}>Categoria</label>
              <select
                id="task-type"
                className={`${inputCls} appearance-none`}
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
              >
                <option value="basic">Básico</option>
                <option value="study">Estudo</option>
                <option value="career">Carreira</option>
                <option value="work">Trabalho / Vagas</option>
                <option value="health">Saúde / Fitness</option>
                <option value="health_medicine">Saúde / Remédio</option>
              </select>
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tarefa recorrente</p>
              {!isRecurring && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">única vez — removida após conclusão no reset</p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring(prev => !prev)}
              className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isRecurring ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${
                  isRecurring ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isEdit ? 'SALVAR ALTERAÇÕES' : 'SALVAR NA ROTINA'}
          </button>
        </div>
      </div>
    </div>
  )
}
