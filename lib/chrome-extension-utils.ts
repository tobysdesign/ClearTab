/**
 * Chrome Extension Utilities
 * Safely handle Chrome extension APIs with fallbacks for web environment
 */

type ChromeApi = typeof chrome;

const getChromeApi = (): ChromeApi | null => {
  if (typeof globalThis !== 'undefined' && 'chrome' in globalThis) {
    return (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome ?? null;
  }
  return null;
};

export const isExtension = () => {
  const chrome = getChromeApi();
  return chrome?.runtime?.id !== undefined;
};

export const getExtensionId = (): string | null => {
  const chrome = getChromeApi();
  return chrome?.runtime?.id || null;
};

export const getExtensionUrl = (path: string = ''): string => {
  const chrome = getChromeApi();
  if (chrome?.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }
  // Fallback for web environment
  return path.startsWith('/') ? path : `/${path}`;
};

export const sendMessage = (message: unknown): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const chrome = getChromeApi();
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    } else {
      // Fallback for web environment - could use postMessage or custom event system
      resolve(null);
    }
  });
};

export const getStorage = (key: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const chrome = getChromeApi();
    if (chrome?.storage?.local) {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    } else {
      // Fallback to localStorage for web
      try {
        const value = localStorage.getItem(key);
        resolve(value ? JSON.parse(value) : null);
      } catch (error) {
        reject(error);
      }
    }
  });
};

export const setStorage = (key: string, value: unknown): Promise<void> => {
  return new Promise((resolve, reject) => {
    const chrome = getChromeApi();
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } else {
      // Fallback to localStorage for web
      try {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      } catch (error) {
        reject(error);
      }
    }
  });
};

export const openOptionsPage = (): void => {
  const chrome = getChromeApi();
  if (chrome?.runtime?.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    // Fallback for web - could open settings page
    window.location.href = '/settings';
  }
};

// Chrome extension specific storage for audio files
export const saveAudioToExtensionStorage = async (audioBlob: Blob, filename: string): Promise<string | null> => {
  if (!isExtension()) {
    return null;
  }

  try {
    // Convert blob to base64 for Chrome storage
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const key = `audio_${filename}_${Date.now()}`;
          await setStorage(key, {
            data: base64Data,
            filename,
            timestamp: Date.now(),
            type: audioBlob.type
          });
          resolve(key);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error('Failed to save audio to extension storage:', error);
    return null;
  }
};

type StoredAudioPayload = { data?: string; filename?: string; timestamp?: number; type?: string } | null;

export const getAudioFromExtensionStorage = async (key: string): Promise<Blob | null> => {
  if (!isExtension()) {
    return null;
  }

  try {
    const audioData = (await getStorage(key)) as StoredAudioPayload;
    if (!audioData?.data) {
      return null;
    }

    const response = await fetch(audioData.data);
    return await response.blob();
  } catch (error) {
    console.error('Failed to retrieve audio from extension storage:', error);
    return null;
  }
};

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const extensionId = getExtensionId();
  
  return {
    isExtension: isExtension(),
    extensionId,
    baseUrl: isExtension() ? getExtensionUrl() : window.location.origin,
    storageType: isExtension() ? 'chrome-storage' : 'localStorage',
    canAccessFiles: isExtension(),
    // Chrome extensions have different CSP rules
    allowsEval: !isExtension(),
  };
};