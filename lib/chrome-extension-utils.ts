/**
 * Chrome Extension Utilities
 * Safely handle Chrome extension APIs with fallbacks for web environment
 */

export const isExtension = () => {
  return typeof (globalThis as any).chrome !== 'undefined' && 
         (globalThis as any).chrome.runtime && 
         (globalThis as any).chrome.runtime.id;
};

export const getExtensionId = (): string | null => {
  if (isExtension()) {
    return (globalThis as any).chrome.runtime.id;
  }
  return null;
};

export const getExtensionUrl = (path: string = ''): string => {
  if (isExtension()) {
    return (globalThis as any).chrome.runtime.getURL(path);
  }
  // Fallback for web environment
  return path.startsWith('/') ? path : `/${path}`;
};

export const sendMessage = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (isExtension()) {
      (globalThis as any).chrome.runtime.sendMessage(message, (response) => {
        if ((globalThis as any).chrome.runtime.lastError) {
          reject((globalThis as any).chrome.runtime.lastError);
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

export const getStorage = (key: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (isExtension()) {
      (globalThis as any).chrome.storage.local.get([key], (result) => {
        if ((globalThis as any).chrome.runtime.lastError) {
          reject((globalThis as any).chrome.runtime.lastError);
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

export const setStorage = (key: string, value: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isExtension()) {
      (globalThis as any).chrome.storage.local.set({ [key]: value }, () => {
        if ((globalThis as any).chrome.runtime.lastError) {
          reject((globalThis as any).chrome.runtime.lastError);
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
  if (isExtension()) {
    (globalThis as any).chrome.runtime.openOptionsPage();
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

export const getAudioFromExtensionStorage = async (key: string): Promise<Blob | null> => {
  if (!isExtension()) {
    return null;
  }

  try {
    const audioData = await getStorage(key);
    if (!audioData || !audioData.data) {
      return null;
    }

    // Convert base64 back to blob
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