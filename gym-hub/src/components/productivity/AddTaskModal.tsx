import { useState } from 'react'
import { Icon } from '../gym/Icon'
import type { CreateRoutineTask, TaskType } from '../../types/productivity'

interface AddTaskModalProps {
  onAdd: (data: CreateRoutineTask) => void | Promise<void>
  onClose: () => void
}

export function AddTaskModal({ onAdd, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState<TaskType>('basic')

  const handleSubmit = async () => {
    if (!title.trim() || !time) return
    await onAdd({ title: title.trim(), time, type })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight italic">Nova Tarefa</h3>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-slate-400 hover:text-slate-700 bg-slate-50 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Título
            </label>
            <input
              id="task-title"
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Revisão de Pull Requests"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-time" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Horário
              </label>
              <input
                id="task-time"
                type="time"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="task-type" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Categoria
              </label>
              <select
                id="task-type"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
              >
                <option value="basic">Básico</option>
                <option value="study">Estudo (Java)</option>
                <option value="career">Carreira (LinkedIn)</option>
                <option value="work">Trabalho / Vagas</option>
                <option value="health">Saúde / Fitness</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            SALVAR NA ROTINA
          </button>
        </div>
      </div>
    </div>
  )
}
