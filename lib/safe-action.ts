import { createSafeActionClient } from 'next-safe-action'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Pass userId as null if not authenticated. Individual actions will validate if userId is required.
  const userId = user?.id || null; 

  return next({
    ctx: {
      userId: userId,
    },
  })
}) 