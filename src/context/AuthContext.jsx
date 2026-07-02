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

  async function sendOtp(email) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existing) throw new Error('Este correo ya está registrado. Inicia sesión.')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw error
  }

  async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) throw error
    await loadProfile(data.user)
    return data
  }

  async function completeRegistration(password, fullName) {
    const { error: pwErr } = await supabase.auth.updateUser({ password })
    if (pwErr) throw pwErr

    if (!user) return
    const { error: profileErr } = await profileService.update(user.id, { full_name: fullName })
    if (profileErr) throw profileErr
    await loadProfile(user)
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isOwner = profile?.role === 'owner'
  const isCustomer = profile?.role === 'customer'

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, sendOtp, verifyOtp, completeRegistration, logout, isOwner, isCustomer }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
