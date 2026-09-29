'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/')
    } else {
      const data = await res.json()
      setError(data.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L3 7v6c0 5 3.5 9 9 11 5.5-2 9-6 9-11V7l-9-5z" /></svg>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100">SecFrame</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">AI Cyber Security Framework</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h1 className="text-xl font-semibold text-slate-100 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-5">Access your security workspace</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-500 text-slate-950 font-medium text-sm hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Demo accounts:</p>
            <div className="space-y-1 text-xs text-slate-400">
              <div>admin@example.com / admin123</div>
              <div>analyst@example.com / analyst123</div>
              <div>viewer@example.com / viewer123</div>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            No account?{' '}
            <a href="/register" className="text-brand-400 hover:text-brand-300">Register</a>
          </p>
        </div>
      </div>
    </div>
  )
}
