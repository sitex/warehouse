import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string | null
  role: 'manager' | 'warehouse_worker'
  name: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithPin: (pin: string) => Promise<void>
  sendEmailOtp: (email: string) => Promise<void>
  verifyEmailOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize loading to false if supabase is not configured
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!!supabase)

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return

    console.log('AuthContext: Fetching profile for', userId)

    // Add timeout for profile fetch
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
    })

    try {
      const result = await Promise.race([
        supabase.from('users').select('*').eq('id', userId).single(),
        timeoutPromise
      ]) as { data: UserProfile | null; error: Error | null }

      if (result.error) {
        console.error('AuthContext: Error fetching profile:', result.error)
        setLoading(false)
        return
      }

      console.log('AuthContext: Profile fetched', result.data)
      setProfile(result.data)
    } catch (err) {
      console.error('AuthContext: Profile fetch failed:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) {
      console.log('AuthContext: Supabase not configured')
      return
    }

    console.log('AuthContext: Getting session...')

    // Add timeout to prevent hanging forever
    const timeoutId = setTimeout(() => {
      console.error('AuthContext: Session fetch timed out - check Supabase credentials')
      setLoading(false)
    }, 5000)

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeoutId)
        console.log('AuthContext: Session received', { hasSession: !!session, userId: session?.user?.id })
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        console.error('AuthContext: Error getting session:', error)
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed', { event, hasSession: !!session, userId: session?.user?.id })
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signInWithEmail(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function signInWithPin(pin: string) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    // Fetch all warehouse workers
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('id, email, pin_hash, role, name')
      .eq('role', 'warehouse_worker')

    if (fetchError) throw fetchError

    const workers = data as { id: string; email: string | null; pin_hash: string | null; role: string; name: string }[] | null

    if (!workers || workers.length === 0) {
      throw new Error('No workers found')
    }

    // Find worker with matching PIN
    let matchedWorkerEmail: string | null = null
    for (const worker of workers) {
      if (worker.pin_hash && bcrypt.compareSync(pin, worker.pin_hash)) {
        matchedWorkerEmail = worker.email
        break
      }
    }

    if (!matchedWorkerEmail) {
      throw new Error('Invalid PIN')
    }

    // Sign in with the worker's email and PIN as password
    const { error } = await supabase.auth.signInWithPassword({
      email: matchedWorkerEmail,
      password: pin,
    })

    if (error) throw error
  }

  async function sendEmailOtp(email: string) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })
    if (error) throw error
  }

  async function verifyEmailOtp(email: string, token: string) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
  }

  async function signOut() {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signInWithEmail,
      signInWithPin,
      sendEmailOtp,
      verifyEmailOtp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
