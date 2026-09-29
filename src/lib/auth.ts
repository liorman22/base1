import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-change-me')

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true, role: true, workspaceId: true },
  })
  return user
}

export async function getTokenFromRequest(request: Request): Promise<string | undefined> {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/token=([^;]+)/)
  return match?.[1]
}

export async function getUserFromRequest(request: Request) {
  const token = await getTokenFromRequest(request)
  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true, role: true, workspaceId: true },
  })
  return user
}
