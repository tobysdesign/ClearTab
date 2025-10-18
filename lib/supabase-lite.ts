/**
 * Ultra-lightweight Supabase client for Chrome extensions
 * Replaces 6MB @supabase packages with ~2KB of direct HTTP calls
 * Only implements the essential auth and database operations we actually use
 */

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  };
}

export interface SupabaseAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  };
}

export interface SupabaseError {
  message: string;
  error_description?: string;
  error?: string;
}

class SupabaseLiteClient {
  private baseUrl: string;
  private apiKey: string;
  private session: SupabaseSession | null = null;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.baseUrl = supabaseUrl;
    this.apiKey = supabaseAnonKey;
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage() {
    try {
      const sessionData = localStorage.getItem('supabase.auth.token');
      if (sessionData) {
        this.session = JSON.parse(sessionData);
      }
    } catch {
      // Ignore parsing errors
    }
  }

  private saveSessionToStorage() {
    try {
      if (this.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(this.session));
      } else {
        localStorage.removeItem('supabase.auth.token');
      }
    } catch {
      // Ignore storage errors
    }
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      ...options.headers as Record<string, string>,
    };

    if (this.session?.access_token) {
      headers['Authorization'] = `Bearer ${this.session.access_token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData: SupabaseError = await response.json();
        errorMessage = errorData.message || errorData.error_description || errorMessage;
      } catch {
        // Use the original error message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth methods
  async signInWithPassword(email: string, password: string): Promise<SupabaseAuthResponse> {
    const response = await this.makeAuthenticatedRequest<SupabaseAuthResponse>(
      '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    this.session = {
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      expires_at: Date.now() + (response.expires_in * 1000),
      user: response.user,
    };
    this.saveSessionToStorage();

    return response;
  }

  async signUp(email: string, password: string): Promise<SupabaseAuthResponse> {
    const response = await this.makeAuthenticatedRequest<SupabaseAuthResponse>(
      '/auth/v1/signup',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    this.session = {
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      expires_at: Date.now() + (response.expires_in * 1000),
      user: response.user,
    };
    this.saveSessionToStorage();

    return response;
  }

  async signOut(): Promise<void> {
    if (this.session?.access_token) {
      try {
        await this.makeAuthenticatedRequest('/auth/v1/logout', {
          method: 'POST',
        });
      } catch {
        // Ignore logout errors, clear session anyway
      }
    }

    this.session = null;
    this.saveSessionToStorage();
  }

  async refreshSession(): Promise<SupabaseAuthResponse | null> {
    if (!this.session?.refresh_token) {
      return null;
    }

    try {
      const response = await this.makeAuthenticatedRequest<SupabaseAuthResponse>(
        '/auth/v1/token?grant_type=refresh_token',
        {
          method: 'POST',
          body: JSON.stringify({ refresh_token: this.session.refresh_token }),
        }
      );

      this.session = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: Date.now() + (response.expires_in * 1000),
        user: response.user,
      };
      this.saveSessionToStorage();

      return response;
    } catch (error) {
      // If refresh fails, clear the session
      this.session = null;
      this.saveSessionToStorage();
      throw error;
    }
  }

  getSession(): SupabaseSession | null {
    return this.session;
  }

  getUser() {
    return this.session?.user || null;
  }

  // Database methods
  async query<T = any>(
    table: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
    queryParams?: Record<string, string>
  ): Promise<T[]> {
    let endpoint = `/rest/v1/${table}`;

    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      endpoint += `?${params}`;
    }

    const options: RequestInit = {
      method,
      headers: {
        'Prefer': 'return=representation',
      },
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    return this.makeAuthenticatedRequest<T[]>(endpoint, options);
  }

  // Simplified table interface
  from(table: string) {
    return {
      select: async (columns = '*') => {
        const params = columns !== '*' ? { select: columns } : {};
        return this.query(table, 'GET', undefined, params);
      },

      insert: async (data: any) => {
        return this.query(table, 'POST', data);
      },

      update: async (data: any, filter?: string) => {
        const params = filter ? { filter } : {};
        return this.query(table, 'PATCH', data, params);
      },

      delete: async (filter?: string) => {
        const params = filter ? { filter } : {};
        return this.query(table, 'DELETE', undefined, params);
      },
    };
  }
}

// Factory function for creating the client
export function createSupabaseLiteClient(supabaseUrl: string, supabaseAnonKey: string) {
  return new SupabaseLiteClient(supabaseUrl, supabaseAnonKey);
}

// Extension-specific client factory
export function createExtensionClient() {
  // Get environment variables from either process.env or window.__EXTENSION_ENV__
  const getEnvVar = (key: string): string => {
    if (typeof window !== 'undefined' && (window as any).__EXTENSION_ENV__) {
      return (window as any).__EXTENSION_ENV__[key] || '';
    }
    return process.env[key] || '';
  };

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not available in extension');
    return null;
  }

  return createSupabaseLiteClient(supabaseUrl, supabaseAnonKey);
}