import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dbMinimal } from "@/lib/db-minimal";
import { user as userTable } from "@/shared/schema-tables";
import { googleApiService } from "@/lib/google-api-service";
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
        return token;
      }

      // Google access tokens last ~1 hour. Refresh them here (with a 60s buffer) so the
      // session never hands out a stale token and the calendar doesn't fall into "reconnect".
      const expiresAt = token.expiresAt as number | undefined;
      if (!token.refreshToken || !expiresAt || Date.now() < (expiresAt - 60) * 1000) {
        return token;
      }

      try {
        const refreshed = await googleApiService.refreshAccessToken(token.refreshToken as string);
        token.accessToken = refreshed.access_token;
        token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
        delete token.error;

        if (token.sub) {
          await dbMinimal
            .update(userTable)
            .set({
              accessToken: refreshed.access_token,
              tokenExpiry: new Date((token.expiresAt as number) * 1000),
              googleCalendarConnected: true,
            } as any)
            .where(eq(userTable.id, token.sub));
        }
        console.log("🔄 jwt: refreshed Google access token");
      } catch (error) {
        // Leave the old token in place; /api/calendar decides whether this needs reauthorising
        console.error("❌ jwt: Google token refresh failed:", error);
        token.error = "RefreshAccessTokenError";
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
