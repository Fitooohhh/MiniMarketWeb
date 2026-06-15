import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { useInitializeData } from './hooks/useInitializeData'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EmpleadoDashboard from './pages/empleado/Dashboard'
import AdminDashboard from './pages/empleado/AdminDashboard'
import EmpleadoPedidos from './pages/empleado/Pedidos'
import EmpleadoTareas from './pages/empleado/Tareas'
import EmpleadoAsistencia from './pages/empleado/Asistencia'
import EmpleadoAsignarTareas from './pages/empleado/AsignarTareas'
import EmpleadoAsistenciaEmpleados from './pages/empleado/AsistenciaEmpleados'
import EmpleadoProductos from './pages/empleado/Productos'
import EmpleadoUsuarios from './pages/empleado/Usuarios'
import EmpleadoHistorialRepartos from './pages/empleado/HistorialRepartos'
import EmpleadoTurnos from './pages/empleado/Turnos'
import EmpleadoDevoluciones from './pages/empleado/Devoluciones'
import AdminPromociones from './pages/admin/Promociones'
import AdminLealtad from './pages/admin/Lealtad'
import AdminDevoluciones from './pages/admin/Devoluciones'
import AdminTurnos from './pages/admin/Turnos'
import AdminNomina from './pages/admin/Nomina'
import ClienteDashboard from './pages/cliente/Dashboard'
import ClienteCatalogo from './pages/cliente/Catalogo'
import ClienteCarrito from './pages/cliente/Carrito'
import ClientePedidos from './pages/cliente/Pedidos'
import ClientePerfil from './pages/cliente/Perfil'
import ClienteLealtad from './pages/cliente/Lealtad'
import ClienteDevoluciones from './pages/cliente/Devoluciones'
import RepartidorDashboard from './pages/repartidor/Repartidor'
import RepartidorTurnos from './pages/repartidor/Turnos'
import NotFound from './pages/NotFound'

// Components
import LoadingScreen from './components/LoadingScreen'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const loading = useAuthStore((state) => state.loading)
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const { initializeTheme } = useThemeStore()
  const { initializeAppData } = useInitializeData()

  useEffect(() => {
    initialize()
    initializeTheme()
  }, [])

  useEffect(() => {
    if (profile) {
      initializeAppData()
    }
  }, [profile, initializeAppData])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rutas de administrador - redirigen a páginas existentes con pestañas */}
        <Route path="/admin/promociones" element={
          <ProtectedRoute requireEmpleado>
            <Navigate to="/empleado/productos" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/lealtad" element={
          <ProtectedRoute requireEmpleado>
            <Navigate to="/empleado/asistencia-empleados" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/devoluciones" element={
          <ProtectedRoute requireEmpleado>
            <Navigate to="/empleado/asistencia-empleados" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/turnos" element={
          <ProtectedRoute requireEmpleado>
            <Navigate to="/empleado/asistencia-empleados" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/nomina" element={
          <ProtectedRoute requireEmpleado>
            <Navigate to="/empleado/usuarios" replace />
          </ProtectedRoute>
        } />
        
        {/* Rutas de empleados */}
        <Route path="/empleado" element={
          <ProtectedRoute requireEmpleado>
            {user?.profile?.rol === 'admin' ? <AdminDashboard /> : <EmpleadoDashboard />}
          </ProtectedRoute>
        } />
        <Route path="/empleado/pedidos" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoPedidos />
          </ProtectedRoute>
        } />
        <Route path="/empleado/tareas" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoTareas />
          </ProtectedRoute>
        } />
        <Route path="/empleado/asistencia" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoAsistencia />
          </ProtectedRoute>
        } />
        <Route path="/empleado/asignar-tareas" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoAsignarTareas />
          </ProtectedRoute>
        } />
        <Route path="/empleado/asistencia-empleados" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoAsistenciaEmpleados />
          </ProtectedRoute>
        } />
        <Route path="/empleado/productos" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoProductos />
          </ProtectedRoute>
        } />
        <Route path="/empleado/usuarios" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoUsuarios />
          </ProtectedRoute>
        } />
        <Route path="/empleado/historial-repartos" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoHistorialRepartos />
          </ProtectedRoute>
        } />
        <Route path="/empleado/turnos" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoTurnos />
          </ProtectedRoute>
        } />
        <Route path="/empleado/devoluciones" element={
          <ProtectedRoute requireEmpleado>
            <EmpleadoDevoluciones />
          </ProtectedRoute>
        } />
        
        {/* Rutas de clientes */}
        <Route path="/cliente" element={
          <ProtectedRoute requireCliente>
            <ClienteDashboard />
          </ProtectedRoute>
        } />
        <Route path="/cliente/catalogo" element={
          <ProtectedRoute requireCliente>
            <ClienteCatalogo />
          </ProtectedRoute>
        } />
        <Route path="/cliente/carrito" element={
          <ProtectedRoute requireCliente>
            <ClienteCarrito />
          </ProtectedRoute>
        } />
        <Route path="/cliente/pedidos" element={
          <ProtectedRoute requireCliente>
            <ClientePedidos />
          </ProtectedRoute>
        } />
        <Route path="/cliente/perfil" element={
          <ProtectedRoute requireCliente>
            <ClientePerfil />
          </ProtectedRoute>
        } />
        <Route path="/cliente/lealtad" element={
          <ProtectedRoute requireCliente>
            <ClienteLealtad />
          </ProtectedRoute>
        } />
        <Route path="/cliente/devoluciones" element={
          <ProtectedRoute requireCliente>
            <ClienteDevoluciones />
          </ProtectedRoute>
        } />
        
        {/* Rutas de repartidores */}
        <Route path="/repartidor" element={
          <ProtectedRoute requireRepartidor>
            <RepartidorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/repartidor/turnos" element={
          <ProtectedRoute requireRepartidor>
            <RepartidorTurnos />
          </ProtectedRoute>
        } />
        
        {/* Ruta raíz - redirige según el rol */}
        <Route path="/" element={
          user && profile 
            ? (profile.rol === 'empleado' || profile.rol === 'admin' 
                ? <Navigate to="/empleado" replace /> 
                : profile.rol === 'repartidor'
                ? <Navigate to="/repartidor" replace />
                : <Navigate to="/cliente" replace />)
            : <Navigate to="/login" replace />
        } />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
