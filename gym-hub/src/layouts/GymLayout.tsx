import { Outlet } from 'react-router-dom'
import { BottomTabBar } from '../components/BottomTabBar'

export function GymLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 pb-20 max-w-md mx-auto w-full lg:max-w-3xl">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
