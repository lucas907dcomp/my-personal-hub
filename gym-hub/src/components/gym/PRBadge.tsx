import { useEffect, useState } from 'react'

interface PRBadgeProps {
  visible: boolean
}

export function PRBadge({ visible }: PRBadgeProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!show) return null

  return (
    <span
      aria-label="Novo recorde pessoal!"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 animate-bounce"
      style={{ animationDuration: '0.6s', animationIterationCount: 3 }}
    >
      🏆 Novo PR!
    </span>
  )
}
