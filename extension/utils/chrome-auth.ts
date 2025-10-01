/**
 * Chrome Identity API Authentication Utilities
 * Semantic approach to Chrome extension authentication
 */

import * as React from "react";

export interface ChromeUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: ChromeUser | null;
  loading: boolean;
  error: string | null;
}

class ChromeAuthManager {
  private static instance: ChromeAuthManager;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): ChromeAuthManager {
    if (!ChromeAuthManager.instance) {
      ChromeAuthManager.instance = new ChromeAuthManager();
    }
    return ChromeAuthManager.instance;
  }

  private constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Check if we have a cached token
      const cachedToken = await this.getCachedToken();
      if (cachedToken) {
        const user = await this.getUserInfo(cachedToken);
        if (user) {
          this.updateAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
          return;
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
    }

    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  }

  private async getCachedToken(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!chrome?.identity?.getAuthToken) {
        resolve(null);
        return;
      }

      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(token || null);
        }
      });
    });
  }

  private async getAuthToken(interactive: boolean = true): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!chrome?.identity?.getAuthToken) {
        reject(new Error("Chrome Identity API not available"));
        return;
      }

      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!token) {
          reject(new Error("No token received"));
        } else {
          resolve(token);
        }
      });
    });
  }

  private async getUserInfo(token: string): Promise<ChromeUser | null> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const data = await response.json();

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
      };
    } catch (error) {
      console.error("Failed to get user info:", error);
      return null;
    }
  }

  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.authState));
  }

  public async signIn(): Promise<void> {
    this.updateAuthState({ loading: true, error: null });

    try {
      const token = await this.getAuthToken(true);
      const user = await this.getUserInfo(token);

      if (!user) {
        throw new Error("Failed to get user information");
      }

      this.updateAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      const token = await this.getCachedToken();
      if (token) {
        // Revoke the token
        chrome.identity.removeCachedAuthToken({ token }, () => {
          // Token removed from cache
        });
      }

      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Still update state even if there's an error
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    }
  }

  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Export singleton instance
export const chromeAuth = ChromeAuthManager.getInstance();

// React hook for authentication state
export function useAuth(): AuthState & {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [authState, setAuthState] = React.useState<AuthState>(
    chromeAuth.getAuthState(),
  );

  React.useEffect(() => {
    const unsubscribe = chromeAuth.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    signIn: chromeAuth.signIn.bind(chromeAuth),
    signOut: chromeAuth.signOut.bind(chromeAuth),
  };
}
