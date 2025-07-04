import NextAuth, { DefaultSession } from "next-auth"
import { JWT as NextAuthJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      accessToken?: string
      refreshToken?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: string
    accessToken?: string
    refreshToken?: string
  }
} 