import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no database imports)
export default {
  providers: [],
  pages: {
    // The landing page "/" is the sign-in surface now; "/login" is retired.
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // "/" is the public landing + sign-in; always allow it.
      if (nextUrl.pathname === '/') return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
