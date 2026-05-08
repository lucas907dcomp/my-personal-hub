interface RPEBadgeProps {
  value: number
}

const rpeLabel = (v: number) => {
  if (v <= 3) return 'Leve'
  if (v <= 6) return 'Moderado'
  if (v <= 8) return 'Pesado'
  return 'Máximo'
}

const rpeColor = (v: number) => {
  if (v <= 3) return 'text-emerald-600 bg-emerald-50'
  if (v <= 6) return 'text-yellow-600 bg-yellow-50'
  if (v <= 8) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

export function RPEBadge({ value }: RPEBadgeProps) {
  return (
    <span
      aria-label={`RPE ${value} — ${rpeLabel(value)}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${rpeColor(value)}`}
    >
      {value}
    </span>
  )
}
