import { createSafeActionClient } from 'next-safe-action'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionError'
  }
}

const handleServerError = (e: Error) => {
  console.error('Server action error:', e)
  return e.message || 'An unexpected error occurred'
}

const baseClient = createSafeActionClient({
  handleServerError,
})

export const action = baseClient.use(async ({ next }) => {
  const session = await getServerSession(authOptions)

  // Pass userId as null if not authenticated. Individual actions will validate if userId is required.
  const userId = session?.user?.id || null; 

  return next({
    ctx: {
      userId: userId,
    },
  })
}) 