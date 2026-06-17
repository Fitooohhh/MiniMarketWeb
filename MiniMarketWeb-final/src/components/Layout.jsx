import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, Package, CheckSquare, Clock, ShoppingCart, 
  User, LogOut, Moon, Sun, Bell, Menu, X, 
  Warehouse, UserCheck, Users, Tag, Star, RotateCcw,
  Calendar, DollarSign
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { useCartStore } from '../store/useCartStore'

export default function Layout({ children, type = 'cliente' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { getItemCount } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Links base para todos los empleados
  const baseEmpleadoLinks = [
    { to: '/empleado', icon: Home, label: 'Inicio' },
    { to: '/empleado/cajero', icon: ShoppingCart, label: 'Caja POS' },
    { to: '/empleado/pedidos', icon: Package, label: 'Pedidos' },
    { to: '/empleado/asistencia', icon: Clock, label: 'Asistencia' },
  ]

  // Links solo para empleados normales (no admin)
  const empleadoNormalLinks = [
    { to: '/empleado/tareas', icon: CheckSquare, label: 'Tareas' },
    { to: '/empleado/turnos', icon: Calendar, label: 'Mis Turnos' },
    { to: '/empleado/devoluciones', icon: RotateCcw, label: 'Devoluciones' },
  ]

  // Links adicionales solo para administradores
  const adminLinks = [
    { to: '/empleado/productos', icon: Package, label: 'Productos' },
    { to: '/empleado/asignar-tareas', icon: UserCheck, label: 'Asignación de Repartos' },
    { to: '/empleado/usuarios', icon: Users, label: 'Gestión de Usuarios' },
    { to: '/empleado/historial-repartos', icon: Clock, label: 'Historial de Repartos' },
    { to: '/empleado/asistencia-empleados', icon: Users, label: 'Asistencia Empleados' },
  ]

  // Combinar links según el rol
  const empleadoLinks = profile?.rol === 'admin' 
    ? [
        { to: '/empleado', icon: Home, label: 'Inicio' },
        { to: '/empleado/pedidos', icon: Package, label: 'Pedidos' },
        { to: '/empleado/asistencia', icon: Clock, label: 'Asistencia' },
        ...adminLinks
      ]
    : [...baseEmpleadoLinks, ...empleadoNormalLinks]

  const clienteLinks = [
    { to: '/cliente', icon: Home, label: 'Inicio' },
    { to: '/cliente/catalogo', icon: Package, label: 'Catálogo' },
    { to: '/cliente/pedidos', icon: CheckSquare, label: 'Mis Pedidos' },
    { to: '/cliente/perfil', icon: User, label: 'Perfil' },
  ]

  const cajeroLinks = [
    { to: '/cajero', icon: ShoppingCart, label: 'Caja POS' },
  ]

  const links = type === 'empleado' ? empleadoLinks : type === 'cajero' ? cajeroLinks : clienteLinks
  const cartCount = type === 'cliente' ? getItemCount() : 0

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16 min-w-0">
            {/* Logo y nombre */}
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-lg font-bold text-primary-600 ml-1 hidden sm:block">
                MM
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center flex-1 min-w-0 mx-4 space-x-2 overflow-x-auto">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={22} className="mr-1.5 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Carrito (solo clientes) */}
              {type === 'cliente' && (
                <Link
                  to="/cliente/carrito"
                  className="relative p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Notificaciones */}
              <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell size={22} />
              </button>

              {/* Toggle tema */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
              </button>

              {/* Usuario */}
              <div className="hidden sm:flex items-center space-x-2 ml-2">
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {profile?.nombre}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                    {profile?.rol}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Cerrar sesión"
                >
                  <LogOut size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
            <nav className="px-4 py-3 space-y-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={18} className="mr-3" />
                    {link.label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={18} className="mr-3" />
                Cerrar sesión
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
