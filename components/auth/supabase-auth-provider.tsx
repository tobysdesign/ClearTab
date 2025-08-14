'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { storeSession, removeSession } from '@/lib/session-store'

interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (provider: 'google') => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

interface SupabaseAuthProviderProps {
  children: React.ReactNode
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a stored session ID
    const storedSessionId = localStorage.getItem('session_id')
    
    if (storedSessionId) {
      // We have a session ID - try to use stored session
      // For now, still need to validate with Supabase once
      const initSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (session && session.user) {
            // Store the session for future API calls
            storeSession(storedSessionId, session.user, session)
            setSession(session)
            setUser(session.user)
          } else {
            // Invalid session, remove it
            localStorage.removeItem('session_id')
            removeSession(storedSessionId)
            setSession(null)
            setUser(null)
          }
        } catch (error) {
          // Auth failed, clean up
          localStorage.removeItem('session_id')
          if (storedSessionId) removeSession(storedSessionId)
          setSession(null)
          setUser(null)
        }
        setLoading(false)
      }
      
      initSession()
    } else {
      // No stored session
      setSession(null)
      setUser(null)
      setLoading(false)
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Create user record on sign in if it doesn't exist
      if (event === 'SIGNED_IN' && session?.user) {
        // Generate and store session ID
        const sessionId = crypto.randomUUID()
        localStorage.setItem('session_id', sessionId)
        storeSession(sessionId, session.user, session)
        
        console.log('SIGNED_IN event - Session stored with ID:', sessionId);
        
        try {
          // Check if user exists in database
          const { data: existingUser } = await supabase
            .from('user')
            .select('id')
            .eq('id', session.user.id)
            .single()
          
          // Check if this Google login includes calendar access
          const provider_token = session.provider_token
          const provider_refresh_token = session.provider_refresh_token
          const hasCalendarAccess = provider_token && session.user.app_metadata?.provider === 'google'
          
          console.log('Auth debug:', {
            existingUser: !!existingUser,
            hasCalendarAccess,
            provider_token: provider_token ? 'present' : 'missing',
            provider_refresh_token: provider_refresh_token ? 'present' : 'missing'
          });
          
          // If user doesn't exist, create them
          if (!existingUser) {
            console.log('Creating new user with calendar access:', hasCalendarAccess);
            const { error: insertError } = await supabase
              .from('user')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
                google_id: session.user.user_metadata?.provider_id,
                google_calendar_connected: hasCalendarAccess,
                access_token: provider_token || null,
                refresh_token: provider_refresh_token || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            if (insertError) {
              console.error('Error creating user record:', insertError)
            } else {
              console.log('User created successfully with calendar connected:', hasCalendarAccess);
            }
          } else if (hasCalendarAccess) {
            console.log('Updating existing user with calendar tokens');
            // Update existing user with calendar tokens
            const { error: updateError } = await supabase
              .from('user')
              .update({
                google_calendar_connected: true,
                access_token: provider_token,
                refresh_token: provider_refresh_token,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id)
            
            if (updateError) {
              console.error('Error updating user with calendar access:', updateError)
            } else {
              console.log('User updated successfully with calendar tokens');
            }
          } else {
            console.log('No calendar access detected - not updating tokens');
          }
        } catch (error) {
          console.error('Error handling user creation:', error)
        }
        
        // Redirect to main page when user signs in
        if (window.location.pathname === '/login') {
          window.location.href = '/'
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      },
    })
    if (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    // Clean up stored session
    const sessionId = localStorage.getItem('session_id')
    if (sessionId) {
      removeSession(sessionId)
      localStorage.removeItem('session_id')
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    signIn,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}