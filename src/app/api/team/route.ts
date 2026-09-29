import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const members = await prisma.user.findMany({
    where: { workspaceId: user.workspaceId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ members, currentUserId: user.id })
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can manage team members' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, role } = body

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'Email, name, and role are required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  // Create with a random temp password — the user can reset later
  const bcrypt = await import('bcryptjs')
  const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const newMember = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      role,
      passwordHash,
      workspaceId: user.workspaceId,
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json({ member: newMember, tempPassword }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, role } = body

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
  }

  const member = await prisma.user.findFirst({ where: { id: userId, workspaceId: user.workspaceId } })
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  await prisma.user.update({ where: { id: userId }, data: { role } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
  }

  const member = await prisma.user.findFirst({ where: { id: userId, workspaceId: user.workspaceId } })
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
