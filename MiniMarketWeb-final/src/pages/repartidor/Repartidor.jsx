import { useEffect, useState, useRef } from 'react'
import { Package, Clock, User, Bell, LogOut, Moon, Sun, X, Calendar } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import RepartosTab from './tabs/RepartosTab'
import TurnosTab from './tabs/TurnosTab'
import AsistenciaTab from './tabs/AsistenciaTab'
import PerfilTab from './tabs/PerfilTab'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Repartidor() {
  const { profile, signOut } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('repartos')
  const [notificaciones, setNotificaciones] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)

  useEffect(() => {
    if (profile?.id_empleado) {
      loadNotificaciones()
      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel(`repartidor_${profile.id_empleado}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones',
            filter: `id_repartidor=eq.${profile.id_empleado}`,
          },
          (payload) => {
            setNotificaciones(prev => [payload.new, ...prev])
            setUnreadCount(prev => prev + 1)
            toast.success('¡Nuevo reparto asignado!')
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [profile?.id_empleado])

  // Cerrar notificaciones al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const loadNotificaciones = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('id_repartidor', profile.id_empleado)
        .order('fecha', { ascending: false })
        .limit(10)

      if (error) throw error
      setNotificaciones(data || [])
      setUnreadCount(data?.filter(n => !n.leida).length || 0)
    } catch (error) {
      console.error('Error loading notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id_notificacion', id)

      setNotificaciones(prev =>
        prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const tabs = [
    { id: 'repartos', label: 'Repartos', icon: Package },
    { id: 'turnos', label: 'Mis Turnos', icon: Calendar },
    { id: 'asistencia', label: 'Mi Asistencia', icon: Clock },
    { id: 'perfil', label: 'Perfil', icon: User },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-primary-600">
              Mini Market - Repartidor
            </h1>
            <div className="flex items-center gap-4">
              {/* Botón de Notificaciones */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notificaciones */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Notificaciones
                      </h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {notificaciones.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No hay notificaciones
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notificaciones.map(notif => (
                          <div
                            key={notif.id_notificacion}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                              !notif.leida ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => markAsRead(notif.id_notificacion)}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {notif.titulo}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notif.mensaje}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {format(new Date(notif.fecha), 'dd/MM/yyyy HH:mm', {
                                    locale: es,
                                  })}
                                </p>
                              </div>
                              {!notif.leida && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Panel de Repartidor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido, {profile?.nombre || 'Repartidor'}
          </p>
        </div>

        {/* Notificaciones */}
        {unreadCount > 0 && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 dark:text-blue-100">
              Tienes {unreadCount} notificación(es) nueva(s)
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
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
            {activeTab === 'repartos' && (
              <RepartosTab
                profile={profile}
                notificaciones={notificaciones}
                onMarkAsRead={markAsRead}
              />
            )}
            {activeTab === 'turnos' && <TurnosTab profile={profile} />}
            {activeTab === 'asistencia' && <AsistenciaTab profile={profile} />}
            {activeTab === 'perfil' && <PerfilTab profile={profile} />}
          </div>
        </div>
      </div>
    </div>
  )
}
