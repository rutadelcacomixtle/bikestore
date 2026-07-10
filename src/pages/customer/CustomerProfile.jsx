import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { profileService } from '@/lib/supabase'

export default function CustomerProfile() {
  const { profile, user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone:     '',
    email:     '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      phone:     profile.phone     ?? '',
      email:     profile.email     ?? '',
    })
  }, [profile])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setSaving(true)
    try {
      await profileService.updateProfileRpc(
        user.id,
        form.full_name,
        form.phone || null,
        form.email || null,
      )
      setMessage('Datos guardados correctamente')
    } catch (err) {
      if (err.message?.includes('duplicate key') || err.code === '23505') {
        setMessage('Este número de teléfono ya está registrado por otro usuario')
      } else {
        setMessage('Error al guardar: ' + err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center text-lg font-bold">
          {profile?.full_name ? (
            (() => {
              const parts = profile.full_name.trim().split(/\s+/)
              return parts.length >= 2
                ? (parts[0][0] + parts[1][0]).toUpperCase()
                : profile.full_name.slice(0, 2).toUpperCase()
            })()
          ) : (
            <User size={20} />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-500 capitalize">{profile?.role === 'owner' ? 'Dueño' : 'Cliente'}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3 mb-8">
        <Input label="Nombre completo" value={form.full_name} onChange={set('full_name')} required />
        <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} readOnly={!!profile?.phone} tabIndex={profile?.phone ? -1 : undefined} className={profile?.phone ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''} />
        <Input label="Correo" type="email" value={form.email} readOnly tabIndex={-1} className="bg-gray-50 text-gray-400 cursor-not-allowed" />

        {message && (
          <p className={`text-sm rounded-lg px-3 py-2 ${message.startsWith('Error') ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
            {message}
          </p>
        )}

        <Button type="submit" loading={saving} className="w-full">
          Guardar cambios
        </Button>
      </form>

      <div className="border-t border-gray-100 pt-6">
        <Button
          type="button"
          variant="danger"
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
