import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface GymPageProps {
  session: Session
}

export function GymPage({ session }: GymPageProps) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">My Workouts</h2>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          Sign out
        </button>
      </div>

      <p className="text-slate-500 text-sm">Logged in as {session.user.email}</p>

      {/* Workout card placeholders — Sprint 2 */}
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="h-20 bg-slate-800/60 border border-slate-700/50 rounded-xl animate-pulse"
        />
      ))}
    </div>
  )
}
