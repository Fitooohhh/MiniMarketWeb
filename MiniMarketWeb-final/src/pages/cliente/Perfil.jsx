import { useState } from 'react'
import { User, Mail, Phone, MapPin, Lock, Save } from 'lucide-react'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store/useAuthStore'
import toast from 'react-hot-toast'

export default function ClientePerfil() {
  const { profile, updateProfile } = useAuthStore()
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    telefono: profile?.telefono || '',
    direccion: profile?.direccion || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateProfile(formData)

    if (result.success) {
      toast.success('Perfil actualizado exitosamente')
    }

    setLoading(false)
  }

  return (
    <Layout type="cliente">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu información personal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del usuario */}
          <div className="card">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
                <User className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {profile?.nombre}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {profile?.email}
              </p>
              <span className="badge badge-info capitalize">
                {profile?.rol}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  {profile?.email}
                </div>
                {profile?.telefono && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-2" />
                    {profile.telefono}
                  </div>
                )}
                {profile?.direccion && (
                  <div className="flex items-start text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                    <span>{profile.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulario de edición */}
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Editar Información
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>

              {/* Email (solo lectura) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={profile?.email}
                    disabled
                    className="input pl-10 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  El correo electrónico no se puede modificar
                </p>
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="12345678"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="input pl-10"
                    rows="3"
                    placeholder="Calle Principal #123, Colonia Centro"
                  />
                </div>
              </div>

              {/* Botón guardar */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sección de seguridad */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Lock className="w-6 h-6 mr-2" />
            Seguridad
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Para cambiar tu contraseña, por favor contacta al administrador o utiliza la opción de recuperación de contraseña en el inicio de sesión.
          </p>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Consejo de seguridad:</strong> Usa una contraseña fuerte que incluya letras mayúsculas, minúsculas, números y símbolos.
            </p>
          </div>
        </div>

        {/* Información de la cuenta */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Información de la Cuenta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Tipo de cuenta</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {profile?.rol}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Estado</p>
              <span className={`badge ${profile?.activo ? 'badge-success' : 'badge-danger'}`}>
                {profile?.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Miembro desde</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Última actualización</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
