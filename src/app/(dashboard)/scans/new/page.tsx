'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const scanTypes = [
  { value: 'CONFIG', label: 'Configuration File' },
  { value: 'CODE', label: 'Source Code' },
  { value: 'DOCKERFILE', label: 'Dockerfile' },
  { value: 'MANIFEST', label: 'Manifest / Deployment' },
  { value: 'GENERAL', label: 'General Text' },
]

const sampleContent = `# Example config with security issues
debug: true
api_key: sk-1234567890abcdef1234567890abcdef
password: admin123456
cors_origins: "*"
database_url: http://prod-db.internal:5432/myapp
ssl_version: TLSv1
`

export default function NewScanPage() {
  const [name, setName] = useState('')
  const [type, setType] = useState('CONFIG')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, content }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to create scan')
      setSubmitting(false)
      return
    }

    const { scan } = await res.json()

    // Run the scan immediately
    await fetch(`/api/scans/${scan.id}/run`, { method: 'POST' })
    router.push(`/scans/${scan.id}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-1">New Scan</h1>
      <p className="text-sm text-slate-500 mb-8">Submit content for security analysis</p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl">
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Scan Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              placeholder="Production config audit"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Content Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
            >
              {scanTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-400">Content to Scan</label>
              <button
                type="button"
                onClick={() => setContent(sampleContent)}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                Insert sample
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={14}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono focus:outline-none focus:border-brand-500 resize-y"
              placeholder="Paste your config, code, Dockerfile, or manifest here…"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-brand-500 text-slate-950 font-medium text-sm hover:bg-brand-400 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Running scan…' : 'Create & Run Scan'}
          </button>
        </form>
      </div>
    </div>
  )
}
