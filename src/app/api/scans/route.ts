import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const scans = await prisma.scan.findMany({
    where: { workspaceId: user.workspaceId },
    include: { _count: { select: { findings: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ scans })
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Viewers cannot create scans' }, { status: 403 })
  }

  const body = await request.json()
  const { name, type, content } = body

  if (!name || !type || !content) {
    return NextResponse.json({ error: 'Name, type, and content are required' }, { status: 400 })
  }

  const scan = await prisma.scan.create({
    data: {
      name,
      type,
      content,
      status: 'PENDING',
      workspaceId: user.workspaceId,
      userId: user.id,
    },
  })

  return NextResponse.json({ scan }, { status: 201 })
}
