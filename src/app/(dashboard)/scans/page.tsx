'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/badges'

interface Scan {
  id: string
  name: string
  type: string
  status: string
  createdAt: string
  _count: { findings: number }
}

export default function ScansPage() {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Scans</h1>
          <p className="text-sm text-slate-500 mt-1">All security scans in your workspace</p>
        </div>
        <Link
          href="/scans/new"
          className="px-4 py-2 rounded-lg bg-brand-500 text-slate-950 font-medium text-sm hover:bg-brand-400 transition-colors"
        >
          New Scan
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-slate-500">Loading…</div>
        ) : scans.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-500 text-sm mb-3">No scans yet</p>
            <Link href="/scans/new" className="text-brand-400 text-sm hover:text-brand-300">
              Run your first scan →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Findings</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/scans/${scan.id}`} className="text-sm font-medium text-slate-200 hover:text-brand-400">
                      {scan.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">{scan.type}</td>
                  <td className="px-5 py-3 text-sm text-slate-400">{scan._count.findings}</td>
                  <td className="px-5 py-3"><StatusBadge status={scan.status} /></td>
                  <td className="px-5 py-3 text-sm text-slate-500">
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
