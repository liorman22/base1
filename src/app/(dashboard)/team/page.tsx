'use client'

import { useState, useEffect } from 'react'

interface Member {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Add member form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('ANALYST')
  const [msg, setMsg] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchMembers = () => {
    fetch('/api/team')
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members || [])
        setCurrentUserId(data.currentUserId)
        setIsAdmin(data.members?.find((m: Member) => m.id === data.currentUserId)?.role === 'ADMIN')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setAdding(true)
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail, role: newRole }),
    })
    setAdding(false)
    if (res.ok) {
      const data = await res.json()
      setMsg(`Added ${data.member.name}. Temporary password: ${data.tempPassword}`)
      setNewName('')
      setNewEmail('')
      fetchMembers()
    } else {
      const data = await res.json()
      setMsg(data.error || 'Failed to add member')
    }
  }

  const changeRole = async (userId: string, role: string) => {
    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    if (res.ok) fetchMembers()
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this team member?')) return
    const res = await fetch(`/api/team?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) fetchMembers()
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
    ANALYST: 'bg-green-500/10 text-green-400 border-green-500/30',
    VIEWER: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Team</h1>
      <p className="text-sm text-slate-500 mb-8">Manage workspace members and roles</p>

      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 max-w-2xl">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Add Member</h2>
          {msg && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-sm text-brand-300">
              {msg}
            </div>
          )}
          <form onSubmit={addMember} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                placeholder="John Doe"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="ADMIN">Admin</option>
                <option value="ANALYST">Analyst</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 rounded-lg bg-brand-500 text-slate-950 font-medium text-sm hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-slate-500">Loading…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                {isAdmin && <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-slate-200">
                      {m.name}
                      {m.id === currentUserId && <span className="text-xs text-slate-500 ml-2">(you)</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">{m.email}</td>
                  <td className="px-5 py-3">
                    {isAdmin && m.id !== currentUserId ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value)}
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${roleColors[m.role] || roleColors.VIEWER} bg-transparent`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${roleColors[m.role] || roleColors.VIEWER}`}>
                        {m.role}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      {m.id !== currentUserId && (
                        <button
                          onClick={() => removeMember(m.id)}
                          className="text-sm text-slate-500 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
