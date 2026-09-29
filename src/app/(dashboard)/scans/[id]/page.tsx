'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { SeverityBadge, StatusBadge, severityOrder } from '@/components/badges'

interface Finding {
  id: string
  severity: string
  category: string
  title: string
  description: string
  recommendation: string
  line: number | null
  source: string
}

interface Scan {
  id: string
  name: string
  type: string
  status: string
  summary: string | null
  content: string
  createdAt: string
  findings: Finding[]
  user: { name: string }
}

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [scan, setScan] = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const router = useRouter()

  const fetchScan = () => {
    fetch(`/api/scans/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setScan(data.scan)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchScan()
  }, [id])

  const runScan = async () => {
    setRunning(true)
    await fetch(`/api/scans/${id}/run`, { method: 'POST' })
    setRunning(false)
    fetchScan()
  }

  const deleteScan = async () => {
    if (!confirm('Delete this scan and all its findings?')) return
    await fetch(`/api/scans/${id}`, { method: 'DELETE' })
    router.push('/scans')
  }

  if (loading) {
    return <div className="text-slate-500 py-12 text-center">Loading…</div>
  }

  if (!scan) {
    return <div className="text-slate-500 py-12 text-center">Scan not found</div>
  }

  const sortedFindings = [...scan.findings].sort(
    (a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
  )

  const counts = scan.findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{scan.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={scan.status} />
            <span className="text-xs text-slate-500">{scan.type}</span>
            <span className="text-xs text-slate-500">
              by {scan.user?.name} · {new Date(scan.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(scan.status === 'PENDING' || scan.status === 'FAILED') && (
            <button
              onClick={runScan}
              disabled={running}
              className="px-4 py-2 rounded-lg bg-brand-500 text-slate-950 font-medium text-sm hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {running ? 'Running…' : 'Run Scan'}
            </button>
          )}
          <button
            onClick={deleteScan}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {scan.summary && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Summary</div>
          <p className="text-sm text-slate-300">{scan.summary}</p>
        </div>
      )}

      {scan.findings.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(
            (sev) =>
              counts[sev] && (
                <div key={sev} className="flex items-center gap-1.5">
                  <SeverityBadge severity={sev} />
                  <span className="text-sm text-slate-400">{counts[sev]}</span>
                </div>
              )
          )}
        </div>
      )}

      <div className="space-y-3">
        {sortedFindings.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-500 text-sm">
              {scan.status === 'COMPLETED'
                ? 'No findings detected. Content looks clean!'
                : 'Run the scan to see results.'}
            </p>
          </div>
        ) : (
          sortedFindings.map((finding) => (
            <div key={finding.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={finding.severity} />
                  <h3 className="text-sm font-semibold text-slate-200">{finding.title}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {finding.line && (
                    <span className="text-xs text-slate-500">Line {finding.line}</span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                    finding.source === 'AI' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {finding.source}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-2">{finding.category}</div>
              <p className="text-sm text-slate-400 mb-3">{finding.description}</p>
              <div className="flex gap-2 items-start">
                <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-slate-300">{finding.recommendation}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
