import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value
  
  // Check if accessing dashboard routes
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  
  // If accessing dashboard without token, redirect to login
  if (isDashboardRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If accessing login with token, check referer
  if (request.nextUrl.pathname === '/login' && token) {
    const referer = request.headers.get('referer')
    
    // Allow access to login if coming from non-dashboard pages (home, menu, etc)
    // Only redirect to dashboard if coming from dashboard or no referer
    if (referer) {
      const refererUrl = new URL(referer)
      const isFromDashboard = refererUrl.pathname.startsWith('/dashboard')
      
      // If coming from dashboard, redirect back to dashboard
      if (isFromDashboard) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      // If coming from other pages (home, menu, etc), allow login access
      return NextResponse.next()
    }
    
    // No referer (direct access), redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login'
  ]
}
