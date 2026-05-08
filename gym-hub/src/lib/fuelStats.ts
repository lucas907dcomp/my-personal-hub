import type { FuelRecord, FuelStats } from '../types/fuel'

export function calcFuelStats(records: FuelRecord[]): FuelStats {
  if (records.length < 2) {
    return { avgGlobal: 0, gasAvg: 0, ethAvg: 0, myRatio: 0.70, totalDistance: 0, totalSpent: 0, costPerKm: '0.00' }
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

  return { avgGlobal, gasAvg, ethAvg, myRatio, totalDistance, totalSpent, costPerKm }
}
