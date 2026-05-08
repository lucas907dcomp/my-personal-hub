import { Outlet } from 'react-router-dom'
import { BottomTabBar } from '../components/BottomTabBar'

export function GymLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
