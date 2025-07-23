import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/server/db"
import { user } from "@/shared/schema"
import { eq } from "drizzle-orm"

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user: callbackUser, account }) {
      if (account) { // Handle both sign-in and token refresh
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        if (callbackUser) { // On initial sign-in
          token.id = callbackUser.id; // Persist our internal ID
          
          // The adapter has already created the user, now we ensure Google data is there.
          await db
            .update(user)
            .set({
              googleId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              googleCalendarConnected: true,
            })
            .where(eq(user.id, callbackUser.id));
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 