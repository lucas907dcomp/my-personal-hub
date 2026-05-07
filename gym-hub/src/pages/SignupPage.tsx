import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { AuthForm } from '../components/AuthForm'

export function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(email: string, password: string) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
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
          <p className="text-slate-400 mt-1 text-sm">Create your account</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
          <AuthForm mode="signup" onSubmit={handleSignup} error={error} loading={loading} />
        </div>

        <p className="text-center mt-4 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-gym-primary hover:text-gym-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
