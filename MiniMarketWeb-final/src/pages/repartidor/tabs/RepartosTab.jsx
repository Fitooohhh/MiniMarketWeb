import { useEffect, useState } from 'react'
import { Package, MapPin, Phone, Calendar, Truck, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '../../../lib/currencyFormatter'
import toast from 'react-hot-toast'
import DeliveryModal from '../components/DeliveryModal'

export default function RepartosTab({ profile, notificaciones, onMarkAsRead }) {
  const [repartos, setRepartos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReparto, setSelectedReparto] = useState(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pendiente')

  useEffect(() => {
    loadRepartos()
    // Recargar cada 10 segundos de forma silenciosa para no deshabilitar la interfaz ni desmostar modales
    const interval = setInterval(() => loadRepartos(true), 10000)
    return () => clearInterval(interval)
  }, [profile?.id_empleado, filterStatus])

  const loadRepartos = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      let query = supabase
        .from('reparto')
        .select(`
          *,
          venta:id_venta (
            id_venta,
            total,
            fecha,
            direccion_envio,
            latitud,
            longitud,
            cliente:id_cliente (
              nombre,
              telefono,
              direccion
            ),
            detalle_venta:detalle_venta (
              id_detalle_venta,
              id_producto,
              cantidad,
              precio_unitario,
              producto:id_producto (
                nombre,
                imagen_url
              )
            )
          )
        `)
        .eq('id_empleado', profile.id_empleado)

      if (filterStatus !== 'todos') {
        query = query.eq('estado', filterStatus)
      }

      const { data, error } = await query.order('fecha', { ascending: false })

      if (error) throw error
      setRepartos(data || [])
    } catch (error) {
      console.error('Error loading repartos:', error)
      toast.error('Error al cargar los repartos')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  const handleRecoger = async (reparto) => {
    try {
      const { error } = await supabase
        .from('reparto')
        .update({ estado: 'recogido' })
        .eq('id_reparto', reparto.id_reparto)

      if (error) throw error

      setRepartos(prev =>
        prev.map(r =>
          r.id_reparto === reparto.id_reparto
            ? { ...r, estado: 'recogido' }
            : r
        )
      )
      toast.success('Pedido recogido')
    } catch (error) {
      console.error('Error updating reparto:', error)
      toast.error('Error al actualizar el pedido')
    }
  }

  const handleEntregado = async (reparto) => {
    try {
      const { error: repartError } = await supabase
        .from('reparto')
        .update({ estado: 'entregado' })
        .eq('id_reparto', reparto.id_reparto)

      const { error: ventaError } = await supabase
        .from('venta')
        .update({ estado: 'entregado' })
        .eq('id_venta', reparto.id_venta)

      if (repartError || ventaError) throw repartError || ventaError

      setRepartos(prev =>
        prev.map(r =>
          r.id_reparto === reparto.id_reparto
            ? { ...r, estado: 'entregado' }
            : r
        )
      )
      setShowDeliveryModal(false)
      setSelectedReparto(null)
      toast.success('Pedido entregado')
    } catch (error) {
      console.error('Error updating reparto:', error)
      toast.error('Error al marcar como entregado')
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      case 'recogido':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
      case 'entregado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
    }
  }

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente'
      case 'recogido':
        return 'Recogido'
      case 'entregado':
        return 'Entregado'
      default:
        return estado
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        {['pendiente', 'recogido', 'entregado', 'todos'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de Repartos */}
      {repartos.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay repartos {filterStatus !== 'todos' ? `${filterStatus}s` : ''}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {repartos.map(reparto => (
            <div
              key={reparto.id_reparto}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Pedido #{reparto.venta?.id_venta}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(reparto.venta?.fecha), 'dd/MM/yyyy HH:mm', {
                      locale: es,
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(
                    reparto.estado
                  )}`}
                >
                  {getEstadoLabel(reparto.estado)}
                </span>
              </div>

              {/* Cliente Info */}
              <div className="bg-white dark:bg-gray-800 rounded p-3 mb-4">
                <div className="flex items-start gap-3 mb-2">
                  <Phone className="w-4 h-4 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {reparto.venta?.cliente?.nombre}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {reparto.venta?.cliente?.telefono}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary-600 mt-1 flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {reparto.venta?.direccion_envio ||
                      reparto.venta?.cliente?.direccion}
                  </p>
                </div>
              </div>

              {/* Productos */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Productos:
                </p>
                <div className="space-y-2">
                  {reparto.venta?.detalle_venta?.map(item => (
                    <div
                      key={item.id_detalle_venta}
                      className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span>
                        {item.producto?.nombre} x{item.cantidad}
                      </span>
                      <span>{formatCurrency(item.precio_unitario * item.cantidad)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(reparto.venta?.total || 0)}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                {reparto.estado === 'pendiente' && (
                  <button
                    onClick={() => handleRecoger(reparto)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Recoger
                  </button>
                )}
                {reparto.estado === 'recogido' && (
                  <button
                    onClick={() => {
                      setSelectedReparto(reparto)
                      setShowDeliveryModal(true)
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Entregar
                  </button>
                )}
                {reparto.estado === 'entregado' && (
                  <button
                    disabled
                    className="flex-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Entregado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedReparto && (
        <DeliveryModal
          reparto={selectedReparto}
          onClose={() => {
            setShowDeliveryModal(false)
            setSelectedReparto(null)
          }}
          onDelivered={() => handleEntregado(selectedReparto)}
        />
      )}
    </div>
  )
}
