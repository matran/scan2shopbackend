// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const isPublicPath = path === '/login' || path.startsWith('/api/mobile/auth/')

  // Get token from cookie or header
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // Redirect to login if accessing protected dashboard routes without token
  if (path.startsWith('/dashboard') && !token) {
   // return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (path === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*', '/login']
}