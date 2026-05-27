import { getMuscleGroup } from '../../lib/muscleGroups'

interface MuscleGroupBadgeProps {
  value: string | null | undefined
}

export function MuscleGroupBadge({ value }: MuscleGroupBadgeProps) {
  const group = getMuscleGroup(value)
  if (!group) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${group.color}`}
      title={group.label}
    >
      {group.icon} {group.label}
    </span>
  )
}
