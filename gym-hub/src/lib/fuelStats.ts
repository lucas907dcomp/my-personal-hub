import type { FuelRecord, FuelStats, MonthlyFuelRecord } from '../types/fuel'

export function calcFuelStats(records: FuelRecord[]): FuelStats {
  if (records.length < 2) {
    return {
      avgGlobal: 0, gasAvg: 0, ethAvg: 0, myRatio: 0.70,
      totalDistance: 0, totalSpent: 0, costPerKm: '0.00',
      lastTankKmL: null, hasDegradationAlert: false, monthlyHistory: [],
    }
  }

  // Records arrive newest-first from API; reverse to chronological for segment calculation
  const chrono = [...records].reverse()

  let gasDistance = 0, gasLiters = 0
  let ethDistance = 0, ethLiters = 0
  let totalDistance = 0

  for (let i = 0; i < chrono.length - 1; i++) {
    const current = chrono[i]
    const next = chrono[i + 1]
    const segmentDistance = next.odometer - current.odometer

    totalDistance += segmentDistance

    if (current.fuelType === 'Gasolina') {
      gasDistance += segmentDistance
      gasLiters += Number(current.liters)
    } else {
      ethDistance += segmentDistance
      ethLiters += Number(current.liters)
    }
  }

  const totalSpent = records.reduce((acc, curr) => acc + Number(curr.totalValue), 0)
  const totalLitersAll = chrono.slice(0, -1).reduce((acc, curr) => acc + Number(curr.liters), 0)

  const avgGlobal = totalLitersAll > 0 ? (totalDistance / totalLitersAll).toFixed(2) : 0
  const gasAvg = gasLiters > 0 ? (gasDistance / gasLiters).toFixed(2) : 0
  const ethAvg = ethLiters > 0 ? (ethDistance / ethLiters).toFixed(2) : 0
  const costPerKm = totalDistance > 0 ? (totalSpent / totalDistance).toFixed(2) : '0.00'

  let myRatio = 0.70
  if (Number(gasAvg) > 0 && Number(ethAvg) > 0) {
    myRatio = Number(ethAvg) / Number(gasAvg)
  }

  // ADR-020: lastTankKmL — last segment distance / last fill-up liters
  const n = chrono.length
  const lastSegmentDistance = chrono[n - 1].odometer - chrono[n - 2].odometer
  const lastLiters = Number(chrono[n - 1].liters)
  const lastTankKmL = lastSegmentDistance > 0 && lastLiters > 0
    ? lastSegmentDistance / lastLiters
    : null

  // ADR-020: hasDegradationAlert — last tank is 15%+ below global average
  const avgGlobalNum = Number(avgGlobal)
  const hasDegradationAlert = lastTankKmL !== null && avgGlobalNum > 0
    ? lastTankKmL < avgGlobalNum * 0.85
    : false

  // ADR-020: monthlyHistory — group by YYYY-MM, sorted most recent first
  const monthMap = new Map<string, MonthlyFuelRecord>()
  for (const record of records) {
    const month = record.date.substring(0, 7)
    const existing = monthMap.get(month)
    if (existing) {
      existing.totalSpent += Number(record.totalValue)
      existing.fillUps += 1
    } else {
      monthMap.set(month, { month, totalSpent: Number(record.totalValue), fillUps: 1 })
    }
  }
  const monthlyHistory = Array.from(monthMap.values())
    .sort((a, b) => b.month.localeCompare(a.month))

  return {
    avgGlobal, gasAvg, ethAvg, myRatio, totalDistance, totalSpent, costPerKm,
    lastTankKmL, hasDegradationAlert, monthlyHistory,
  }
}
