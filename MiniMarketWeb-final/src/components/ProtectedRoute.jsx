import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children, requireEmpleado, requireCliente, requireRepartidor }) {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const loading = useAuthStore((state) => state.loading)

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <LoadingScreen />
  }

  // Si no hay usuario, redirigir a login
  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  // Verificar permisos de empleado
  if (requireEmpleado && profile.rol !== 'empleado' && profile.rol !== 'admin') {
    return <Navigate to="/login" replace />
  }

  // Verificar permisos de cliente
  if (requireCliente && profile.rol !== 'cliente') {
    return <Navigate to="/login" replace />
  }

  // Verificar permisos de repartidor
  if (requireRepartidor && profile.rol !== 'repartidor') {
    return <Navigate to="/login" replace />
  }

  // Si todo está bien, renderizar el contenido
  return children
}
