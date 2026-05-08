export function FuelDegradationAlert() {
  return (
    <div
      role="alert"
      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
    >
      <span className="text-xl">⚠️</span>
      <p className="text-amber-300 text-sm font-medium leading-snug">
        Último tanque rendeu 15%+ abaixo da sua média. Verifique pressão dos pneus ou qualidade do combustível.
      </p>
    </div>
  )
}
