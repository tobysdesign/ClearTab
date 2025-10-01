// AI action stubs for Chrome extension build
// These replace AI server actions that don't work in static extension environment

export const askAi = async (
  userMessage?: string,
  hasSeenOnboarding?: boolean,
  onboardingStep?: number,
  userName?: string,
  agentName?: string
): Promise<{ success: boolean; data: any; serverError: any }> => {
  return {
    success: true,
    data: {
      response: "AI features require web app. Please use the full web version for AI chat.",
      onboardingStep: hasSeenOnboarding ? undefined : 1
    },
    serverError: null,
  };
};

export const submitChat = async (input?: any): Promise<{ data: any; serverError: any }> => {
  return {
    data: { message: "AI chat not available in extension mode" },
    serverError: null,
  };
};

export const generateResponse = async (input?: any): Promise<{ data: any; serverError: any }> => {
  return {
    data: { response: "AI features require web app" },
    serverError: null,
  };
};
