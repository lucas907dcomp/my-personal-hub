import { NavLink } from 'react-router-dom'
import { Icon } from './gym/Icon'

const tabs = [
  { to: '/gym', label: 'Gym', icon: 'dumbbell' as const },
  { to: '/fuel', label: 'Fuel', icon: 'target' as const },
  { to: '/tasks', label: 'Tasks', icon: 'check' as const },
]

export function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-50">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] rounded-2xl transition-colors ${
              isActive
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Icon name={tab.icon} size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
