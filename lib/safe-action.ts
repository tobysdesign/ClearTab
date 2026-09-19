import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/auth'

const handleServerError = (e: Error) => {
  console.error('Server action error:', e)
  return e.message || 'An unexpected error occurred'
}

const baseClient = createSafeActionClient({
  handleServerError,
})

export const action = baseClient.use(async ({ next }) => {
  const session = await auth()
  const userId = session?.user?.id || null

  // Pass userId as null if not authenticated. Individual actions will validate if userId is required.
  return next({
    ctx: {
      userId: userId,
    },
  })
})