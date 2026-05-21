import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { CreateFuelRecord, FuelRecord } from '../types/fuel'

type DbFuelRecord = {
  id: string
  date: string
  total_value: number
  price_per_liter: number
  odometer: number
  liters: number
  fuel_type: string
}

function mapRecord(r: DbFuelRecord): FuelRecord {
  return {
    id: r.id,
    date: r.date,
    totalValue: r.total_value,
    pricePerLiter: r.price_per_liter,
    odometer: r.odometer,
    liters: r.liters,
    fuelType: r.fuel_type as FuelRecord['fuelType'],
  }
}

export function useFuelRecords(session: Session) {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tb_fuel_records')
        .select('id, date, total_value, price_per_liter, odometer, liters, fuel_type')
        .order('date', { ascending: false })
      if (error) throw new Error(error.message)
      setRecords((data ?? []).map(mapRecord))
    } catch (err) {
      console.error('[useFuelRecords] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const addRecord = async (payload: CreateFuelRecord): Promise<void> => {
    const liters = Number((payload.totalValue / payload.pricePerLiter).toFixed(3))
    const { data, error } = await supabase
      .from('tb_fuel_records')
      .insert({
        user_id: session.user.id,
        date: new Date().toISOString(),
        total_value: payload.totalValue,
        price_per_liter: payload.pricePerLiter,
        odometer: payload.odometer,
        fuel_type: payload.fuelType,
        liters,
      })
      .select('id, date, total_value, price_per_liter, odometer, liters, fuel_type')
      .single()
    if (error) throw new Error(error.message)
    setRecords(prev => [mapRecord(data), ...prev])
  }

  const deleteRecord = async (id: string): Promise<void> => {
    const snapshot = records
    setRecords(prev => prev.filter(r => r.id !== id))
    try {
      const { error } = await supabase.from('tb_fuel_records').delete().eq('id', id)
      if (error) throw new Error(error.message)
    } catch (err) {
      setRecords(snapshot)
      throw err
    }
  }

  return { records, loading, addRecord, deleteRecord }
}
