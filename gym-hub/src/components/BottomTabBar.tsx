import { NavLink } from 'react-router-dom'
import { Icon } from './gym/Icon'
import { useTheme } from '../contexts/ThemeContext'

const tabs = [
  { to: '/gym',   label: 'Gym',   icon: 'dumbbell' as const },
  { to: '/fuel',  label: 'Fuel',  icon: 'target'   as const },
  { to: '/tasks', label: 'Tasks', icon: 'check'    as const },
]

export function BottomTabBar() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 z-50 transition-colors duration-300">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] rounded-2xl transition-colors ${
              isActive
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`
          }
        >
          <Icon name={tab.icon} size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
        </NavLink>
      ))}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        className="flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] rounded-2xl transition-colors text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
      >
        <Icon name={isDark ? 'sun' : 'moon'} size={22} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {isDark ? 'Claro' : 'Escuro'}
        </span>
      </button>
    </nav>
  )
}
