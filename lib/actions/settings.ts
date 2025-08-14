'use server'

import { z } from 'zod'
import { db } from '@/server/db'
import { userPreferences } from '@/shared/schema'
import { eq } from 'drizzle-orm'
import { action } from '@/lib/safe-action'

const apiKeySchema = z.object({
  apiKey: z.string().min(1),
})

const paydaySettingsSchema = z.object({
  paydayDate: z.coerce.date(),
  paydayFrequency: z.enum(['weekly', 'fortnightly', 'monthly']),
})

export const saveApiKey = action
  .inputSchema(apiKeySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await db
        .insert(userPreferences)
        .values({
          userId: ctx.userId,
          openaiApiKey: parsedInput.apiKey,
        } as typeof userPreferences.$inferInsert)
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            openaiApiKey: parsedInput.apiKey,
          } as Partial<typeof userPreferences.$inferInsert>,
        })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error('Error saving API key:', errorMessage)
      return { serverError: `Failed to save API key: ${errorMessage}` }
    }
  })

export const savePaydaySettings = action
  .inputSchema(paydaySettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await db
        .insert(userPreferences)
        .values({
          userId: ctx.userId,
          paydayDate: parsedInput.paydayDate,
          paydayFrequency: parsedInput.paydayFrequency,
        } as typeof userPreferences.$inferInsert)
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            paydayDate: parsedInput.paydayDate,
            paydayFrequency: parsedInput.paydayFrequency,
          } as Partial<typeof userPreferences.$inferInsert>,
        })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error('Error saving payday settings:', error)
      return { serverError: `Failed to save settings: ${errorMessage}` }
    }
  })

export const getApiKey = action.action(async ({ ctx }) => {
  try {
    const pref = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.userId),
    })

    return { apiKey: pref?.openaiApiKey }
  } catch (error) {
    throw new Error('Failed to get API key')
  }
})

export const getPaydaySettings = action.action(async ({ ctx }) => {
  try {
    const pref = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.userId),
    })

    return {
      paydayDate: pref?.paydayDate,
      paydayFrequency: pref?.paydayFrequency,
    }
  } catch (error) {
    throw new Error('Failed to get payday settings')
  }
}) 