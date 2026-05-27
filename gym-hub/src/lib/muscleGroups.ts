export const MUSCLE_GROUPS = [
  { value: 'chest',     label: 'Peito',   icon: '🫁', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'back',      label: 'Costas',  icon: '🔙', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'shoulders', label: 'Ombros',  icon: '💆', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'biceps',    label: 'Bíceps',  icon: '💪', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'triceps',   label: 'Tríceps', icon: '🦾', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'legs',      label: 'Pernas',  icon: '🦵', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'core',      label: 'Core',    icon: '🎯', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'cardio',    label: 'Cardio',  icon: '🏃', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]['value']

export function getMuscleGroup(value: string | null | undefined) {
  return MUSCLE_GROUPS.find(g => g.value === value) ?? null
}
