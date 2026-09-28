import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import LoadingScreen from './LoadingScreen'

// Destino por rol: misma regla que aplica LoginPage al iniciar sesion
export function dashboardPathFor(rol) {
  switch ((rol || '').toLowerCase()) {
    case 'admin':
    case 'empleado':
      return '/empleado'
    case 'repartidor':
      return '/repartidor'
    case 'cajero':
      return '/cajero'
    case 'cliente':
    default:
      return '/cliente'
  }
}

export default function ProtectedRoute({
  children,
  requireEmpleado,
  requireCliente,
  requireRepartidor,
  requireCajero,
  requireRoles
}) {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const loading = useAuthStore((state) => state.loading)

  // Mostrar loading mientras se verifica la autenticacion
  if (loading) {
    return <LoadingScreen />
  }

  // Sin sesión: unico caso que lleva a /login
  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  const rol = (profile.rol || '').toLowerCase()

  const hayRestriccion = Boolean(
    requireEmpleado || requireCliente || requireRepartidor || requireCajero ||
    (Array.isArray(requireRoles) && requireRoles.length > 0)
  )

  const permitido =
    !hayRestriccion ||
    (requireEmpleado && (rol === 'empleado' || rol === 'admin')) ||
    (requireCliente && rol === 'cliente') ||
    (requireRepartidor && rol === 'repartidor') ||
    (requireCajero && rol === 'cajero') ||
    (Array.isArray(requireRoles) && requireRoles.includes(rol))

  // Sesion activa sin permiso para esta ruta: se lo devuelve a SU dashboard,
  // nunca al login (quién ya inició sesión no tiene que volver a loguearse)
  if (!permitido) {
    return <Navigate to={dashboardPathFor(rol)} replace />
  }

  return children
}
