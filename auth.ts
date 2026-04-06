import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { upsertUser } from '@/lib/users'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.id && user.email) {
        await upsertUser({
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          image: user.image,
          provider: 'google',
        })
      }
      return true
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
