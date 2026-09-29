import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // First user becomes admin of a new workspace; subsequent users join default workspace as analysts
    const userCount = await prisma.user.count()
    let workspaceId: string

    if (userCount === 0) {
      const workspace = await prisma.workspace.create({ data: { name: `${name}'s Workspace` } })
      workspaceId = workspace.id
    } else {
      const defaultWs = await prisma.workspace.findFirst()
      workspaceId = defaultWs?.id || (await prisma.workspace.create({ data: { name: 'Default Workspace' } })).id
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: userCount === 0 ? 'ADMIN' : 'ANALYST',
        workspaceId,
      },
    })

    const token = await createToken(user.id)
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
