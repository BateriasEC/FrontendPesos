import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@rubix.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-b from-black/40 to-brand-dark">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-xl">
        <div className="flex flex-col items-center gap-2 mb-4">
          <img src="/logorubix-removebg-preview.png" alt="Rubix" className="block m-0 w-40 h-auto object-contain" />
          <h1 className="text-2xl font-bold leading-none m-0">SOP-08 · Rubix</h1>
          <p className="text-sm text-gray-300">Portal de Control Integrado de Pesajes</p>
        </div>

        <div className="mt-2">
          <label className="block text-sm mb-1">Correo</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@empresa.com"
            autoComplete="username"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm mb-1">Contraseña</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-black"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}

        <div className="mt-5 flex items-center justify-between text-xs text-gray-300">
          <label className="inline-flex items-center gap-2 select-none">
            <input type="checkbox" className="accent-brand-orange" />
            Recuérdame
          </label>
          <a className="hover:underline" href="#">¿Olvidaste tu contraseña?</a>
        </div>

        <button disabled={loading} className="mt-4 w-full btn btn-primary text-base py-2.5 shadow hover:shadow-brand-orange/30">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="mt-5 text-xs text-gray-300 bg-black/30 border border-white/10 rounded p-3">
          <div className="font-semibold mb-1">Credenciales demo</div>
          <div>Admin: admin@rubix.com / admin123</div>
          <div>Supervisor: super@rubix.com / super123</div>
          <div>Operador: oper@rubix.com / oper123</div>
        </div>
      </form>
    </div>
  )
}


