import { Outlet } from 'react-router-dom'
import { BottomTabBar } from '../components/BottomTabBar'

export function GymLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
