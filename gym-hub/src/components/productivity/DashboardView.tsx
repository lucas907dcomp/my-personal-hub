import { Icon } from '../gym/Icon'
import type { RoutineTask } from '../../types/productivity'

interface DashboardViewProps {
  tasks: RoutineTask[]
  nextTask: RoutineTask | null
  noteContent: string
  onNoteChange: (value: string) => void
  onToggle: (id: string) => void
}

function getNextTaskIcon(task: RoutineTask) {
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

export function DashboardView({ tasks, nextTask, noteContent, onNoteChange, onToggle }: DashboardViewProps) {
  const studyTasks = tasks.filter(t => t.type === 'study')
  const professionalTasks = tasks.filter(t => t.type === 'work' || t.type === 'career')

  const displayTask = nextTask ?? { id: null, title: 'Dia concluído!', time: '—', type: 'basic' as const, done: true }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Próximo Passo */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4">Próximo Passo</h3>
            <div className="flex items-center gap-6">
              <div className="text-5xl font-black text-slate-800 tracking-tighter">{displayTask.time}</div>
              <div>
                <p className="text-xl font-bold text-slate-700">{displayTask.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getNextTaskIcon(displayTask as RoutineTask)}
                  <p className="text-slate-400 text-sm font-medium">Bloco ativo na rotina</p>
                </div>
              </div>
            </div>

            {nextTask && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => onToggle(nextTask.id)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Icon name="check" size={20} />
                  MARCAR COMO CONCLUÍDO
                </button>
              </div>
            )}
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-[0.03]">
            <Icon name="brain" size={200} />
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 italic">
              <Icon name="note" size={20} className="text-amber-500" />
              Rascunho / Demandas Extras
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-bold uppercase italic tracking-wider">
              Salvo na Nuvem
            </span>
          </div>
          <textarea
            aria-label="Rascunho e demandas extras"
            className="w-full h-44 bg-slate-50 rounded-3xl p-6 text-base border-none focus:ring-2 focus:ring-indigo-100 resize-none font-medium text-slate-600 outline-none"
            placeholder="Links de vagas, detalhes ou compromissos que surgirem..."
            value={noteContent}
            onChange={e => onNoteChange(e.target.value)}
          />
        </section>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Foco Java Pós */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 italic">
            <Icon name="code" size={20} className="text-blue-400" />
            Foco Java Pós
          </h3>
          <div className="space-y-4">
            {studyTasks.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <button
                  onClick={() => onToggle(item.id)}
                  aria-label={item.done ? `Desmarcar ${item.title}` : `Concluir ${item.title}`}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    item.done ? 'bg-emerald-500 border-transparent' : 'bg-white/10 border border-white/20'
                  }`}
                >
                  {item.done && <Icon name="check" size={14} />}
                </button>
                <span className={`text-sm font-medium ${item.done ? 'text-white/40 line-through' : 'text-white/90'}`}>
                  {item.title}
                </span>
              </div>
            ))}
            {studyTasks.length === 0 && (
              <p className="text-sm text-slate-500 italic">Nenhum bloco de estudo agendado.</p>
            )}
          </div>
        </div>

        {/* Profissional */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <Icon name="briefcase" size={20} className="text-indigo-500" />
            Profissional
          </h3>
          <div className="space-y-4">
            {professionalTasks.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <button
                  onClick={() => onToggle(item.id)}
                  aria-label={item.done ? `Desmarcar ${item.title}` : `Concluir ${item.title}`}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    item.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200'
                  }`}
                />
                <span className={`text-xs font-bold ${item.done ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                  {item.title}
                </span>
              </div>
            ))}
            {professionalTasks.length === 0 && (
              <p className="text-sm text-slate-400 italic">Nenhuma tarefa profissional.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
