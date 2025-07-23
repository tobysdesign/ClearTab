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

export async function getOnboardingCompletion(prompt: string, step: OnboardingStep, agentName?: string) {
  switch (step) {
    case null: // This is the entry point
        return { 
            data: "Welcome to t0.by! I'm your personal AI assistant. I can help you with notes, tasks, and much more. Would you like to give me a name?",
            onboardingStep: 'agent-name' as OnboardingStep
        }

    case 'agent-name':
        return {
            data: `Sounds good. What would you like me to call you?`,
            onboardingStep: 'user-name' as OnboardingStep
        }

    case 'user-name':
        return {
            data: `So ${agentName || 'I'} am great at helping you with you notes, and can even turn those notes into tasks. In fact any message you write to me with #note #notes or even ":Note this..." and ill create a note with the contents of that message.
            
Same goes with Tasks ${prompt}, If you put #task, #tasks or create a task to pay electricity bill" anywhere in a message from our chats and i'll go ahead and create a task for you.`,
            onboardingStep: 'setup-complete' as OnboardingStep,
            setupComplete: true,
        }
        
    default:
        return { error: 'Invalid onboarding step' }
  }
} 