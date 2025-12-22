'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  isInitialized: boolean
  userName: string
  agentName: string
  hasSeenOnboarding: boolean
  onboardingStep: 'welcome' | 'agent-name' | 'user-name' | 'setup-complete' | null
  chatHistoryRetentionDays: number
  hasDataConsent: boolean
  theme: 'light' | 'dark'
}

interface SettingsActions {
  setUserName: (name: string) => void
  setAgentName: (name: string) => void
  finishInitialization: () => void
  setOnboardingStep: (step: SettingsState['onboardingStep']) => void
  completeOnboarding: (names: {userName: string, agentName: string}) => void
  setChatHistoryRetentionDays: (days: number) => void
  setDataConsent: (consent: boolean) => void
  setTheme: (theme: SettingsState['theme']) => void
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
      chatHistoryRetentionDays: 3,
      hasDataConsent: false,
      theme: 'dark',
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
      setChatHistoryRetentionDays: (days) => set({ chatHistoryRetentionDays: days }),
      setDataConsent: (consent = true) => set({ hasDataConsent: consent }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'agent-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userName: state.userName,
        agentName: state.agentName,
        isInitialized: state.isInitialized,
        hasSeenOnboarding: state.hasSeenOnboarding,
        chatHistoryRetentionDays: state.chatHistoryRetentionDays,
        hasDataConsent: state.hasDataConsent,
        theme: state.theme,
      }),
    }
  )
) 