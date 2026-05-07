import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { AuthForm } from '../components/AuthForm'

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(email: string, password: string) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/gym')
    }
  }

  return (
    <div className="min-h-screen bg-gym-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">GYMHUB</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
          <AuthForm mode="login" onSubmit={handleLogin} error={error} loading={loading} />
        </div>

        <p className="text-center mt-4 text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-gym-primary hover:text-gym-accent">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
