// Stub implementations for Chrome extension build
// These replace server actions that don't work in static extension environment

export const getPaydaySettings = async (
  input?: any,
): Promise<{ data: any; serverError: any }> => {
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
  input?: any,
): Promise<{ data: any; serverError: any }> => {
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
  input?: any,
): Promise<{ data: any; serverError: any }> => {
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
  input?: any,
): Promise<{ data: any; serverError: any }> => {
  return {
    data: { message: "AI chat not available in extension mode" },
    serverError: null,
  };
};

export const generateResponse = async (
  input?: any,
): Promise<{ data: any; serverError: any }> => {
  return {
    data: { response: "AI features require web app" },
    serverError: null,
  };
};

export const askAi = async (
  userMessage?: string,
  hasSeenOnboarding?: boolean,
  onboardingStep?: number,
  userName?: string,
  agentName?: string,
): Promise<{ success: boolean; data: any; serverError: any }> => {
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
