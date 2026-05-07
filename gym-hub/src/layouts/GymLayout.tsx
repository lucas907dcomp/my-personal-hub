import { Outlet } from 'react-router-dom'

export function GymLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <main className="flex-1 px-4 pb-20 pt-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
      {/* BottomTabBar slot — Sprint 2 */}
    </div>
  )
}
