// Chrome extension API type declarations
declare namespace chrome {
  namespace identity {
    interface TokenDetails {
      interactive?: boolean;
      account?: { id: string };
      scopes?: string[];
    }

    interface WebAuthFlowDetails {
      url: string;
      interactive?: boolean;
    }

    function getAuthToken(
      details: TokenDetails,
      callback: (token?: string) => void,
    ): void;

    function clearAllCachedAuthTokens(callback: () => void): void;

    function launchWebAuthFlow(
      details: WebAuthFlowDetails,
      callback: (responseUrl?: string) => void,
    ): void;
  }

  namespace runtime {
    interface LastError {
      message?: string;
    }

    const lastError: LastError | undefined;
  }

  namespace storage {
    interface StorageArea {
      get(
        keys?: string | string[] | { [key: string]: any } | null,
        callback?: (items: { [key: string]: any }) => void,
      ): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    }

    const local: StorageArea;
    const sync: StorageArea;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
    }

    function query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (tabs: Tab[]) => void,
    ): void;
  }
}
