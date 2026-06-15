import { useEffect, useState, useRef } from 'react'
import { 
  Search, Scan, Plus, Minus, Trash2, ShoppingCart, 
  CreditCard, DollarSign, QrCode, User as UserIcon, Package, Check
} from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/currencyFormatter'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { lealtadService } from '../../lib/lealtadService'
import { useAuthStore } from '../../store/useAuthStore'
import toast from 'react-hot-toast'


export default function CajeroDashboard() {
  const { profile } = useAuthStore()
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [filteredProductos, setFilteredProductos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchClienteTerm, setSearchClienteTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState(null)
  
  // Carrito de compras del cajero
  const [cartItems, setCartItems] = useState([])
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [loading, setLoading] = useState(false)
  const [isScannerActive, setIsScannerActive] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    loadProductos()
    loadClientes()
  }, [])

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredProductos(productos.slice(0, 10)) // Mostrar top 10 al inicio
    } else {
      setFilteredProductos(
        productos.filter(p => 
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
    }
  }, [searchTerm, productos])

  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .order('nombre')
      if (error) throw error
      setProductos(data || [])
      setFilteredProductos(data?.slice(0, 10) || [])
    } catch (error) {
      console.error('Error cargando productos:', error)
      toast.error('Error al cargar productos')
    }
  }

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .order('nombre')
      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  // Activa/desactiva el escáner de cámara
  const toggleScanner = () => {
    if (isScannerActive) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Error al apagar el scanner:', err))
        scannerRef.current = null
      }
      setIsScannerActive(false)
    } else {
      setIsScannerActive(true)
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          'reader',
          { 
            fps: 60, // Escaneo al máximo de cuadros por segundo de la cámara
            qrbox: (width, height) => {
              // Forzar límites mínimos de 130px de ancho y 50px de alto para evitar errores de la librería
              const w = Math.max(Math.min(width * 0.4, 130), 130)
              const h = Math.max(Math.min(height * 0.18, 60), 50)
              return { width: w, height: h }
            },
            rememberLastUsedCamera: true,
            aspectRatio: 1.777777778, // Relación de aspecto 16:9 para evitar cualquier deformación
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.QR_CODE
            ],
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          false
        )

        scanner.render(
          (decodedText) => {
            // Callback en caso de lectura exitosa
            const product = productos.find(p => p.codigo === decodedText)
            if (product) {
              addToCart(product)
              toast.success(`Escaneado: ${product.nombre}`)
              // Apagar el escáner automáticamente tras lectura exitosa
              scanner.clear().catch(err => console.error('Error:', err))
              setIsScannerActive(false)
            } else {
              toast.error(`Código [${decodedText}] no corresponde a ningún producto registrado.`)
            }
          },
          (error) => {
            // Ignorar errores repetitivos de escaneo buscando códigos
          }
        )
        scannerRef.current = scanner
      }, 300)
    }
  }

  // Cleanup de la cámara al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Cleanup scanner error:', err))
      }
    }
  }, [])

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Este producto se encuentra sin stock')
      return
    }

    setCartItems(prevItems => {
      const existing = prevItems.find(item => item.id_producto === product.id_producto)
      if (existing) {
        if (existing.cantidad >= product.stock) {
          toast.error(`Stock máximo alcanzado para ${product.nombre}`)
          return prevItems
        }
        return prevItems.map(item => 
          item.id_producto === product.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      } else {
        return [...prevItems, { ...product, cantidad: 1 }]
      }
    })
  }

  const updateCantidad = (id, amount) => {
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.id_producto === id) {
          const nuevaCantidad = item.cantidad + amount
          if (nuevaCantidad <= 0) return null
          if (nuevaCantidad > item.stock) {
            toast.error('Stock disponible excedido')
            return item
          }
          return { ...item, cantidad: nuevaCantidad }
        }
        return item
      }).filter(Boolean)
    )
  }

  const removeFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id_producto !== id))
  }

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
  }

  const getDescuentoNivel = () => {
    if (!selectedCliente || !selectedCliente.id_nivel_actual) return 0
    // Simulado u obtenido en base a la BD
    if (selectedCliente.tipo === 'Bronce') return 0.02
    if (selectedCliente.tipo === 'Plata') return 0.05
    if (selectedCliente.tipo === 'Oro') return 0.08
    if (selectedCliente.tipo === 'Diamante') return 0.12
    return 0
  }

  const getTotal = () => {
    const subtotal = getSubtotal()
    const descuento = subtotal * getDescuentoNivel()
    return Math.max(0, subtotal - descuento)
  }

  const handleFinalizarCompra = async () => {
    if (cartItems.length === 0) {
      toast.error('El carrito de compras está vacío')
      return
    }

    setLoading(true)
    try {
      // Registrar la venta en base de datos
      const totalVenta = getTotal()
      
      const { data: venta, error: ventaError } = await supabase
        .from('venta')
        .insert([{
          id_cliente: selectedCliente?.id_cliente || null, // Venta al paso si no se selecciona cliente
          id_empleado: profile?.id_empleado || 1,
          total: totalVenta,
          tipo_entrega: 'tienda',
          metodo_pago: metodoPago
        }])
        .select()
        .single()

      if (ventaError) throw ventaError

      // Insertar detalles de la venta
      const detalles = cartItems.map(item => ({
        id_venta: venta.id_venta,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }))

      const { error: detallesError } = await supabase
        .from('detalle_venta')
        .insert(detalles)

      if (detallesError) throw detallesError

      // Actualizar el stock en base de datos
      for (const item of cartItems) {
        await supabase
          .from('producto')
          .update({ stock: item.stock - item.cantidad })
          .eq('id_producto', item.id_producto)
      }

      // Si hay un cliente registrado, asignarle sus puntos de lealtad
      if (selectedCliente) {
        try {
          await lealtadService.registrarPuntosCompra(
            selectedCliente.id_cliente,
            venta.id_venta,
            totalVenta
          )
        } catch (lealtadError) {
          console.error('Error al registrar puntos:', lealtadError)
          toast.error('Venta registrada pero hubo un error asignando puntos')
        }
      }

      toast.success('¡Venta realizada correctamente!')
      setCartItems([])
      setSelectedCliente(null)
      setSearchClienteTerm('')
      loadProductos() // Recargar productos para actualizar stocks
    } catch (error) {
      console.error('Error al procesar la venta:', error)
      toast.error('Error al procesar la venta')
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
    (c.telefono && c.telefono.includes(searchClienteTerm)) ||
    (c.ci_ruc && c.ci_ruc.includes(searchClienteTerm))
  )

  return (
    <Layout type="cajero">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Izquierdo: Selección de Productos y Buscador (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="text-blue-600" />
                  Terminal de Caja
                </h1>
                <p className="text-sm text-gray-500">Busca por nombre o escanea el código de barras</p>
              </div>

              {/* Botón Escáner Cámara */}
              <div className="flex gap-2">
                <button
                  onClick={toggleScanner}
                  className={`btn flex items-center gap-2 ${
                    isScannerActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Scan size={18} />
                  {isScannerActive ? 'Cámara PC' : 'Usar Cámara PC'}
                </button>
              </div>
            </div>

            {/* Escáner Activo Container */}
            {isScannerActive && (
              <div className="bg-black rounded-xl p-4 mb-4 flex flex-col items-center justify-center">
                <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-blue-500" />
                <p className="text-white text-xs mt-2 text-center animate-pulse">
                  Coloca el código de barras frente a la cámara trasera
                </p>
              </div>
            )}

            {/* Input de Búsqueda manual */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Escribe el nombre o código de barras para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProductos.map(producto => (
              <div 
                key={producto.id_producto}
                onClick={() => addToCart(producto)}
                className={`card p-3 cursor-pointer hover:border-blue-500 transition-all border-2 flex flex-col justify-between ${
                  producto.stock <= 0 ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div>
                  <div className="aspect-w-16 aspect-h-9 w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-2 relative">
                    {producto.imagen_url ? (
                      <img src={producto.imagen_url} alt={producto.nombre} className="object-cover w-full h-24" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center">
                        <Package className="text-gray-400" size={32} />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      Stk: {producto.stock}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">{producto.nombre}</h3>
                  <p className="text-xs text-gray-400 mb-1">{producto.codigo || 'Sin código'}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(producto.precio)}</span>
                  <button className="bg-blue-50 text-blue-600 p-1 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Derecho: Carrito de Compras, Cliente y Pago (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Asignación de Cliente */}
          <div className="card space-y-4">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon className="text-blue-600" />
              Asignar Cliente (Opcional)
            </h2>
            
            {!selectedCliente ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Buscar por nombre, CI/RUC o Teléfono..."
                  value={searchClienteTerm}
                  onChange={(e) => setSearchClienteTerm(e.target.value)}
                  className="input w-full text-sm"
                />
                
                {searchClienteTerm && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg divide-y divide-gray-100 bg-white dark:bg-gray-800">
                    {filteredClientes.slice(0, 5).map(c => (
                      <div
                        key={c.id_cliente}
                        onClick={() => {
                          setSelectedCliente(c)
                          setSearchClienteTerm('')
                        }}
                        className="p-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">{c.nombre}</p>
                          <p className="text-xs text-gray-400">CI/RUC: {c.ci_ruc} | Tel: {c.telefono}</p>
                        </div>
                        <Check size={16} className="text-green-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center border border-blue-200">
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-300">{selectedCliente.nombre}</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Puntos acumulados: <strong className="text-sm">{selectedCliente.puntos_acumulados || 0}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCliente(null)}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* Carrito de Compra actual */}
          <div className="card flex flex-col justify-between min-h-[400px]">
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Items a Vender</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {cartItems.reduce((acc, i) => acc + i.cantidad, 0)} items
                </span>
              </h2>

              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Agrega productos al carrito para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {cartItems.map(item => (
                    <div key={item.id_producto} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold text-sm truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.precio)} x {item.cantidad}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => updateCantidad(item.id_producto, -1)}
                          className="p-1 bg-white dark:bg-gray-700 border rounded"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.cantidad}</span>
                        <button 
                          onClick={() => updateCantidad(item.id_producto, 1)}
                          className="p-1 bg-white dark:bg-gray-700 border rounded"
                        >
                          <Plus size={12} />
                        </button>
                        
                        <button 
                          onClick={() => removeFromCart(item.id_producto)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totalizadores y Métodos de Pago */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                {selectedCliente && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento Nivel ({selectedCliente.tipo}):</span>
                    <span>-{formatCurrency(getSubtotal() * getDescuentoNivel())}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold border-t pt-2">
                  <span>Total a Pagar:</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              {/* Selección del Método de Pago */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Método de Pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { id: 'qr', label: 'Código QR', icon: QrCode }
                  ].map(m => {
                    const Icon = m.icon
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMetodoPago(m.id)}
                        className={`p-2 border rounded-lg flex flex-col items-center gap-1 transition-all ${
                          metodoPago === m.id 
                            ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-xs font-semibold">{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Botón Finalizar */}
              <button
                onClick={handleFinalizarCompra}
                disabled={loading || cartItems.length === 0}
                className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-bold shadow-lg"
              >
                {loading ? <div className="spinner" /> : 'Registrar Venta'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}
