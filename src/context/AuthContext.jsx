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
      setLoading(true)
      loadProfile(session?.user ?? null).finally(() => setLoading(false))
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

  async function register(email, password, fullName) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existing) throw new Error('Este correo ya está registrado. Inicia sesión.')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error

    return data
  }

  async function verifySignupOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
    if (error) throw error

    const fullName = data.user?.user_metadata?.full_name ?? ''

    const { error: profileErr } = await supabase.rpc('create_profile', {
      p_id: data.user.id,
      p_email: email,
      p_full_name: fullName,
      p_role: 'customer',
    })
    if (profileErr) throw profileErr

    await loadProfile(data.user)
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isOwner = profile?.role === 'owner'
  const isCustomer = profile?.role === 'customer'

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, register, verifySignupOtp, logout, isOwner, isCustomer }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
