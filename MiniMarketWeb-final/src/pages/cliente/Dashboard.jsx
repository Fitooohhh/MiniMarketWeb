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
        .from('promocion_avanzada')
        .select(`
          *,
          promocion_detalle (
            id_producto,
            precio_especial,
            producto:producto (id_producto, nombre, precio, imagen_url)
          )
        `)
        .eq('activa', true)
        .lte('fecha_inicio', new Date().toISOString().split('T')[0])
        .gte('fecha_fin', new Date().toISOString().split('T')[0])
        .limit(3)

      // Cargar datos de lealtad
      const { data: puntosData } = await supabase
        .from('puntos_cliente')
        .select('*')
        .eq('id_cliente', profile.id_cliente)
        .order('fecha', { ascending: false })
        .limit(10)

      // Cargar nivel actual y puntos del cliente
      const { data: clienteNivelData } = await supabase
        .from('cliente')
        .select('puntos_acumulados, nivel:nivel_cliente(nombre, descuento_especial, multiplicador_puntos)')
        .eq('id_cliente', profile.id_cliente)
        .single()

      // Cargar datos de devoluciones
      const { data: devolucionesData } = await supabase
        .from('devolucion_detalle')
        .select(`
          *,
          detalle_venta!inner (
            id_detalle_venta,
            producto (nombre),
            venta!inner (
              id_venta,
              fecha,
              id_cliente
            )
          )
        `)
        .eq('detalle_venta.venta.id_cliente', profile.id_cliente)
        .order('id_devolucion_detalle', { ascending: false })

      // Formatear datos
      const promocionesFormateadas = promocionesData?.map(promo => {
        const primerDetalle = promo.promocion_detalle?.[0]
        const prod = primerDetalle?.producto
        
        let precioOriginal = null
        let precioConDescuento = '0.00'
        let descPorc = promo.descuento_porcentaje || 0

        if (prod) {
          precioOriginal = prod.precio
          if (primerDetalle?.precio_especial) {
            precioConDescuento = parseFloat(primerDetalle.precio_especial).toFixed(2)
            descPorc = Math.round((1 - (parseFloat(primerDetalle.precio_especial) / prod.precio)) * 100)
          } else if (promo.descuento_porcentaje) {
            precioConDescuento = (prod.precio * (1 - promo.descuento_porcentaje / 100)).toFixed(2)
          } else if (promo.monto_descuento) {
            precioConDescuento = Math.max(0, prod.precio - promo.monto_descuento).toFixed(2)
            descPorc = Math.round((promo.monto_descuento / prod.precio) * 100)
          }
        } else {
          // Promoción general
          if (promo.descuento_porcentaje) {
            precioConDescuento = `${promo.descuento_porcentaje}% de desc.`
          } else if (promo.monto_descuento) {
            precioConDescuento = `Bs ${promo.monto_descuento.toFixed(2)} de desc.`
          } else {
            precioConDescuento = promo.tipo.toUpperCase()
          }
        }

        return {
          id: promo.id_promocion,
          producto_nombre: prod?.nombre || promo.nombre,
          precio_original: precioOriginal,
          precio_con_descuento: precioConDescuento,
          descuento_porcentaje: descPorc,
          imagen_url: prod?.imagen_url,
          promocion_nombre: promo.nombre,
          descripcion: promo.descripcion || promo.condiciones || 'Promoción especial de la tienda'
        }
      }) || []

      setStats({
        pedidosActivos: ventasActivas?.length || 0,
        pedidosCompletados: ventasCompletadas?.length || 0,
        promocionesActivas: promocionesFormateadas.length,
        puntosLealtad: clienteNivelData?.puntos_acumulados || puntosData?.reduce((sum, p) => sum + p.puntos_ganados, 0) || 0,
        nivelLealtad: clienteNivelData?.nivel?.nombre || 'Base',
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
                                  e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-t-lg">
                                <Tag className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            
                            {promo.descuento_porcentaje > 0 && (
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white">
                                  -{promo.descuento_porcentaje}%
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 flex flex-col justify-between flex-1">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {promo.producto_nombre}
                              </h3>
                              {promo.descripcion && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                  {promo.descripcion}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-auto">
                              <div>
                                {promo.precio_original ? (
                                  <>
                                    <p className="text-xs text-gray-500 line-through">
                                      Bs {promo.precio_original.toFixed(2)}
                                    </p>
                                    <p className="text-lg font-bold text-green-600">
                                      Bs {promo.precio_con_descuento}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-lg font-bold text-green-600">
                                    {promo.precio_con_descuento}
                                  </p>
                                )}
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

            {activeTab === 'lealtad' && (() => {
              const nivelesConfig = {
                'Base':     { emoji: '🪨', color: 'from-gray-400 to-gray-600',    bg: 'bg-gray-100 dark:bg-gray-800',    text: 'text-gray-700 dark:text-gray-300',    border: 'border-gray-300', next: 'Bronce',   pedidosSiguiente: 10 },
                'Bronce':   { emoji: '🥉', color: 'from-amber-600 to-amber-800',  bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-400', next: 'Plata',    pedidosSiguiente: 20 },
                'Plata':    { emoji: '🥈', color: 'from-slate-400 to-slate-600',  bg: 'bg-slate-100 dark:bg-slate-800',  text: 'text-slate-700 dark:text-slate-300',  border: 'border-slate-400', next: 'Oro',      pedidosSiguiente: 30 },
                'Oro':      { emoji: '🥇', color: 'from-yellow-400 to-yellow-600',bg: 'bg-yellow-50 dark:bg-yellow-900/20',text: 'text-yellow-700 dark:text-yellow-300',border: 'border-yellow-400',next: 'Diamante', pedidosSiguiente: 50 },
                'Diamante': { emoji: '💎', color: 'from-cyan-400 to-blue-600',    bg: 'bg-cyan-50 dark:bg-cyan-900/20',  text: 'text-cyan-700 dark:text-cyan-300',    border: 'border-cyan-400',  next: null,       pedidosSiguiente: null },
              }
              const cfg = nivelesConfig[stats.nivelLealtad] || nivelesConfig['Base']
              const pedidosActuales = stats.pedidosCompletados
              const progresoPorcentaje = cfg.pedidosSiguiente
                ? Math.min(100, Math.round((pedidosActuales / cfg.pedidosSiguiente) * 100))
                : 100

              return (
                <div className="space-y-6">
                  {/* Tarjeta de nivel actual */}
                  <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center text-4xl shadow-lg`}>
                          {cfg.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tu nivel actual</p>
                          <h2 className={`text-3xl font-extrabold ${cfg.text}`}>{stats.nivelLealtad}</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {pedidosActuales} pedido{pedidosActuales !== 1 ? 's' : ''} realizados
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Puntos acumulados</p>
                        <p className={`text-4xl font-extrabold ${cfg.text}`}>{stats.puntosLealtad}</p>
                        <p className="text-xs text-gray-400">pts</p>
                      </div>
                    </div>

                    {/* Barra de progreso hacia el siguiente nivel */}
                    {cfg.next ? (
                      <div className="mt-5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Progreso hacia <span className="font-bold">{cfg.next}</span>
                          </span>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {pedidosActuales} / {cfg.pedidosSiguiente} pedidos
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full bg-gradient-to-r ${cfg.color} transition-all duration-700`}
                            style={{ width: `${progresoPorcentaje}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Te faltan <strong>{cfg.pedidosSiguiente - pedidosActuales}</strong> pedido{(cfg.pedidosSiguiente - pedidosActuales) !== 1 ? 's' : ''} para llegar a {cfg.next}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                        <span className="text-xl">🎉</span>
                        <span className="font-semibold text-sm">¡Felicidades! Estás en el nivel más alto.</span>
                      </div>
                    )}
                  </div>

                  {/* Mapa de niveles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Programa de Niveles</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {Object.entries(nivelesConfig).map(([nombre, info]) => {
                        const esActual = nombre === stats.nivelLealtad
                        const alcanzado = ['Base','Bronce','Plata','Oro','Diamante'].indexOf(nombre) <=
                                          ['Base','Bronce','Plata','Oro','Diamante'].indexOf(stats.nivelLealtad)
                        return (
                          <div key={nombre} className={`rounded-xl p-4 text-center border-2 transition-all ${
                            esActual ? `${info.bg} ${info.border} shadow-md scale-105` :
                            alcanzado ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80' :
                            'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50'
                          }`}>
                            <div className="text-3xl mb-2">{info.emoji}</div>
                            <p className={`font-bold text-sm ${esActual ? info.text : 'text-gray-700 dark:text-gray-300'}`}>{nombre}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {nombre === 'Base' ? '0–9 pedidos' :
                               nombre === 'Bronce' ? '10–19' :
                               nombre === 'Plata' ? '20–29' :
                               nombre === 'Oro' ? '30–49' : '50+'}
                            </p>
                            {esActual && <span className="inline-block mt-2 text-xs bg-white dark:bg-gray-700 rounded-full px-2 py-0.5 font-semibold text-gray-600 dark:text-gray-300">Actual</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Historial de puntos */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historial de Puntos</h3>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="card animate-pulse">
                            <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : puntosCliente.length > 0 ? (
                      <div className="space-y-3">
                        {puntosCliente.map((punto) => (
                          <div key={punto.id_puntos} className="card">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {punto.concepto || 'Compra realizada'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(punto.fecha).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-extrabold text-green-600">
                                  +{punto.puntos_ganados}
                                </span>
                                <p className="text-xs text-gray-400">puntos</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-700 dark:text-white">Sin puntos aún</p>
                        <p className="text-sm text-gray-400 mt-1">Realiza tu primera compra para comenzar</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </Layout>
  )
}
