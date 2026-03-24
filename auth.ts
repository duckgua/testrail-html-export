import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

const ADMIN_EMAIL = 'ff63945@gmail.com'

function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  // Admin is always allowed
  if (email === ADMIN_EMAIL) return true
  // Additional emails stored in Vercel env var as comma-separated list
  const extra = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return extra.includes(email.toLowerCase())
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/unauthorized',
  },
  callbacks: {
    // Called when user tries to sign in — return false to deny
    signIn({ user }) {
      return isAllowed(user.email)
    },
    // Called in middleware to decide if a request is authorized
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const pathname = nextUrl.pathname

      // Public paths that don't need authentication
      const isPublic =
        pathname.startsWith('/login') ||
        pathname.startsWith('/unauthorized')

      if (isPublic) return true
      if (!isLoggedIn) return false // Redirect to /login
      return true
    },
  },
})
