export type IconName =
  | 'dumbbell'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'trendingUp'
  | 'check'
  | 'settings'
  | 'target'
  | 'brain'
  | 'clock'
  | 'note'
  | 'code'
  | 'linkedin'
  | 'briefcase'
  | 'pill'
  | 'fitness'
  | 'refresh'
  | 'close'

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

const paths: Record<IconName, React.ReactNode> = {
  dumbbell: <path d="M6.5 6.5h11v11h-11z M4 9h16v6H4z M2 11h20v2H2z M8 4v16M16 4v16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />,
  trendingUp: <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />,
  check: <path d="M20 6L9 17l-5-5" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  brain: <path d="M9.5 2A5.5 5.5 0 004 7.5c0 1.63.7 3.1 1.82 4.12A4.5 4.5 0 005.5 20h13a4.5 4.5 0 00-.32-8.38A5.5 5.5 0 0014.5 2h-5z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  note: <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />,
  code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  linkedin: (
    <>
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </>
  ),
  pill: (
    <>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </>
  ),
  fitness: <path d="M18 10V6a2 2 0 00-2-2H8a2 2 0 00-2 2v4a4 4 0 004 4h4a4 4 0 004-4zM7 21h10m-5-7v7" />,
  refresh: <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8m0-5v5h-5" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
}

export function Icon({ name, size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  )
}
