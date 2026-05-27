import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface ProductivityStats {
  avgCompletionRate: number      // média dos últimos 30 dias (0-100)
  bestStreak: number             // maior sequência consecutiva de dias com 100%
  mostProductiveDay: string | null  // ex: "Segunda" — null se < 7 dias de dados
  totalDaysTracked: number       // total de registros históricos
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function useProductivityStats(session: Session) {
  const [stats, setStats] = useState<ProductivityStats>({
    avgCompletionRate: 0,
    bestStreak: 0,
    mostProductiveDay: null,
    totalDaysTracked: 0,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      // Buscar todos os registros históricos (para bestStreak + totalDays)
      const { data: allData, error: allErr } = await supabase
        .from('tb_daily_completions')
        .select('completion_date, completion_percentage')
        .order('completion_date', { ascending: false })

      if (allErr) throw new Error(allErr.message)

      const all = allData ?? []
      const totalDaysTracked = all.length

      if (totalDaysTracked === 0) {
        setStats({ avgCompletionRate: 0, bestStreak: 0, mostProductiveDay: null, totalDaysTracked: 0 })
        return
      }

      // avg dos últimos 30 dias
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyStr = thirtyDaysAgo.toISOString().split('T')[0]
      const last30 = all.filter(r => r.completion_date >= thirtyStr)
      const avgCompletionRate = last30.length > 0
        ? Math.round(last30.reduce((sum, r) => sum + r.completion_percentage, 0) / last30.length)
        : 0

      // bestStreak: maior sequência consecutiva de 100% no histórico completo
      const sorted = [...all].sort((a, b) => a.completion_date.localeCompare(b.completion_date))
      let bestStreak = 0
      let currentRun = 0
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].completion_percentage === 100) {
          currentRun++
          if (currentRun > bestStreak) bestStreak = currentRun
        } else {
          currentRun = 0
        }
      }

      // mostProductiveDay: só calcula com >= 7 dias; dia da semana com maior média
      let mostProductiveDay: string | null = null
      if (totalDaysTracked >= 7) {
        const dayTotals: Record<number, { sum: number; count: number }> = {}
        for (const record of all) {
          const d = new Date(record.completion_date + 'T00:00:00')
          const day = d.getDay()
          if (!dayTotals[day]) dayTotals[day] = { sum: 0, count: 0 }
          dayTotals[day].sum += record.completion_percentage
          dayTotals[day].count++
        }
        let bestDay = -1
        let bestAvg = -1
        for (const [day, { sum, count }] of Object.entries(dayTotals)) {
          const avg = sum / count
          if (avg > bestAvg) {
            bestAvg = avg
            bestDay = Number(day)
          }
        }
        if (bestDay >= 0) mostProductiveDay = DAY_NAMES[bestDay]
      }

      setStats({ avgCompletionRate, bestStreak, mostProductiveDay, totalDaysTracked })
    } catch (err) {
      console.error('[useProductivityStats] failed:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  return { stats, loading }
}
