import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dbMinimal } from "@/lib/db-minimal";
import { user as userTable } from "@/shared/schema-tables";
import type { NextAuthConfig } from "next-auth";

export const config = {
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request both profile AND calendar scopes in one flow
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        if (token.sub) {
          try {
            await dbMinimal
              .update(userTable)
              .set({
                accessToken: account.access_token,
                ...(account.refresh_token ? { refreshToken: account.refresh_token } : {}),
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                googleCalendarConnected: true,
              } as any)
              .where(eq(userTable.id, token.sub));
          } catch (error) {
            console.error("Error saving calendar tokens to database in jwt callback:", error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.expiresAt = token.expiresAt as number;
        // Add user ID to session from JWT token SUB (subject) field
        if (token.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(config);
