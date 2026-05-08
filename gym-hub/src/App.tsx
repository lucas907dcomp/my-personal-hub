import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { SplashScreen } from './components/SplashScreen'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GymLayout } from './layouts/GymLayout'
import { GymPage } from './pages/GymPage'
import { FuelPage } from './pages/FuelPage'
import { ProductivityPage } from './pages/ProductivityPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'

function App() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <SplashScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          element={
            <ProtectedRoute session={session}>
              <GymLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/gym" element={<GymPage session={session!} />} />
          <Route path="/fuel" element={<FuelPage session={session!} />} />
          <Route path="/tasks" element={<ProductivityPage session={session!} />} />
        </Route>
        <Route path="*" element={<Navigate to={session ? '/gym' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
