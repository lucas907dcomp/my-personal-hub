import type { Session } from '@supabase/supabase-js'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  session: Session | null
  children: React.ReactNode
}

export function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
