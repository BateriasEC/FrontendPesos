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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ backgroundColor: '#FDB71A' }}>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-2xl overflow-hidden shadow-2xl" style={{ border: '3px solid #EE3626' }}>
        {/* Sección izquierda - Imagen */}
        <div className="hidden lg:flex items-center justify-center bg-[#FDB71A] p-8 order-1 lg:order-1">
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src="src/images/login.png" 
              alt="Login visual" 
              className="w-full h-full object-contain  max-h-[550px] animate-fade-in"
            />
          </div>
        </div>

        {/* Sección derecha - Formulario */}
        <div className="flex flex-col justify-center p-8 md:p-12 bg-white order-2 lg:order-2 relative">
          {/* Eslogan en la esquina superior derecha */}
          <div className="absolute -top-2 right-0 z-10">
            <img 
              src="src/images/eslogan.png" 
              alt="Eslogan" 
              className="h-24 md:h-28 w-auto object-cover"
            />
          </div>
          <div className="w-full max-w-md mx-auto">
            {/* Título de bienvenida */}
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-2 text-center">Bienvenido</h2>
            <p className="text-gray-600 text-center mb-8">Inicia sesión para continuar</p>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Campo Email */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Correo electrónico</label>
                <div className="relative">
                  <input
                    className="w-full bg-gray-50 text-black placeholder-gray-500 border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EE3626] focus:border-[#EE3626] transition-all"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    className="w-full bg-gray-50 text-black placeholder-gray-500 border border-gray-300 rounded-lg px-4 py-3 pr-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EE3626] focus:border-[#EE3626] transition-all"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Opciones adicionales */}
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 accent-[#EE3626] cursor-pointer"
                  />
                  <span className="text-black">Recuérdame</span>
                </label>
                <a className="text-black hover:underline font-medium" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón de entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: '#010101' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}


