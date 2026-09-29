export const severityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  INFO: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

export const statusStyles: Record<string, string> = {
  PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  RUNNING: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
}

export function SeverityBadge({ severity }: { severity: string }) {
  const style = severityStyles[severity] || severityStyles.INFO
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {severity}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.PENDING
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {status}
    </span>
  )
}

export const severityOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
}
