import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, profileService } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (u) => {
    if (!u) { setProfile(null); return null }
    const p = await profileService.get(u.id)
    setProfile(p)
    return p
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const p = await profileService.get(data.user.id)
    setUser(data.user)
    setProfile(p)
    return { user: data.user, profile: p }
  }

  const register = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    // Si Supabase requiere confirmación, identities viene vacío o sin email_confirmed_at
    const needsConfirmation = !data.session
    return { user: data.user, profile: null, needsConfirmation }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isOwner = profile?.role === 'owner'
  const isCustomer = profile?.role === 'customer'

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, register, logout, isOwner, isCustomer }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
