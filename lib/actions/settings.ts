// Stub implementations for Chrome extension build
// These replace server actions that don't work in static extension environment

interface PaydaySettings {
  [key: string]: unknown;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  serverError: string | null;
}

interface AiResponse {
  success: boolean;
  data: {
    response: string;
    onboardingStep?: number;
  };
  serverError: string | null;
}

export const getPaydaySettings = async (
  _input?: PaydaySettings,
): Promise<ApiResponse<PaydaySettings>> => {
  // In extension, get from Chrome storage instead of database
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["paydaySettings"], (result) => {
        resolve({
          data: result.paydaySettings || null,
          serverError: null,
        });
      });
    } else {
      resolve({
        data: null,
        serverError: null,
      });
    }
  });
};

export const savePaydaySettings = async (
  input?: PaydaySettings,
): Promise<ApiResponse<PaydaySettings>> => {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ paydaySettings: input }, () => {
        resolve({
          data: input,
          serverError: null,
        });
      });
    } else {
      resolve({
        data: input,
        serverError: null,
      });
    }
  });
};

export const saveApiKey = async (
  input?: string,
): Promise<ApiResponse<{ success: boolean }>> => {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ apiKey: input }, () => {
        resolve({
          data: { success: true },
          serverError: null,
        });
      });
    } else {
      resolve({
        data: { success: true },
        serverError: null,
      });
    }
  });
};

// AI action stubs
export const submitChat = async (
  _input?: string,
): Promise<ApiResponse<{ message: string }>> => {
  return {
    data: { message: "AI chat not available in extension mode" },
    serverError: null,
  };
};

export const generateResponse = async (
  _input?: string,
): Promise<ApiResponse<{ response: string }>> => {
  return {
    data: { response: "AI features require web app" },
    serverError: null,
  };
};

export const askAi = async (
  _userMessage?: string,
  hasSeenOnboarding?: boolean,
  _onboardingStep?: number,
  _userName?: string,
  _agentName?: string,
): Promise<AiResponse> => {
  return {
    success: true,
    data: {
      response:
        "AI features require web app. Please use the full web version for AI chat.",
      onboardingStep: hasSeenOnboarding ? undefined : 1,
    },
    serverError: null,
  };
};
