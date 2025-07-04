'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  isInitialized: boolean
  userName: string
  agentName: string
  hasSeenOnboarding: boolean
  onboardingStep: 'welcome' | 'agent-name' | 'user-name' | 'setup-complete' | null
}

interface SettingsActions {
  setUserName: (name: string) => void
  setAgentName: (name: string) => void
  finishInitialization: () => void
  setOnboardingStep: (step: SettingsState['onboardingStep']) => void
  completeOnboarding: (names: {userName: string, agentName: string}) => void
}

type Store = SettingsState & SettingsActions

export const useSettings = create<Store>()(
  persist(
    (set) => ({
      isInitialized: false,
      userName: 'there',
      agentName: 'Alex',
      hasSeenOnboarding: false,
      onboardingStep: null,
      setUserName: (name: string) => set({ userName: name }),
      setAgentName: (name: string) => set({ agentName: name }),
      finishInitialization: () => set({ isInitialized: true }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: (names) => set({ 
        hasSeenOnboarding: true, 
        onboardingStep: null,
        userName: names.userName,
        agentName: names.agentName,
      }),
    }),
    {
      name: 'agent-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userName: state.userName,
        agentName: state.agentName,
        isInitialized: state.isInitialized,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
) 