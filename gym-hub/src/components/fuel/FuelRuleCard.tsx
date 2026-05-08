interface FuelRuleCardProps {
  ratioPercentage: string
}

export function FuelRuleCard({ ratioPercentage }: FuelRuleCardProps) {
  return (
    <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4">
      <div className="text-3xl" aria-hidden="true">💡</div>
      <div>
        <h4 className="font-semibold text-emerald-300">Regra de Abastecimento:</h4>
        <p className="text-sm text-emerald-100/80 mt-1">
          O Etanol só vale a pena se o preço dele na bomba for{' '}
          <strong>menor ou igual a {ratioPercentage}%</strong> do preço da Gasolina.
        </p>
      </div>
    </div>
  )
}
