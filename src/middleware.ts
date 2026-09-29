import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-change-me')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let API routes handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  // Redirect logged-in users away from login/register
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (token) {
      try {
        await jwtVerify(token, getSecret())
        return NextResponse.redirect(new URL('/', request.url))
      } catch {
        // invalid token — let them see the login page
      }
    }
    return NextResponse.next()
  }

  // Protect all other routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, getSecret())
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
