import { useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, Package, MapPin, Store, Star } from 'lucide-react'
import Layout from '../../components/Layout'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/currencyFormatter'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PaymentMethodModal from './components/PaymentMethodModal'
import LocationModal from './components/LocationModal'
import { useLealtadPoints } from '../../hooks/useLealtadPoints'

export default function ClienteCarrito() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore()
  const { registrarPuntosCompra, calcularPuntosFuturos } = useLealtadPoints()
  const [loading, setLoading] = useState(false)
  const [tipoEntrega, setTipoEntrega] = useState('domicilio')
  const [direccionEntrega, setDireccionEntrega] = useState(profile?.direccion || '')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  
  // Calcular puntos que se ganarán con la compra actual
  const puntosGanados = calcularPuntosFuturos(getTotal())

  const handleUpdateQuantity = (productoId, newQuantity) => {
    if (newQuantity < 1) return
    updateQuantity(productoId, newQuantity)
  }

  const handleFinalizarCompra = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (tipoEntrega === 'domicilio' && !direccionEntrega.trim()) {
      toast.error('Por favor ingresa una dirección de entrega')
      return
    }

    // Mostrar modal de pago
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async (paymentData) => {
    setSelectedPayment(paymentData)
    setShowPaymentModal(false)
    setLoading(true)

    try {
      if (!profile?.id_cliente) {
        toast.error('Error: No se encontró información del cliente')
        return
      }

      // Obtener un empleado para asignar a la venta (requerido por el esquema)
      const { data: empleados } = await supabase
        .from('empleado')
        .select('id_empleado')
        .limit(1)

      if (!empleados || empleados.length === 0) {
        toast.error('Error: No hay empleados disponibles')
        return
      }

      // Crear la venta
      const { data: venta, error: ventaError } = await supabase
        .from('venta')
        .insert([
          {
            id_cliente: profile.id_cliente,
            id_empleado: empleados[0].id_empleado,
            total: getTotal() + (tipoEntrega === 'domicilio' ? 2 : 0),
            tipo_entrega: tipoEntrega,
            direccion_envio: tipoEntrega === 'domicilio' ? direccionEntrega : null,
            latitud: selectedLocation?.location?.lat || null,
            longitud: selectedLocation?.location?.lng || null,
          }
        ])
        .select()
        .single()

      if (ventaError) throw ventaError

      // Crear los detalles de la venta
      const detalles = items.map(item => ({
        id_venta: venta.id_venta,
        id_producto: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_con_descuento || item.precio,
      }))

      const { error: detallesError } = await supabase
        .from('detalle_venta')
        .insert(detalles)

      if (detallesError) throw detallesError

      // Actualizar stock de productos
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('producto')
          .update({ stock: item.stock - item.cantidad })
          .eq('id_producto', item.id)

        if (stockError) throw stockError
      }

      // Si es entrega a domicilio, crear reparto
      if (tipoEntrega === 'domicilio') {
        await supabase
          .from('reparto')
          .insert([{
            id_empleado: empleados[0].id_empleado,
            id_venta: venta.id_venta,
            estado: 'pendiente'
          }])
      }

      // Registrar puntos de lealtad por la compra
      try {
        await registrarPuntosCompra(venta.id_venta, getTotal())
      } catch (error) {
        console.error('Error al registrar puntos:', error)
        // No mostrar error al usuario ya que la compra se completó exitosamente
      }

      toast.success('¡Pedido realizado exitosamente!')
      clearCart()
      navigate('/cliente/pedidos')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Error al procesar el pedido')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <Layout type="cliente">
        <div className="card text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Tu carrito está vacío
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Agrega productos desde el catálogo
          </p>
          <button
            onClick={() => navigate('/cliente/catalogo')}
            className="btn btn-primary inline-flex items-center"
          >
            <Package className="w-5 h-5 mr-2" />
            Ver Catálogo
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout type="cliente">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Carrito de Compras
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card">
                <div className="flex gap-4">
                  {/* Imagen */}
                  <div className="flex-shrink-0">
                    {item.imagen_url ? (
                      <img 
                        src={item.imagen_url} 
                        alt={item.nombre}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.nombre}
                    </h3>
                    
                    {/* Precio */}
                    <div className="flex items-center gap-2 mb-3">
                      {item.precio_con_descuento ? (
                        <>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(item.precio_con_descuento)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(item.precio)}
                          </span>
                          <span className="badge badge-danger text-xs">
                            -{item.descuento_porcentaje}%
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(item.precio)}
                        </span>
                      )}
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 font-semibold">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 flex items-center text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Subtotal
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency((item.precio_con_descuento || item.precio) * item.cantidad)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen y checkout */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Resumen del Pedido
              </h2>

              {/* Tipo de entrega */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de entrega
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary-500">
                    <input
                      type="radio"
                      name="tipoEntrega"
                      value="domicilio"
                      checked={tipoEntrega === 'domicilio'}
                      onChange={(e) => setTipoEntrega(e.target.value)}
                      className="mr-3"
                    />
                    <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                    <span className="text-sm font-medium">Entrega a domicilio</span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary-500">
                    <input
                      type="radio"
                      name="tipoEntrega"
                      value="tienda"
                      checked={tipoEntrega === 'tienda'}
                      onChange={(e) => setTipoEntrega(e.target.value)}
                      className="mr-3"
                    />
                    <Store className="w-5 h-5 mr-2 text-primary-600" />
                    <span className="text-sm font-medium">Recoger en tienda</span>
                  </label>
                </div>
              </div>

              {/* Dirección de entrega */}
              {tipoEntrega === 'domicilio' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección de entrega
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={direccionEntrega}
                      onChange={(e) => setDireccionEntrega(e.target.value)}
                      className="input"
                      rows="3"
                      placeholder="Ingresa tu dirección completa"
                    />
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="btn btn-secondary w-full text-sm flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Seleccionar en mapa
                    </button>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(getTotal())}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Envío</span>
                  <span className="font-semibold">
                    {tipoEntrega === 'domicilio' ? formatCurrency(2) : 'Gratis'}
                  </span>
                </div>
                
                {/* Puntos de lealtad */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-purple-900 dark:text-purple-100">
                        Puntos de Lealtad
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        +{puntosGanados}
                      </span>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        puntos ganados
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                    ¡Gana {puntosGanados} puntos con esta compra! (50% del total)
                  </p>
                </div>
                
                <div className="flex justify-between text-lg font-bold mt-4">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {formatCurrency(getTotal() + (tipoEntrega === 'domicilio' ? 2 : 0))}
                  </span>
                </div>
              </div>

              {/* Botón finalizar compra */}
              <button
                onClick={handleFinalizarCompra}
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Finalizar Compra
                  </>
                )}
              </button>

              <button
                onClick={clearCart}
                className="btn btn-secondary w-full mt-2"
              >
                Vaciar Carrito
              </button>
            </div>
          </div>
        </div>

        {/* Modal de ubicación */}
        {showLocationModal && (
          <LocationModal
            onClose={() => setShowLocationModal(false)}
            onConfirm={(locationData) => {
              setDireccionEntrega(locationData.address)
              setSelectedLocation(locationData)
              setShowLocationModal(false)
            }}
            defaultAddress={direccionEntrega}
          />
        )}

        {/* Modal de métodos de pago */}
        {showPaymentModal && (
          <PaymentMethodModal
            total={getTotal() + (tipoEntrega === 'domicilio' ? 2 : 0)}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={handlePaymentConfirm}
          />
        )}
      </div>
    </Layout>
  )
}
