import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { profile } = await login(form.email, form.password)
        navigate(profile?.role === 'owner' ? '/owner/dashboard' : '/my-bikes', { replace: true })
      } else {
        const { needsConfirmation } = await register(form.email, form.password, form.name)
        if (needsConfirmation) {
          setEmailSent(true)
        } else {
          navigate('/my-bikes', { replace: true })
        }
      }
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="flex flex-col items-center mb-4">
            <div className="bg-blue-700 text-white rounded-xl p-3 mb-3">
              <Bike size={28} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Revisa tu correo</h1>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Te enviamos un enlace de confirmación a <strong>{form.email}</strong>.
            Ábrelo para activar tu cuenta.
          </p>
          <button
            onClick={() => { setEmailSent(false); setMode('login') }}
            className="text-sm text-blue-700 underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-700 text-white rounded-xl p-3 mb-3">
            <Bike size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">CharlsBikes</h1>
          <p className="text-sm text-gray-500">Taller de bicicletas</p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <Input
              label="Nombre completo"
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Juan Pérez"
              required
            />
          )}
          <Input
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="correo@ejemplo.com"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••"
            minLength={6}
            required
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <Button type="submit" loading={loading} className="mt-1 w-full" size="lg">
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
