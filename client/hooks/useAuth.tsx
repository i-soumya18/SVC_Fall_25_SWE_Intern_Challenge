import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // Only update state if component is still mounted
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user || null)
        }
      } catch (error) {
        console.error('Failed to get initial session:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only update state if component is still mounted
        if (!mounted) return

        console.log('Auth state changed:', event, session)
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithMagicLink = async (email: string) => {
    // Use environment variable for site URL or fall back to current origin
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: siteUrl,
      },
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setSession(null)
    }
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signInWithMagicLink,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
