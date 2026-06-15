import { useEffect, useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/useAuthStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function PerfilTab({ profile }) {
  const { logout } = useAuthStore()
  const [userData, setUserData] = useState(null)
  const [empleadoData, setEmpleadoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
  })

  useEffect(() => {
    loadUserData()
  }, [profile?.id_usuario])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Cargar datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', profile.id_usuario)
        .single()

      if (userError) throw userError

      // Cargar datos del empleado
      const { data: empleadoData, error: empError } = await supabase
        .from('empleado')
        .select('*')
        .eq('id_usuario', profile.id_usuario)
        .single()

      if (empError && empError.code !== 'PGRST116') throw empError

      setUserData(userData)
      setEmpleadoData(empleadoData)
      setFormData({
        nombre: empleadoData?.nombre || userData?.nombre || '',
        telefono: empleadoData?.telefono || userData?.telefono || '',
        direccion: empleadoData?.direccion || '',
      })
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Error al cargar datos del perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      // Actualizar usuario
      const { error: userError } = await supabase
        .from('usuario')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
        })
        .eq('id_usuario', profile.id_usuario)

      if (userError) throw userError

      // Actualizar empleado
      if (empleadoData) {
        const { error: empError } = await supabase
          .from('empleado')
          .update({
            nombre: formData.nombre,
            telefono: formData.telefono,
            direccion: formData.direccion,
          })
          .eq('id_usuario', profile.id_usuario)

        if (empError) throw empError
      }

      toast.success('Perfil actualizado correctamente')
      setIsEditing(false)
      loadUserData()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar perfil')
    }
  }

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Avatar y Nombre */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {formData.nombre?.charAt(0)?.toUpperCase() || 'R'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {formData.nombre}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Repartidor
            </p>
          </div>
        </div>
      </div>

      {/* Información del Perfil */}
      {isEditing ? (
        // Modo Edición
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Editar Perfil
          </h3>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={e =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={e =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={e =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSaveChanges}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        // Modo Vista
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Información Personal
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          </div>

          <div className="space-y-4">
            {/* Usuario */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <User className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Usuario
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {userData?.usuario}
                </p>
              </div>
            </div>

            {/* Nombre */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <User className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nombre Completo
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formData.nombre}
                </p>
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Phone className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Teléfono
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formData.telefono || '-'}
                </p>
              </div>
            </div>

            {/* Dirección */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dirección
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formData.direccion || '-'}
                </p>
              </div>
            </div>

            {/* Rol */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <User className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rol
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {userData?.rol}
                </p>
              </div>
            </div>

            {/* Fecha de Ingreso */}
            {empleadoData?.fecha_ingreso && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fecha de Ingreso
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {format(new Date(empleadoData.fecha_ingreso), 'dd/MM/yyyy', {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  )
}
