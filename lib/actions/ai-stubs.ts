// AI action stubs for Chrome extension build
// These replace AI server actions that don't work in static extension environment

interface AiResponse {
  response: string;
  onboardingStep?: number;
}

interface ChatData {
  message: string;
}

interface GenerateData {
  response: string;
}

export const askAi = async (
  _userMessage?: string,
  hasSeenOnboarding?: boolean,
  _onboardingStep?: number,
  _userName?: string,
  _agentName?: string
): Promise<{ success: boolean; data: AiResponse; serverError: string | null }> => {
  return {
    success: true,
    data: {
      response: "AI features require web app. Please use the full web version for AI chat.",
      onboardingStep: hasSeenOnboarding ? undefined : 1
    },
    serverError: null,
  };
};

export const submitChat = async (_input?: Record<string, unknown>): Promise<{ data: ChatData; serverError: string | null }> => {
  return {
    data: { message: "AI chat not available in extension mode" },
    serverError: null,
  };
};

export const generateResponse = async (_input?: Record<string, unknown>): Promise<{ data: GenerateData; serverError: string | null }> => {
  return {
    data: { response: "AI features require web app" },
    serverError: null,
  };
};
