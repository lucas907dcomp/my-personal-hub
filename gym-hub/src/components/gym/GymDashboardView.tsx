import type { Session } from '@supabase/supabase-js'
import { useGymStats } from '../../hooks/useGymStats'
import { BodyWeightTracker } from './BodyWeightTracker'
import { EmptyState } from '../EmptyState'

interface GymDashboardViewProps {
  session: Session
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`
  return `${Math.round(kg)} kg`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col gap-1">
      <span className="text-xl">{icon}</span>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
}

export function GymDashboardView({ session }: GymDashboardViewProps) {
  const { stats, loading } = useGymStats(session)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="h-40 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (stats.totalSessions === 0) {
    return (
      <EmptyState
        icon="chart"
        title="Ainda sem sessões registradas"
        description="Salve sua primeira sessão num exercício para ver suas estatísticas aqui."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics row */}
      <div>
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Visão Geral
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="🔥"
            label="Streak"
            value={stats.currentStreak}
            sub={stats.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
          />
          <StatCard
            icon="📅"
            label="Sessões este mês"
            value={stats.totalSessionsThisMonth}
            sub={`de ${stats.totalSessions} no total`}
          />
          <StatCard
            icon="💪"
            label="Volume esta semana"
            value={formatVolume(stats.weeklyVolume)}
            sub="seg → dom"
          />
          <StatCard
            icon="🏅"
            label="Total de sessões"
            value={stats.totalSessions}
            sub="all-time"
          />
        </div>
      </div>

      {/* PRs */}
      {stats.topPRs.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            Recordes Pessoais (Top {stats.topPRs.length})
          </h3>
          <div className="space-y-2">
            {stats.topPRs.map((pr, idx) => (
              <div
                key={pr.exerciseId}
                className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">
                      {pr.exerciseName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Última: {formatDate(pr.lastLoggedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-orange-500 text-lg leading-none">{pr.maxWeight}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">kg PR</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body weight tracker */}
      <div>
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Peso Corporal
        </h3>
        <BodyWeightTracker session={session} />
      </div>
    </div>
  )
}
