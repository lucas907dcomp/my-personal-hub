export type FuelType = 'Gasolina' | 'Etanol'

export interface FuelRecord {
  id: string
  date: string
  totalValue: number
  pricePerLiter: number
  odometer: number
  liters: number
  fuelType: FuelType
}

export interface CreateFuelRecord {
  totalValue: number
  pricePerLiter: number
  odometer: number
  fuelType: FuelType
}

export interface MonthlyFuelRecord {
  month: string
  totalSpent: number
  fillUps: number
}

export interface FuelStats {
  avgGlobal: number | string
  gasAvg: number | string
  ethAvg: number | string
  myRatio: number
  totalDistance: number
  totalSpent: number
  costPerKm: string
  lastTankKmL: number | null
  hasDegradationAlert: boolean
  monthlyHistory: MonthlyFuelRecord[]
}
