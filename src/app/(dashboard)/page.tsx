'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { StatusBadge, SeverityBadge, severityStyles } from '@/components/badges'

interface Scan {
  id: string
  name: string
  type: string
  status: string
  createdAt: string
  _count: { findings: number }
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scans')
      .then((r) => r.json())
      .then((data) => {
        setScans(data.scans || [])
        setLoading(false)
      })
  }, [])

  const totalScans = scans.length
  const completedScans = scans.filter((s) => s.status === 'COMPLETED').length
  const totalFindings = scans.reduce((sum, s) => sum + s._count.findings, 0)
  const recentScans = scans.slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Security posture overview</p>
        </div>
        <Link
          href="/scans/new"
          className="px-4 py-2 rounded-lg bg-brand-500 text-slate-950 font-medium text-sm hover:bg-brand-400 transition-colors"
        >
          New Scan
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Scans" value={totalScans} accent="text-brand-400" />
        <StatCard label="Completed Scans" value={completedScans} accent="text-green-400" />
        <StatCard label="Total Findings" value={totalFindings} accent="text-orange-400" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Recent Scans</h2>
        </div>
        {loading ? (
          <div className="px-5 py-12 text-center text-slate-500">Loading…</div>
        ) : recentScans.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-500 text-sm mb-3">No scans yet</p>
            <Link href="/scans/new" className="text-brand-400 text-sm hover:text-brand-300">
              Run your first scan →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentScans.map((scan) => (
              <Link
                key={scan.id}
                href={`/scans/${scan.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{scan.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {scan.type} · {new Date(scan.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {scan._count.findings > 0 && (
                    <span className="text-xs text-slate-400">{scan._count.findings} findings</span>
                  )}
                  <StatusBadge status={scan.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${accent}`}>{value}</div>
    </div>
  )
}
