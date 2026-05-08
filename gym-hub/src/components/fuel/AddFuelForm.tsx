import { useState } from 'react'
import type { FuelType } from '../../types/fuel'

interface AddFuelFormProps {
  onAdd: (totalValue: number, pricePerLiter: number, odometer: number, fuelType: FuelType) => void
}

export function AddFuelForm({ onAdd }: AddFuelFormProps) {
  const [totalValue, setTotalValue] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [odometer, setOdometer] = useState('')
  const [fuelType, setFuelType] = useState<FuelType>('Gasolina')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!totalValue || !pricePerLiter || !odometer) return
    onAdd(Number(totalValue), Number(pricePerLiter), Number(odometer), fuelType)
    // Clear value + odometer; keep pricePerLiter + fuelType for convenience
    setTotalValue('')
    setOdometer('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="fuel-total-value" className="block text-sm text-slate-400 mb-1">
            Valor Total (R$)
          </label>
          <input
            id="fuel-total-value"
            type="number"
            step="0.01"
            value={totalValue}
            onChange={e => setTotalValue(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-base text-slate-100 focus:border-emerald-400 focus:outline-none transition-colors"
            required
          />
        </div>
        <div>
          <label htmlFor="fuel-price-per-liter" className="block text-sm text-slate-400 mb-1">
            Preço do Litro (R$)
          </label>
          <input
            id="fuel-price-per-liter"
            type="number"
            step="0.01"
            value={pricePerLiter}
            onChange={e => setPricePerLiter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-base text-slate-100 focus:border-emerald-400 focus:outline-none transition-colors"
            required
          />
        </div>
        <div>
          <label htmlFor="fuel-odometer" className="block text-sm text-slate-400 mb-1">
            Odômetro (km)
          </label>
          <input
            id="fuel-odometer"
            type="number"
            value={odometer}
            onChange={e => setOdometer(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-base text-slate-100 focus:border-emerald-400 focus:outline-none transition-colors"
            required
          />
        </div>
        <div>
          <label htmlFor="fuel-type" className="block text-sm text-slate-400 mb-1">
            Combustível
          </label>
          <select
            id="fuel-type"
            value={fuelType}
            onChange={e => setFuelType(e.target.value as FuelType)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-base text-slate-100 focus:border-emerald-400 focus:outline-none transition-colors"
          >
            <option value="Gasolina">Gasolina</option>
            <option value="Etanol">Etanol</option>
          </select>
        </div>
      </div>
      <div className="pt-2">
        <button
          type="submit"
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2.5 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          Registrar Abastecimento
        </button>
      </div>
    </form>
  )
}
