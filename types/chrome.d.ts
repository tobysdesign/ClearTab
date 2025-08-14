/**
 * Chrome Extension API Type Declarations
 * These are minimal types for the Chrome APIs we use
 */

declare global {
  interface Window {
    chrome?: typeof chrome;
  }
}

declare namespace chrome {
  namespace runtime {
    const id: string;
    function getURL(path: string): string;
    function sendMessage(message: any, responseCallback?: (response: any) => void): void;
    function openOptionsPage(): void;
    const lastError: chrome.runtime.LastError | undefined;
    
    interface LastError {
      message?: string;
    }
  }

  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    }

    const local: StorageArea;
    const sync: StorageArea;
    const session: StorageArea;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
      highlighted: boolean;
      pinned: boolean;
      audible?: boolean;
      discarded: boolean;
      autoDiscardable: boolean;
      mutedInfo?: MutedInfo;
      favIconUrl?: string;
      status?: string;
      incognito: boolean;
      width?: number;
      height?: number;
      sessionId?: string;
      windowId: number;
    }

    interface MutedInfo {
      muted: boolean;
      reason?: string;
      extensionId?: string;
    }

    function query(queryInfo: any, callback: (result: Tab[]) => void): void;
    function create(createProperties: any, callback?: (tab: Tab) => void): void;
    function update(tabId: number, updateProperties: any, callback?: (tab: Tab) => void): void;
    function remove(tabIds: number | number[], callback?: () => void): void;
  }
}

export {};