import { useState, useEffect } from 'react'
import { RotateCcw, Search, Filter, CheckCircle, XCircle, Clock, AlertCircle, FileText, TrendingDown, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DevolucionesTab({ profile }) {
  const [devoluciones, setDevoluciones] = useState([])
  const [politicas, setPoliticas] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pendientes')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Simulación de datos
      const devolucionesData = [
        {
          id_devolucion_detalle: 1,
          detalle_venta: {
            producto: { nombre: 'Producto A' },
            venta: {
              cliente: { nombre: 'Cliente 1' },
              fecha: new Date().toISOString().split('T')[0]
            },
            precio_unitario: 100
          },
          cantidad_devuelta: 2,
          motivo: 'Producto defectuoso',
          estado: 'pendiente',
          tipo_reembolso: 'efectivo',
          monto_reembolso: 200,
          devolucion: { fecha: new Date().toISOString().split('T')[0] }
        }
      ]
      
      const politicasData = [
        {
          id_politica: 1,
          nombre: 'Política General',
          dias_maximos: 30,
          condicion_producto: 'Producto en buen estado',
          requiere_factura: true,
          porcentaje_reembolso: 100,
          credito_tienda: false,
          activa: true
        }
      ]
      
      setDevoluciones(devolucionesData)
      setPoliticas(politicasData)
    } catch (error) {
      toast.error('Error al cargar datos de devoluciones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAprobarDevolucion = async (idDevolucion) => {
    try {
      toast.success('Devolución aprobada correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al aprobar devolución')
      console.error(error)
    }
  }

  const handleRechazarDevolucion = async (idDevolucion) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return

    try {
      toast.success('Devolución rechazada')
      cargarDatos()
    } catch (error) {
      toast.error('Error al rechazar devolución')
      console.error(error)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'aprobada': return 'bg-green-100 text-green-800'
      case 'rechazada': return 'bg-red-100 text-red-800'
      case 'procesada': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente': return <Clock className="w-4 h-4" />
      case 'aprobada': return <CheckCircle className="w-4 h-4" />
      case 'rechazada': return <XCircle className="w-4 h-4" />
      case 'procesada': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const devolucionesFiltradas = devoluciones.filter(devolucion => {
    const coincideBusqueda = 
      devolucion.detalle_venta.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      devolucion.detalle_venta.venta.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())
    
    const coincideEstado = filtroEstado === 'todos' || devolucion.estado === filtroEstado
    
    return coincideBusqueda && coincideEstado
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['pendientes', 'politicas', 'estadisticas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'pendientes' && 'Solicitudes Pendientes'}
              {tab === 'politicas' && 'Políticas de Devolución'}
              {tab === 'estadisticas' && 'Estadísticas'}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'pendientes' && (
        <div>
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por producto o cliente..."
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
                  <option value="procesada">Procesadas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de devoluciones */}
          <div className="space-y-4">
            {devolucionesFiltradas.length > 0 ? (
              devolucionesFiltradas.map((devolucion) => (
                <div key={devolucion.id_devolucion_detalle} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getEstadoColor(devolucion.estado)}`}>
                          {getEstadoIcon(devolucion.estado)}
                          {devolucion.estado.charAt(0).toUpperCase() + devolucion.estado.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Solicitud #{devolucion.id_devolucion_detalle}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900">{devolucion.detalle_venta.producto.nombre}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Cliente: {devolucion.detalle_venta.venta.cliente.nombre}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">Bs {devolucion.monto_reembolso || 0}</p>
                      <p className="text-sm text-gray-600">Reembolso</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Motivo:</span> {devolucion.motivo}
                    </p>
                  </div>

                  {devolucion.estado === 'pendiente' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAprobarDevolucion(devolucion.id_devolucion_detalle)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar Devolución
                      </button>
                      <button
                        onClick={() => handleRechazarDevolucion(devolucion.id_devolucion_detalle)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  )}

                  {devolucion.estado === 'aprobada' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Devolución aprobada - Lista para procesar</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busqueda || filtroEstado !== 'todos' ? 'No hay devoluciones que coincidan' : 'No hay devoluciones pendientes'}
                </h3>
                <p className="text-gray-600">
                  {busqueda || filtroEstado !== 'todos' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay solicitudes de devolución pendientes de aprobación'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'politicas' && (
        <div className="space-y-4">
          {politicas.map((politica) => (
            <div key={politica.id_politica} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{politica.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-2">{politica.condicion_producto || 'Sin condiciones específicas'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  politica.activa 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {politica.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Días máximos:</span>
                  <p className="font-medium text-gray-900">{politica.dias_maximos} días</p>
                </div>
                <div>
                  <span className="text-gray-600">Reembolso:</span>
                  <p className="font-medium text-gray-900">{politica.porcentaje_reembolso}%</p>
                </div>
                <div>
                  <span className="text-gray-600">Requiere factura:</span>
                  <p className="font-medium text-gray-900">{politica.requiere_factura ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Crédito tienda:</span>
                  <p className="font-medium text-gray-900">{politica.credito_tienda ? 'Sí' : 'No'}</p>
                </div>
              </div>
            </div>
          ))}
          
          {politicas.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay políticas configuradas</h3>
              <p className="text-gray-600 mb-4">Crea políticas para gestionar las devoluciones</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'estadisticas' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Estadísticas de Devoluciones</h3>
            <p className="text-gray-600">Función de estadísticas en desarrollo</p>
          </div>
        </div>
      )}
    </div>
  )
}
