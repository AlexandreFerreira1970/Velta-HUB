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
      if (account?.provider === 'google' && account.providerAccountId && user.email) {
        await upsertUser({
          id: account.providerAccountId,
          email: user.email,
          name: user.name ?? '',
          image: user.image,
          provider: 'google',
        })
      }
      return true
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId
      }
      return token
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
