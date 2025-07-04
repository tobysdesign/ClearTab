'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type OnboardingStep = 'welcome' | 'agent-name' | 'user-name' | 'setup-complete' | null;

export async function getChatCompletion(
  options: OpenAI.Chat.Completions.ChatCompletionCreateParams
) {
  return await openai.chat.completions.create(options)
}

export async function getOnboardingCompletion(prompt: string, step: OnboardingStep) {
  switch (step) {
    case null: // This is the entry point
        return { 
            data: "Welcome! I'm your new AI assistant. To get started, what would you like to call me?",
            onboardingStep: 'agent-name' as OnboardingStep
        }

    case 'agent-name':
        return {
            data: `Great, you can call me ${prompt}! And what should I call you?`,
            onboardingStep: 'user-name' as OnboardingStep
        }

    case 'user-name':
        return {
            data: `Nice to meet you, ${prompt}! I've been configured to help you with tasks and notes. Just use #task or #note in your messages. We can set up more integrations later. For now, you're all set!`,
            onboardingStep: 'setup-complete' as OnboardingStep,
            setupComplete: true,
        }
        
    default:
        return { error: 'Invalid onboarding step' }
  }
} 