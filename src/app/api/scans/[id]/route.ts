import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await context.params
  const scan = await prisma.scan.findFirst({
    where: { id, workspaceId: user.workspaceId },
    include: { findings: { orderBy: { severity: 'asc' } }, user: { select: { name: true } } },
  })

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  return NextResponse.json({ scan })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Viewers cannot delete scans' }, { status: 403 })
  }

  const { id } = await context.params
  const scan = await prisma.scan.findFirst({ where: { id, workspaceId: user.workspaceId } })
  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  await prisma.scan.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
