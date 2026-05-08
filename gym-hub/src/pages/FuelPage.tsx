import type { Session } from '@supabase/supabase-js'
import { FuelStatsGrid } from '../components/fuel/FuelStatsGrid'
import { FuelRuleCard } from '../components/fuel/FuelRuleCard'
import { AddFuelForm } from '../components/fuel/AddFuelForm'
import { FuelRecordCard } from '../components/fuel/FuelRecordCard'
import { FuelLastTankCard } from '../components/fuel/FuelLastTankCard'
import { FuelDegradationAlert } from '../components/fuel/FuelDegradationAlert'
import { FuelMonthlyHistory } from '../components/fuel/FuelMonthlyHistory'
import { useFuelRecords } from '../hooks/useFuelRecords'
import type { FuelType } from '../types/fuel'
import { calcFuelStats } from '../lib/fuelStats'

interface FuelPageProps {
  session: Session
}

export function FuelPage({ session }: FuelPageProps) {
  const { records, addRecord, deleteRecord } = useFuelRecords(session)

  const stats = calcFuelStats(records)
  const ratioPercentage = (stats.myRatio * 100).toFixed(1)

  const handleAdd = async (
    totalValue: number,
    pricePerLiter: number,
    odometer: number,
    fuelType: FuelType,
  ) => {
    await addRecord({ totalValue, pricePerLiter, odometer, fuelType })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return
    await deleteRecord(id)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        <header className="flex justify-between items-end border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Fuel Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Analytics de Eficiência Automotiva</p>
          </div>
        </header>

        <FuelStatsGrid stats={stats} />

        {/* Último tanque — only when data is available */}
        {stats.lastTankKmL !== null && (
          <FuelLastTankCard lastTankKmL={stats.lastTankKmL} avgGlobal={stats.avgGlobal} />
        )}

        <FuelRuleCard ratioPercentage={ratioPercentage} />

        {/* Degradation alert above the form */}
        {stats.hasDegradationAlert && <FuelDegradationAlert />}

        <AddFuelForm onAdd={handleAdd} />

        <FuelMonthlyHistory history={stats.monthlyHistory} />

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Histórico de Registros</h2>
          <div className="space-y-3">
            {records.map(record => (
              <FuelRecordCard
                key={record.id}
                record={record}
                onDelete={handleDelete}
              />
            ))}
            {records.length === 0 && (
              <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-500">Nenhum abastecimento registrado.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
