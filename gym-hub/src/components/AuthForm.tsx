import { useState } from 'react'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (email: string, password: string) => Promise<void>
  error?: string
  loading?: boolean
}

export function AuthForm({ mode, onSubmit, error, loading }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError('')
    if (mode === 'signup' && password !== confirm) {
      setLocalError('Passwords do not match')
      return
    }
    await onSubmit(email, password)
  }

  const displayError = error || localError

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="text-base bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gym-primary"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-400">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="text-base bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gym-primary"
          placeholder="••••••••"
        />
      </div>

      {mode === 'signup' && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-400">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="text-base bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gym-primary"
            placeholder="••••••••"
          />
        </div>
      )}

      {displayError && (
        <p className="text-sm text-red-400">{displayError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 py-3 rounded-lg bg-gym-primary hover:bg-gym-accent text-white font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>
    </form>
  )
}
