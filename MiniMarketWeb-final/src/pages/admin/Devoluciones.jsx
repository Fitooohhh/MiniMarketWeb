import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Settings, FileText, TrendingDown, Calendar, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { devolucionesService } from '../../lib/devolucionesService'

export default function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState([])
  const [politicas, setPoliticas] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pendientes')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [devolucionesData, politicasData] = await Promise.all([
        devolucionesService.obtenerDevolucionesPendientes(),
        devolucionesService.obtenerPoliticasDevolucion()
      ])
      
      setDevoluciones(devolucionesData)
      setPoliticas(politicasData)
    } catch (error) {
      toast.error('Error al cargar datos de devoluciones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const cargarEstadisticas = async () => {
    if (!fechaInicio || !fechaFin) return

    try {
      const data = await devolucionesService.obtenerEstadisticasDevoluciones(fechaInicio, fechaFin)
      setEstadisticas(data)
    } catch (error) {
      toast.error('Error al cargar estadísticas')
      console.error(error)
    }
  }

  useEffect(() => {
    if (activeTab === 'estadisticas' && fechaInicio && fechaFin) {
      cargarEstadisticas()
    }
  }, [fechaInicio, fechaFin, activeTab])

  const handleCrearPolitica = () => {
    navigate('/admin/devoluciones/politica/nueva')
  }

  const handleVerHistorial = () => {
    navigate('/admin/devoluciones/historial')
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Devoluciones</h1>
          <p className="text-gray-600 mt-1">Administra políticas y solicitudes de devolución</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCrearPolitica}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Nueva Política
          </button>
          <button
            onClick={handleVerHistorial}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ver Historial
          </button>
        </div>
      </div>

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
                      <p className="text-sm text-gray-600">
                        Venta: #{devolucion.detalle_venta.venta.id_venta} - {new Date(devolucion.detalle_venta.venta.fecha).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${devolucion.monto_reembolso || 0}</p>
                      <p className="text-sm text-gray-600">Reembolso</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Cantidad devuelta:</span>
                      <p className="font-medium text-gray-900">{devolucion.cantidad_devuelta} unidades</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Precio unitario:</span>
                      <p className="font-medium text-gray-900">${devolucion.detalle_venta.precio_unitario}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Tipo reembolso:</span>
                      <p className="font-medium text-gray-900">{devolucion.tipo_reembolso}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Fecha solicitud:</span>
                      <p className="font-medium text-gray-900">{new Date(devolucion.devolucion.fecha).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Motivo:</span> {devolucion.motivo}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/admin/devoluciones/${devolucion.id_devolucion_detalle}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ver Detalles
                    </button>
                  </div>
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
                    : 'No hay solicitudes de devolución pendientes de revisión'
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

              <div className="flex gap-3 mt-4 pt-4 border-t">
                <button
                  onClick={() => navigate(`/admin/devoluciones/politica/${politica.id_politica}/editar`)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar Política
                </button>
              </div>
            </div>
          ))}
          
          {politicas.length === 0 && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay políticas configuradas</h3>
              <p className="text-gray-600 mb-4">Crea políticas para gestionar las devoluciones</p>
              <button
                onClick={handleCrearPolitica}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Crear Política
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'estadisticas' && (
        <div className="space-y-6">
          {/* Filtros de fecha */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={cargarEstadisticas}
                disabled={!fechaInicio || !fechaFin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                Generar Estadísticas
              </button>
            </div>
          </div>

          {estadisticas ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Devoluciones</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.total_devoluciones}</p>
                  </div>
                  <RotateCcw className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unidades Devueltas</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.total_unidades_devueltas}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monto Reembolsado</p>
                    <p className="text-2xl font-bold text-gray-900">${estadisticas.total_monto_reembolsado.toFixed(2)}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasa Aprobación</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {estadisticas.total_devoluciones > 0 
                        ? Math.round((estadisticas.devoluciones_aprobadas / estadisticas.total_devoluciones) * 100)
                        : 0}%
                    </p>
                  </div>
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un período</h3>
              <p className="text-gray-600">Elige las fechas para ver las estadísticas de devoluciones</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
