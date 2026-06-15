import { useEffect, useState } from 'react'
import { Package, MapPin, Phone, Camera, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function EmpleadoPedidos() {
  const { profile } = useAuthStore()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    loadPedidos()
  }, [])

  const loadPedidos = async () => {
    try {
      // Cargar ventas con datos del cliente
      const { data, error } = await supabase
        .from('venta')
        .select(`
          *,
          cliente:id_cliente(
            nombre,
            telefono,
            direccion
          )
        `)
        .eq('id_empleado', profile.id_empleado)
        .order('fecha', { ascending: false })

      if (error) throw error
      setPedidos(data || [])
    } catch (error) {
      console.error('Error loading pedidos:', error)
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const updateEstado = async (ventaId, nuevoEstado) => {
    try {
      // Actualizar el reparto asociado a la venta
      const { error } = await supabase
        .from('reparto')
        .update({ 
          estado: nuevoEstado
        })
        .eq('id_venta', ventaId)

      if (error) throw error

      toast.success('Estado actualizado')
      setObservaciones('')
      setSelectedPedido(null)
      loadPedidos()
    } catch (error) {
      console.error('Error updating estado:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge badge-warning',
      preparacion: 'badge badge-info',
      reparto: 'badge bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      entregado: 'badge badge-success',
      cancelado: 'badge badge-danger',
    }
    return badges[estado] || 'badge'
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

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mis Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las entregas asignadas
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
              No hay pedidos asignados
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Cuando se te asignen pedidos, aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id_venta} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Info del pedido */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Package className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pedido.codigo}
                      </h3>
                      <span className={getEstadoBadge(pedido.estado)}>
                        {getEstadoLabel(pedido.estado)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="font-medium mr-2">Cliente:</span>
                        {pedido.cliente_nombre}
                      </div>
                      {pedido.cliente_telefono && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4 mr-2" />
                          {pedido.cliente_telefono}
                        </div>
                      )}
                      {pedido.tipo_entrega === 'domicilio' && pedido.direccion_entrega && (
                        <div className="flex items-start text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                          <span>{pedido.direccion_entrega}</span>
                        </div>
                      )}
                      <div className="text-gray-500 dark:text-gray-500">
                        Fecha: {pedido.fecha ? format(new Date(pedido.fecha), 'dd/MM/yyyy HH:mm') : 'Sin fecha'}
                      </div>
                      <div className="font-semibold text-primary-600">
                        Total: Bs {pedido.total}
                      </div>
                    </div>

                    {pedido.observaciones && (
                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                        <span className="font-medium">Observaciones:</span> {pedido.observaciones}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
                    <div className="flex flex-col gap-2 lg:w-48">
                      {pedido.estado === 'pendiente' && (
                        <button
                          onClick={() => updateEstado(pedido.id_venta, 'preparacion')}
                          className="btn btn-primary text-sm"
                        >
                          Iniciar Preparación
                        </button>
                      )}
                      {pedido.estado === 'preparacion' && (
                        <button
                          onClick={() => updateEstado(pedido.id_venta, 'reparto')}
                          className="btn btn-primary text-sm"
                        >
                          Iniciar Reparto
                        </button>
                      )}
                      {pedido.estado === 'reparto' && (
                        <>
                          <button
                            onClick={() => setSelectedPedido(pedido)}
                            className="btn btn-primary text-sm flex items-center justify-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar Entregado
                          </button>
                          <button
                            onClick={() => updateEstado(pedido.id_venta, 'cancelado')}
                            className="btn btn-danger text-sm flex items-center justify-center"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para confirmar entrega */}
        {selectedPedido && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Confirmar Entrega
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Pedido: {selectedPedido.codigo}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Agregar comentarios sobre la entrega..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedPedido(null)
                    setObservaciones('')
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => updateEstado(selectedPedido.id_venta, 'entregado')}
                  className="btn btn-primary flex-1"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
