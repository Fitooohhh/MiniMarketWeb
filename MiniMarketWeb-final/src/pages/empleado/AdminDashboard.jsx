import { useState, useEffect } from 'react'
import { 
  Home, Package, CheckSquare, Clock, Users, UserCheck, 
  Tag, Star, RotateCcw, Calendar, DollarSign, Bell, 
  LogOut, Moon, Sun, X, Menu, Warehouse, Truck, ShoppingCart
} from 'lucide-react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Importar pestañas
import PromocionesTab from './tabs/PromocionesTab'
import LealtadTab from './tabs/LealtadTab'
import DevolucionesTab from './tabs/DevolucionesTab'
import TurnosTab from './tabs/TurnosTab'
import NominaTab from './tabs/NominaTab'

export default function AdminDashboard() {
  const { profile, signOut } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('promociones')
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Determinar pestaña activa basada en la URL
    const path = location.pathname
    if (path.includes('/admin/promociones')) setActiveTab('promociones')
    else if (path.includes('/admin/lealtad')) setActiveTab('lealtad')
    else if (path.includes('/admin/devoluciones')) setActiveTab('devoluciones')
    else if (path.includes('/admin/turnos')) setActiveTab('turnos')
    else if (path.includes('/admin/nomina')) setActiveTab('nomina')
    
    loadStats()
  }, [location.pathname])

  const loadStats = async () => {
    try {
      // Cargar estadísticas generales
      const [
        { count: totalVentas },
        { count: totalProductos },
        { count: totalEmpleados },
        { count: totalClientes }
      ] = await Promise.all([
        supabase.from('venta').select('*', { count: 'exact', head: true }),
        supabase.from('producto').select('*', { count: 'exact', head: true }),
        supabase.from('empleado').select('*', { count: 'exact', head: true }),
        supabase.from('cliente').select('*', { count: 'exact', head: true })
      ])

      setStats({
        totalVentas: totalVentas || 0,
        totalProductos: totalProductos || 0,
        totalEmpleados: totalEmpleados || 0,
        totalClientes: totalClientes || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const tabs = [
    { id: 'promociones', label: 'Promociones', icon: Tag },
    { id: 'lealtad', label: 'Programa Lealtad', icon: Star },
    { id: 'devoluciones', label: 'Devoluciones', icon: RotateCcw },
    { id: 'turnos', label: 'Gestión Turnos', icon: Calendar },
    { id: 'nomina', label: 'Nómina', icon: DollarSign },
  ]

  const statCards = [
    {
      title: 'Total Ventas',
      value: stats.totalVentas,
      icon: ShoppingCart,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      title: 'Productos',
      value: stats.totalProductos,
      icon: Package,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Empleados',
      value: stats.totalEmpleados,
      icon: Users,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    {
      title: 'Clientes',
      value: stats.totalClientes,
      icon: UserCheck,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    }
  ]

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
                MM Admin
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center flex-1 min-w-0 mx-4 space-x-1 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[80px]">{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Notificaciones */}
              <button className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell size={16} />
              </button>

              {/* Toggle tema */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              {/* Usuario */}
              <div className="hidden sm:flex items-center space-x-1 ml-1">
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {profile?.nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {profile?.rol}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
            <nav className="px-4 py-3 space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={18} className="mr-3" />
                    {tab.label}
                  </button>
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido, {profile?.nombre || 'Administrador'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-4 rounded-full ${stat.bgColor}`}>
                      <Icon className={`w-8 h-8 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'promociones' && <PromocionesTab profile={profile} />}
            {activeTab === 'lealtad' && <LealtadTab profile={profile} />}
            {activeTab === 'devoluciones' && <DevolucionesTab profile={profile} />}
            {activeTab === 'turnos' && <TurnosTab profile={profile} />}
            {activeTab === 'nomina' && <NominaTab profile={profile} />}
          </div>
        </div>
      </main>
    </div>
  )
}
