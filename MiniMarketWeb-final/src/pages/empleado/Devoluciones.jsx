import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Search, Filter, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { devolucionesService } from '../../lib/devolucionesService'
import { useAuthStore } from '../../store/useAuthStore'

export default function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    cargarDevoluciones()
  }, [])

  const cargarDevoluciones = async () => {
    try {
      const data = await devolucionesService.obtenerDevolucionesPendientes()
      setDevoluciones(data)
    } catch (error) {
      toast.error('Error al cargar devoluciones pendientes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAprobarDevolucion = async (idDevolucion) => {
    try {
      const idEmpleado = user.profile.id_empleado
      await devolucionesService.aprobarDevolucion(idDevolucion, idEmpleado)
      toast.success('Devolución aprobada correctamente')
      cargarDevoluciones()
    } catch (error) {
      toast.error('Error al aprobar devolución')
      console.error(error)
    }
  }

  const handleRechazarDevolucion = async (idDevolucion) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return

    try {
      const idEmpleado = user.profile.id_empleado
      await devolucionesService.rechazarDevolucion(idDevolucion, idEmpleado, motivo)
      toast.success('Devolución rechazada')
      cargarDevoluciones()
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Devoluciones</h1>
          <p className="text-gray-600 mt-1">Revisa y aprueba solicitudes de devolución</p>
        </div>
        <button
          onClick={() => navigate('/empleado/devoluciones/historial')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Ver Historial
        </button>
      </div>

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

              {devolucion.estado === 'rechazada' && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Devolución rechazada</span>
                </div>
              )}

              {devolucion.estado === 'procesada' && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Devolución procesada</span>
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
  )
}
