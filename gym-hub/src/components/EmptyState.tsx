import { Icon } from './gym/Icon'
import type { IconName } from './gym/Icon'

interface EmptyStateProps {
  icon?: IconName
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = 'dumbbell', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
        <Icon name={icon} size={32} />
      </div>
      <p className="text-slate-600 font-bold text-base">{title}</p>
      {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
