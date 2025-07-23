'use server'

import { getChatCompletion } from '@/server/llm'
import type { OpenAI } from 'openai'
import { z } from 'zod'

type OnboardingStep = 'welcome' | 'agent-name' | 'user-name' | 'setup-complete' | null

interface AiResponse {
  success: boolean
  data?: {
    data?: string
    onboardingStep?: OnboardingStep
    setupComplete?: boolean
  }
  error?: string
}

const aiSchema = z.object({
  prompt: z.string().min(1),
  hasSeenOnboarding: z.boolean(),
  onboardingStep: z.enum(['welcome', 'agent-name', 'user-name', 'setup-complete']).nullable(),
  userName: z.string().optional(),
  agentName: z.string().optional(),
})

export async function askAi(
  prompt: string,
  hasSeenOnboarding: boolean,
  onboardingStep: OnboardingStep | null,
  userName?: string,
  agentName?: string
): Promise<AiResponse> {
  try {
    // Validate input
    const validatedInput = aiSchema.parse({
      prompt,
      hasSeenOnboarding,
      onboardingStep,
      userName,
      agentName,
    })

    if (!validatedInput.hasSeenOnboarding) {
      const onboardingResponse = await getChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: `You are ${agentName || 'a helpful assistant'}. You are talking to ${userName || 'a user'}.` },
          { role: 'user', content: validatedInput.prompt },
        ],
        stream: false,
      }) as OpenAI.Chat.ChatCompletion

      const message = onboardingResponse.choices[0]?.message?.content
      if (!message) {
        return {
          success: false,
          error: 'No response from AI.'
        }
      }

      return {
        success: true,
        data: {
          data: message
        }
      }
    }
    
    // Regular chat logic
    const response = await getChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `You are ${agentName || 'a helpful assistant'}. You are talking to ${userName || 'a user'}.` },
        { role: 'user', content: validatedInput.prompt },
      ],
      stream: false,
    }) as OpenAI.Chat.ChatCompletion

    const message = response.choices[0]?.message?.content
    if (!message) {
      return {
        success: false,
        error: 'No response from AI.'
      }
    }

    return {
      success: true,
      data: {
        data: message
      }
    }

  } catch (error) {
    console.error('Error in askAi:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
} 