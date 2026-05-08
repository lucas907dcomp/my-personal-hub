interface ProgressIndicatorProps {
  ready: boolean
}

export function ProgressIndicator({ ready }: ProgressIndicatorProps) {
  if (!ready) return null
  return (
    <span
      aria-label="Pronto para progredir — RPE ≤ 7 na última sessão"
      title="Pronto para progredir"
      className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700"
    >
      ↑ Progresso
    </span>
  )
}
