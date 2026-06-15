import { useEffect, useState } from 'react'
import { Package, MapPin, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ClientePedidos() {
  const { profile } = useAuthStore()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [detalles, setDetalles] = useState([])

  useEffect(() => {
    loadPedidos()
  }, [])

  const loadPedidos = async () => {
    try {
      if (!profile?.id_cliente) {
        console.error('No se encontró id_cliente en el perfil')
        setLoading(false)
        return
      }

      // Cargar ventas del cliente con información del empleado y reparto
      const { data: ventas, error } = await supabase
        .from('venta')
        .select(`
          *,
          empleado:id_empleado(nombre),
          reparto(estado, empleado:id_empleado(nombre))
        `)
        .eq('id_cliente', profile.id_cliente)
        .order('fecha', { ascending: false })

      if (error) throw error

      // Formatear datos para compatibilidad con el componente
      const pedidosFormateados = ventas?.map(venta => ({
        id: venta.id_venta,
        codigo: `PED-${String(venta.id_venta).padStart(5, '0')}`,
        fecha_pedido: venta.fecha,
        total: venta.total,
        estado: venta.reparto?.[0]?.estado || 'entregado',
        empleado_nombre: venta.reparto?.[0]?.empleado?.nombre || venta.empleado?.nombre,
        tipo_entrega: 'domicilio', // Por defecto, ya que no está en el esquema
        direccion_entrega: null
      })) || []

      setPedidos(pedidosFormateados)
    } catch (error) {
      console.error('Error loading pedidos:', error)
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const loadDetalles = async (pedidoId) => {
    try {
      const { data, error } = await supabase
        .from('detalle_venta')
        .select(`
          *,
          producto:id_producto(nombre, imagen_url)
        `)
        .eq('id_venta', pedidoId)

      if (error) throw error

      // Formatear detalles para compatibilidad
      const detallesFormateados = data?.map(detalle => ({
        id: detalle.id_detalle_venta,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: (detalle.cantidad * detalle.precio_unitario).toFixed(2),
        productos: {
          nombre: detalle.producto?.nombre,
          imagen_url: detalle.producto?.imagen_url
        }
      })) || []

      setDetalles(detallesFormateados)
    } catch (error) {
      console.error('Error loading detalles:', error)
      toast.error('Error al cargar detalles del pedido')
    }
  }

  const cancelarPedido = async (pedidoId) => {
    if (!confirm('¿Estás seguro de cancelar este pedido?')) return

    try {
      // Actualizar el estado del reparto asociado a cancelado
      const { error } = await supabase
        .from('reparto')
        .update({ estado: 'cancelado' })
        .eq('id_venta', pedidoId)

      if (error) throw error

      toast.success('Pedido cancelado')
      loadPedidos()
      setSelectedPedido(null)
    } catch (error) {
      console.error('Error canceling pedido:', error)
      toast.error('Error al cancelar pedido')
    }
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { class: 'badge badge-warning', icon: Clock },
      preparacion: { class: 'badge badge-info', icon: Package },
      reparto: { class: 'badge bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Truck },
      entregado: { class: 'badge badge-success', icon: CheckCircle },
      cancelado: { class: 'badge badge-danger', icon: XCircle },
    }
    return badges[estado] || { class: 'badge', icon: Package }
  }

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      preparacion: 'En Preparación',
      reparto: 'En Reparto',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    }
    return labels[estado] || estado
  }

  const handleVerDetalles = (pedido) => {
    setSelectedPedido(pedido)
    loadDetalles(pedido.id)
  }

  return (
    <Layout type="cliente">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mis Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Historial y seguimiento de tus compras
          </p>
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No tienes pedidos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Cuando realices una compra, aparecerá aquí
            </p>
            <button
              onClick={() => window.location.href = '/cliente/catalogo'}
              className="btn btn-primary inline-flex items-center"
            >
              <Package className="w-5 h-5 mr-2" />
              Ver Catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const estadoInfo = getEstadoBadge(pedido.estado)
              const EstadoIcon = estadoInfo.icon

              return (
                <div key={pedido.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Info del pedido */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Package className="w-5 h-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {pedido.codigo}
                        </h3>
                        <span className={estadoInfo.class}>
                          <EstadoIcon className="w-3 h-3 inline mr-1" />
                          {getEstadoLabel(pedido.estado)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-2" />
                          Fecha: {format(new Date(pedido.fecha_pedido), 'dd/MM/yyyy HH:mm')}
                        </div>
                        
                        {pedido.tipo_entrega === 'domicilio' && pedido.direccion_entrega && (
                          <div className="flex items-start text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                            <span>{pedido.direccion_entrega}</span>
                          </div>
                        )}
                        
                        {pedido.tipo_entrega === 'tienda' && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>Recoger en tienda</span>
                          </div>
                        )}

                        {pedido.empleado_nombre && (
                          <div className="text-gray-600 dark:text-gray-400">
                            Repartidor: {pedido.empleado_nombre}
                          </div>
                        )}

                        <div className="font-semibold text-primary-600 text-lg">
                          Total: Bs {pedido.total}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      <button
                        onClick={() => handleVerDetalles(pedido)}
                        className="btn btn-secondary text-sm"
                      >
                        Ver Detalles
                      </button>
                      
                      {pedido.estado === 'pendiente' && (
                        <button
                          onClick={() => cancelarPedido(pedido.id)}
                          className="btn btn-danger text-sm"
                        >
                          Cancelar Pedido
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de detalles */}
        {selectedPedido && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="card max-w-2xl w-full my-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detalles del Pedido
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedPedido.codigo}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPedido(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Productos */}
              <div className="space-y-3 mb-4">
                {detalles.map((detalle) => (
                  <div key={detalle.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {detalle.productos?.imagen_url ? (
                      <img 
                        src={detalle.productos.imagen_url} 
                        alt={detalle.productos.nombre}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {detalle.productos?.nombre}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cantidad: {detalle.cantidad} × Bs {detalle.precio_unitario}
                      </p>
                      <p className="text-sm font-semibold text-primary-600">
                        Subtotal: Bs {detalle.subtotal}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">Bs {selectedPedido.total}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPedido(null)}
                className="btn btn-secondary w-full mt-4"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
