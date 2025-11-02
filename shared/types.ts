// Shared types used across the application
export interface ConnectedAccountWithEmail {
  id: string
  userId: string
  provider: string
  providerAccountId: string
  accessToken?: string | null
  refreshToken?: string | null
  tokenExpiry?: Date | null
  createdAt: Date
  updatedAt: Date
  email: string
}