import { Icon } from '../gym/Icon'
import { getTaskIcon } from '../../lib/taskIcons'
import type { RoutineTask } from '../../types/productivity'
import type { ProductivityStats } from '../../hooks/useProductivityStats'

interface DashboardViewProps {
  tasks: RoutineTask[]
  nextTask: RoutineTask | null
  noteContent: string
  onNoteChange: (value: string) => void
  onToggle: (id: string) => void
  loading?: boolean
  stats?: ProductivityStats
  statsLoading?: boolean
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-[2.5rem] ${className}`} />
}

interface StatBoxProps {
  emoji: string
  label: string
  value: string
}

function StatBox({ emoji, label, value }: StatBoxProps) {
  return (
    <div className="flex flex-col items-center text-center gap-1">
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-black text-slate-800">{value}</span>
    </div>
  )
}

export function DashboardView({
  tasks, nextTask, noteContent, onNoteChange, onToggle, loading,
  stats, statsLoading,
}: DashboardViewProps) {
  const studyTasks = tasks.filter(t => t.type === 'study')
  const professionalTasks = tasks.filter(t => t.type === 'work' || t.type === 'career')

  const displayTask = nextTask ?? { id: null, title: 'Dia concluído!', time: '—', type: 'basic' as const, done: true, isRecurring: true }

  const showStats = !statsLoading && stats && stats.totalDaysTracked > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Próximo Passo */}
        {loading ? (
          <SkeletonCard className="h-44" />
        ) : (
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4">Próximo Passo</h3>
              <div className="flex items-center gap-6">
                <div className="text-5xl font-black text-slate-800 tracking-tighter">{displayTask.time}</div>
                <div>
                  <p className="text-xl font-bold text-slate-700">{displayTask.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTaskIcon(displayTask as RoutineTask)}
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
        )}

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
        {loading ? (
          <>
            <SkeletonCard className="h-52" />
            <SkeletonCard className="h-52" />
          </>
        ) : (
          <>
            {/* Estudos */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 italic">
                <Icon name="code" size={20} className="text-blue-400" />
                Estudos
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
          </>
        )}
      </div>

      {/* Meus Números — full width (S10.3) */}
      {statsLoading ? (
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
          <div className="h-5 w-40 bg-slate-100 rounded-full animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
                <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="w-12 h-6 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : showStats ? (
        <section className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Icon name="chart" size={16} className="text-indigo-500" />
            Meus Números
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <StatBox emoji="📊" label="Média 30 dias"         value={`${stats!.avgCompletionRate}%`} />
            <StatBox emoji="🏆" label="Melhor sequência"      value={`${stats!.bestStreak} dia${stats!.bestStreak !== 1 ? 's' : ''}`} />
            <StatBox emoji="⭐" label="Dia mais produtivo"    value={stats!.mostProductiveDay ?? '—'} />
            <StatBox emoji="📅" label="Dias registrados"      value={String(stats!.totalDaysTracked)} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
