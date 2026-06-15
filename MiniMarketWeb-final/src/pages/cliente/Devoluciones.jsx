import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Plus, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { devolucionesService } from '../../lib/devolucionesService'
import { useAuthStore } from '../../store/useAuthStore'

export default function Devoluciones() {
  const [ventas, setVentas] = useState([])
  const [devoluciones, setDevoluciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.profile?.id_cliente) {
      cargarDatos()
    }
  }, [user])

  const cargarDatos = async () => {
    try {
      const idCliente = user.profile.id_cliente
      
      const [ventasData, devolucionesData] = await Promise.all([
        devolucionesService.obtenerVentasElegiblesDevolucion(idCliente),
        devolucionesService.obtenerHistorialDevolucionesCliente(idCliente)
      ])
      
      setVentas(ventasData)
      setDevoluciones(devolucionesData)
    } catch (error) {
      toast.error('Error al cargar datos de devoluciones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitarDevolucion = (venta) => {
    setVentaSeleccionada(venta)
    setProductosSeleccionados(
      venta.detalle_venta
        .filter(detalle => detalle.puede_devolver)
        .map(detalle => ({
          ...detalle,
          cantidad_devolver: 1,
          motivo: ''
        }))
    )
    setShowModal(true)
  }

  const handleCrearDevolucion = async () => {
    try {
      const idCliente = user.profile.id_cliente
      
      for (const producto of productosSeleccionados) {
        if (producto.cantidad_devolver > 0 && producto.motivo.trim()) {
          await devolucionesService.crearSolicitudDevolucion({
            id_detalle_venta: producto.id_detalle_venta,
            cantidad_devuelta: producto.cantidad_devolver,
            motivo: producto.motivo,
            id_cliente
          })
        }
      }
      
      toast.success('Solicitud de devolución enviada correctamente')
      setShowModal(false)
      cargarDatos()
    } catch (error) {
      toast.error(error.message || 'Error al crear solicitud de devolución')
      console.error(error)
    }
  }

  const handleCantidadChange = (idDetalle, cantidad) => {
    setProductosSeleccionados(prev => 
      prev.map(p => 
        p.id_detalle_venta === idDetalle 
          ? { ...p, cantidad_devolver: Math.min(cantidad, p.cantidad_disponible) }
          : p
      )
    )
  }

  const handleMotivoChange = (idDetalle, motivo) => {
    setProductosSeleccionados(prev => 
      prev.map(p => 
        p.id_detalle_venta === idDetalle 
          ? { ...p, motivo }
          : p
      )
    )
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
      case 'rechazada': return <AlertCircle className="w-4 h-4" />
      case 'procesada': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Mis Devoluciones</h1>
          <p className="text-gray-600 mt-1">Solicita y sigue el estado de tus devoluciones</p>
        </div>
      </div>

      {/* Sección de compras elegibles para devolución */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Compras Recientes</h2>
        
        {ventas.length > 0 ? (
          <div className="space-y-4">
            {ventas.map((venta) => (
              <div key={venta.id_venta} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Venta #{venta.id_venta}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(venta.fecha).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total: ${venta.total}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleSolicitarDevolucion(venta)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Solicitar Devolución
                  </button>
                </div>

                <div className="space-y-2">
                  {venta.detalle_venta.map((detalle) => (
                    <div key={detalle.id_detalle_venta} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-600">IMG</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{detalle.producto.nombre}</p>
                          <p className="text-sm text-gray-600">
                            ${detalle.precio_unitario} x {detalle.cantidad}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Disponible: {detalle.cantidad_disponible}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          detalle.puede_devolver 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {detalle.puede_devolver ? 'Devolver' : 'No disponible'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay compras recientes</h3>
            <p className="text-gray-600">No tienes compras elegibles para devolución en este momento</p>
          </div>
        )}
      </div>

      {/* Sección de historial de devoluciones */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Historial de Devoluciones</h2>
        
        {devoluciones.length > 0 ? (
          <div className="space-y-4">
            {devoluciones.map((devolucion) => (
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

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Motivo:</span> {devolucion.motivo}
                  </p>
                </div>

                {devolucion.estado === 'aprobada' && (
                  <div className="flex items-center gap-2 text-green-600 mt-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Devolución aprobada - Esperando procesamiento</span>
                  </div>
                )}

                {devolucion.estado === 'rechazada' && (
                  <div className="flex items-center gap-2 text-red-600 mt-4">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Devolución rechazada</span>
                  </div>
                )}

                {devolucion.estado === 'procesada' && (
                  <div className="flex items-center gap-2 text-gray-600 mt-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Devolución procesada</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay devoluciones</h3>
            <p className="text-gray-600">No has solicitado devoluciones aún</p>
          </div>
        )}
      </div>

      {/* Modal para solicitar devolución */}
      {showModal && ventaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Solicitar Devolución</h2>
              
              <div className="mb-4">
                <p className="text-gray-600">Venta: #{ventaSeleccionada.id_venta}</p>
                <p className="text-gray-600">Fecha: {new Date(ventaSeleccionada.fecha).toLocaleDateString()}</p>
              </div>

              <div className="space-y-4">
                {productosSeleccionados.map((producto) => (
                  <div key={producto.id_detalle_venta} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-600">IMG</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{producto.producto.nombre}</p>
                        <p className="text-sm text-gray-600">
                          ${producto.precio_unitario} - Disponible: {producto.cantidad_disponible}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad a devolver
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={producto.cantidad_disponible}
                          value={producto.cantidad_devolver}
                          onChange={(e) => handleCantidadChange(producto.id_detalle_venta, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Motivo de devolución
                        </label>
                        <input
                          type="text"
                          value={producto.motivo}
                          onChange={(e) => handleMotivoChange(producto.id_detalle_venta, e.target.value)}
                          placeholder="Ej: Producto defectuoso"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearDevolucion}
                  disabled={!productosSeleccionados.some(p => p.cantidad_devolver > 0 && p.motivo.trim())}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Enviar Solicitud
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
