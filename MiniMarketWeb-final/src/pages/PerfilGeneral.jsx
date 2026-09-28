import { useEffect, useState } from 'react'
import {
  User,
  Phone,
  MapPin,
  Lock,
  Save,
  Pencil,
  X,
  ShieldCheck,
  CreditCard,
  CalendarDays,
  Hash,
  BadgeCheck,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const ROLES_EMPLEADO = ['empleado', 'admin', 'cajero', 'repartidor']

const LAYOUT_TYPE_POR_ROL = {
  cliente: 'cliente',
  cajero: 'cajero',
  repartidor: 'repartidor',
  empleado: 'empleado',
  admin: 'empleado',
}

const ETIQUETA_ROL = {
  cliente: 'Cliente',
  empleado: 'Empleado',
  admin: 'Administrador',
  cajero: 'Cajero',
  repartidor: 'Repartidor',
}

// Campos que el store (updateProfile) sabe persistir en las tablas
// `cliente` y `empleado`.
const CAMPOS_EDITABLES = ['nombre', 'telefono', 'direccion']

const buildFormData = (profile) =>
  CAMPOS_EDITABLES.reduce(
    (acc, campo) => ({ ...acc, [campo]: profile?.[campo] || '' }),
    {}
  )

const esRolEmpleado = (rol) => ROLES_EMPLEADO.includes(rol)

export default function PerfilGeneral() {
  const profile = useAuthStore((state) => state.profile)
  const updateProfile = useAuthStore((state) => state.updateProfile)

  const [formData, setFormData] = useState(() => buildFormData(profile))
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const rol = profile?.rol
  const esEmpleado = esRolEmpleado(rol)
  const layoutType = LAYOUT_TYPE_POR_ROL[rol] ?? 'cliente'

  // Sincroniza el formulario cuando el store cambia (login, refresh, etc.)
  useEffect(() => {
    setFormData(buildFormData(profile))
  }, [profile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCancel = () => {
    setFormData(buildFormData(profile))
    setIsEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const updates = CAMPOS_EDITABLES.reduce(
      (acc, campo) => ({ ...acc, [campo]: formData[campo] }),
      {}
    )

    const result = await updateProfile(updates)

    setSaving(false)

    if (result?.success) {
      toast.success('Perfil actualizado exitosamente')
      setIsEditing(false)
    } else {
      toast.error(result?.error || 'No se pudo actualizar el perfil')
    }
  }

  // Sólo se muestran si existen en el perfil del rol actual
  const datosEmpleado = [
    { label: 'Legajo', valor: profile?.legajo, icono: Hash },
    { label: 'Fecha de ingreso', valor: profile?.fecha_ingreso, icono: CalendarDays },
  ].filter((dato) => dato.valor)

  const datosCliente = [
    { label: 'CI / RUC', valor: profile?.ci_ruc, icono: CreditCard },
    { label: 'Tipo de cliente', valor: profile?.tipo, icono: BadgeCheck },
  ].filter((dato) => dato.valor)

  const datosRol = esEmpleado ? datosEmpleado : datosCliente

  const iniciales = (profile?.nombre || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <Layout type={layoutType}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu información personal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumen del usuario */}
          <div className="card">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {iniciales}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {profile?.nombre || 'Usuario'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {profile?.usuario}
              </p>
              <span className="badge badge-info capitalize">
                {ETIQUETA_ROL[rol] || rol}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3 text-sm">
                {profile?.usuario && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4 mr-2" />
                    {profile.usuario}
                  </div>
                )}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Información
              </h2>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary flex items-center"
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Editar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
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
                    disabled={!isEditing}
                    className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>

              {/* Usuario (solo lectura) */}
              <div>
                <label
                  htmlFor="usuario"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="usuario"
                    name="usuario"
                    type="text"
                    value={profile?.usuario || ''}
                    disabled
                    className="input pl-10 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  El usuario no se puede modificar
                </p>
              </div>

              {/* Rol (solo lectura) */}
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </span>
                <span className="badge badge-info capitalize">
                  {ETIQUETA_ROL[rol] || rol}
                </span>
              </div>

              {/* Teléfono */}
              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
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
                    disabled={!isEditing}
                    className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    placeholder="12345678"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label
                  htmlFor="direccion"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
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
                    disabled={!isEditing}
                    className="input pl-10 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    rows="3"
                    placeholder="Calle Principal #123, Colonia Centro"
                  />
                </div>
              </div>

              {isEditing && (
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  {saving ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Datos específicos del rol */}
        {datosRol.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShieldCheck className="w-6 h-6 mr-2" />
              Información de {ETIQUETA_ROL[rol] || rol}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {datosRol.map(({ label, valor, icono: Icono }) => (
                <div key={label}>
                  <p className="text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                    <Icono className="w-4 h-4 mr-1.5" />
                    {label}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {valor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seguridad */}
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
              <strong>Consejo de seguridad:</strong> Usa una contraseña fuerte que incluya letras mayúsculas, minúsculas, números y símbolos.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
