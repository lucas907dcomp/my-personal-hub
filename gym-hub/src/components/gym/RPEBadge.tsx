interface RPEBadgeProps {
  value: number | null | undefined
}

const rpeLabel = (v: number) => {
  if (v <= 3) return 'Leve'
  if (v <= 6) return 'Moderado'
  if (v <= 8) return 'Pesado'
  return 'Máximo'
}

const rpeColor = (v: number) => {
  if (v <= 3) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950'
  if (v <= 6) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950'
  if (v <= 8) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950'
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950'
}

export function RPEBadge({ value }: RPEBadgeProps) {
  if (value == null) return null

  return (
    <span
      aria-label={`RPE ${value} — ${rpeLabel(value)}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${rpeColor(value)}`}
    >
      {value}
    </span>
  )
}
