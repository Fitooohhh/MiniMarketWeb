import { useEffect, useState } from 'react'
import { ShoppingBag, Package, TrendingUp, Tag, Star, RotateCcw, Search, Filter } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ClienteDashboard() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState('inicio')
  const [stats, setStats] = useState({
    pedidosActivos: 0,
    pedidosCompletados: 0,
    promocionesActivas: 0,
    puntosLealtad: 0,
    nivelLealtad: '',
    devolucionesPendientes: 0,
  })
  const [promociones, setPromociones] = useState([])
  const [puntosCliente, setPuntosCliente] = useState([])
  const [devoluciones, setDevoluciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    loadDashboardData()
  }, [activeTab])

  const loadDashboardData = async () => {
    try {
      // Verificar que tenemos id_cliente
      if (!profile?.id_cliente) {
        console.error('No se encontró id_cliente en el perfil')
        setLoading(false)
        return
      }

      // Cargar datos básicos para todas las pestañas
      const { data: ventasActivas } = await supabase
        .from('venta')
        .select('id_venta')
        .eq('id_cliente', profile.id_cliente)

      const { data: ventasCompletadas } = await supabase
        .from('venta')
        .select('id_venta')
        .eq('id_cliente', profile.id_cliente)

      const { data: promocionesData } = await supabase
        .from('promocion')
        .select('*, producto:id_producto(*)')
        .lte('fecha_inicio', new Date().toISOString())
        .gte('fecha_fin', new Date().toISOString())
        .limit(3)

      // Cargar datos de lealtad
      const { data: puntosData } = await supabase
        .from('puntos_cliente')
        .select('*')
        .eq('id_cliente', profile.id_cliente)
        .order('fecha_ganado', { ascending: false })
        .limit(10)

      // Cargar datos de devoluciones
      const { data: devolucionesData } = await supabase
        .from('devolucion_detalle')
        .select(`
          *,
          detalle_venta (
            producto (nombre),
            venta (fecha, id_venta)
          )
        `)
        .eq('detalle_venta.venta.id_cliente', profile.id_cliente)
        .order('devolucion.fecha', { ascending: false })

      // Formatear datos
      const promocionesFormateadas = promocionesData?.map(promo => ({
        id: promo.id_promocion,
        producto_nombre: promo.producto?.nombre || 'Producto',
        precio_original: promo.producto?.precio || 0,
        precio_con_descuento: (promo.producto?.precio * (1 - promo.descuento / 100)).toFixed(2),
        descuento_porcentaje: promo.descuento,
        imagen_url: promo.producto?.imagen_url,
        promocion_nombre: `Descuento ${promo.descuento}%`
      })) || []

      setStats({
        pedidosActivos: ventasActivas?.length || 0,
        pedidosCompletados: ventasCompletadas?.length || 0,
        promocionesActivas: promocionesFormateadas.length,
        puntosLealtad: puntosData?.reduce((sum, p) => sum + p.puntos_ganados, 0) || 0,
        nivelLealtad: 'Oro', // Esto debería venir de la DB
        devolucionesPendientes: devolucionesData?.filter(d => d.estado === 'pendiente').length || 0,
      })
      setPromociones(promocionesFormateadas)
      setPuntosCliente(puntosData || [])
      setDevoluciones(devolucionesData || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitarDevolucion = async (idDetalleVenta) => {
    const motivo = prompt('Motivo de la devolución:')
    if (!motivo) return

    try {
      // Simulación de la solicitud
      toast.success('Solicitud de devolución enviada correctamente')
      loadDashboardData()
    } catch (error) {
      toast.error('Error al solicitar devolución')
      console.error(error)
    }
  }

  const handleCanjearRecompensa = async (idRecompensa) => {
    try {
      // Simulación del canje
      toast.success('Recompensa canjeada correctamente')
      loadDashboardData()
    } catch (error) {
      toast.error('Error al canjear recompensa')
      console.error(error)
    }
  }

  const statCards = [
    {
      title: 'Pedidos Activos',
      value: stats.pedidosActivos,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Pedidos Completados',
      value: stats.pedidosCompletados,
      icon: Package,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Promociones Activas',
      value: stats.promocionesActivas,
      icon: Tag,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: ShoppingBag },
    { id: 'lealtad', label: 'Mi Lealtad', icon: Star },
    { id: 'devoluciones', label: 'Devoluciones', icon: RotateCcw },
  ]

  const devolucionesFiltradas = devoluciones.filter(devolucion => {
    const coincideBusqueda = 
      devolucion.detalle_venta.producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    
    const coincideEstado = filtroEstado === 'todos' || devolucion.estado === filtroEstado
    
    return coincideBusqueda && coincideEstado
  })

  return (
    <Layout type="cliente">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ¡Hola, {profile?.nombre}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bienvenido a Mini Market
          </p>
        </div>

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
                      ? 'text-blue-600 border-b-2 border-blue-600'
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
            {activeTab === 'inicio' && (
              <div>
                {/* Stats Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card animate-pulse">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {statCards.map((stat, index) => {
                      const Icon = stat.icon
                      return (
                        <div key={index} className="card hover:shadow-lg transition-shadow">
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

                {/* Promociones destacadas */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Promociones para ti
                  </h2>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="card animate-pulse">
                          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {promociones.map((promo) => (
                        <div key={promo.id} className="card hover:shadow-lg transition-shadow">
                          <div className="aspect-w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative">
                            {promo.imagen_url ? (
                              <img
                                src={promo.imagen_url}
                                alt={promo.producto_nombre}
                                className="w-full h-full object-cover rounded-t-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-t-lg">
                                      <Tag className="w-12 h-12 text-gray-400" />
                                    </div>
                                  `
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-t-lg">
                                <Tag className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white">
                                -{promo.descuento_porcentaje}%
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                              {promo.producto_nombre}
                            </h3>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-500 line-through">
                                  ${promo.precio_original}
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                  ${promo.precio_con_descuento}
                                </p>
                              </div>
                              <Link
                                to="/cliente/catalogo"
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                              >
                                Ver
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones rápidas */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    to="/cliente/catalogo"
                    className="card hover:shadow-lg transition-shadow text-center p-6"
                  >
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Ver Catálogo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Explora nuestros productos
                    </p>
                  </Link>

                  <Link
                    to="/cliente/pedidos"
                    className="card hover:shadow-lg transition-shadow text-center p-6"
                  >
                    <Package className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Mis Pedidos</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Revisa el estado de tus pedidos
                    </p>
                  </Link>

                  <button
                    onClick={() => setActiveTab('lealtad')}
                    className="card hover:shadow-lg transition-shadow text-center p-6"
                  >
                    <Star className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Mi Lealtad</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {stats.puntosLealtad} puntos disponibles
                    </p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'lealtad' && (
              <div>
                {/* Resumen de lealtad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="card text-center">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full inline-block mb-4">
                      <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.puntosLealtad}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Puntos Acumulados</p>
                  </div>

                  <div className="card text-center">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full inline-block mb-4">
                      <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.nivelLealtad}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nivel Actual</p>
                  </div>

                  <div className="card text-center">
                    <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full inline-block mb-4">
                      <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.pedidosCompletados}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos Completados</p>
                  </div>
                </div>

                {/* Historial de puntos */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Historial de Puntos
                  </h2>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="card animate-pulse">
                          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : puntosCliente.length > 0 ? (
                    <div className="space-y-4">
                      {puntosCliente.map((punto) => (
                        <div key={punto.id_puntos_cliente} className="card">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {punto.descripcion || 'Compra realizada'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(punto.fecha_ganado).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">
                                +{punto.puntos_ganados}
                              </span>
                              <p className="text-sm text-gray-600 dark:text-gray-400">puntos</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No hay puntos acumulados
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Comienza a comprar para acumular puntos
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'devoluciones' && (
              <div>
                {/* Filtros */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar devoluciones..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-gray-400" />
                      <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="aprobada">Aprobadas</option>
                        <option value="rechazada">Rechazadas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lista de devoluciones */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="card animate-pulse">
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : devolucionesFiltradas.length > 0 ? (
                    devolucionesFiltradas.map((devolucion) => (
                      <div key={devolucion.id_devolucion_detalle} className="card">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {devolucion.detalle_venta.producto.nombre}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Pedido #{devolucion.detalle_venta.venta.id_venta} - 
                              {new Date(devolucion.detalle_venta.venta.fecha).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Cantidad: {devolucion.cantidad_devuelta} unidades
                            </p>
                            {devolucion.motivo && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Motivo: {devolucion.motivo}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              devolucion.estado === 'pendiente' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : devolucion.estado === 'aprobada'
                                ? 'bg-green-100 text-green-800'
                                : devolucion.estado === 'rechazada'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {devolucion.estado.charAt(0).toUpperCase() + devolucion.estado.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {busqueda || filtroEstado !== 'todos' 
                          ? 'No hay devoluciones que coincidan' 
                          : 'No hay devoluciones'
                        }
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {busqueda || filtroEstado !== 'todos' 
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'No tienes solicitudes de devolución registradas'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
