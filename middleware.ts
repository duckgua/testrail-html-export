export { auth as middleware } from '@/auth'

export const config = {
  // Protect all routes except Next.js internals and auth API
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|api/testrail/image-proxy).*)'],
}
