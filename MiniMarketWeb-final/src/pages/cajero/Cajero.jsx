import { useEffect, useState, useRef } from 'react'
import { 
  Search, Scan, Plus, Minus, Trash2, ShoppingCart, 
  CreditCard, DollarSign, QrCode, User as UserIcon, Package, Check,
  Clock, X
} from 'lucide-react'
import { format } from 'date-fns'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/currencyFormatter'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { lealtadService } from '../../lib/lealtadService'
import { useAuthStore } from '../../store/useAuthStore'
import toast from 'react-hot-toast'
import PaymentMethodModal from '../cliente/components/PaymentMethodModal'
import { verificarGeofencing } from '../../lib/geofencing'


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
  const [loading, setLoading] = useState(false)
  const [isScannerActive, setIsScannerActive] = useState(false)
  const scannerRef = useRef(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Asistencia & Geofencing
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false)
  const [asistenciaHoy, setAsistenciaHoy] = useState(null)
  const [loadingAsistencia, setLoadingAsistencia] = useState(false)
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false)

  const getEmpId = async () => {
    if (!profile) return null
    if (profile.id_empleado) return profile.id_empleado
    
    try {
      const { data } = await supabase
        .from('empleado')
        .select('id_empleado')
        .eq('id_usuario', profile.id_usuario)
        .maybeSingle()
      return data?.id_empleado || null
    } catch (e) {
      console.error('Error fetching employee ID:', e)
      return null
    }
  }

  const loadAsistencia = async () => {
    if (!profile) return
    try {
      setLoadingAsistencia(true)
      const empId = await getEmpId()
      if (!empId) return

      const hoy = format(new Date(), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('id_empleado', empId)
        .eq('fecha', hoy)
        .maybeSingle()
      setAsistenciaHoy(data)
    } catch (e) {
      console.error('Error loading attendance:', e)
    } finally {
      setLoadingAsistencia(false)
    }
  }

  useEffect(() => {
    if (showAsistenciaModal) {
      loadAsistencia()
    }
  }, [showAsistenciaModal])

  const marcarEntrada = async () => {
    try {
      setRegistrandoAsistencia(true)
      const hoy = format(new Date(), 'yyyy-MM-dd')
      
      const empId = await getEmpId()
      if (!empId) {
        toast.error('No se pudo encontrar tu perfil de empleado. Por favor cierra sesión y vuelve a ingresar.')
        return
      }

      let latitud = null
      let longitud = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          })
          latitud = position.coords.latitude
          longitud = position.coords.longitude
        } catch (error) {
          toast.error('No se pudo obtener tu ubicación GPS para verificar el Geo-fencing. Activa la ubicación.')
          return
        }
      } else {
        toast.error('Tu navegador no soporta geolocalización.')
        return
      }

      try {
        verificarGeofencing(latitud, longitud)
      } catch (geoError) {
        toast.error(geoError.message)
        return
      }

      const { error } = await supabase
        .from('asistencia')
        .insert([
          {
            id_empleado: empId,
            fecha: hoy,
            hora_entrada: new Date().toISOString()
          }
        ])

      if (error) throw error

      toast.success('Entrada registrada exitosamente')
      loadAsistencia()
    } catch (error) {
      console.error('Error marking entrada:', error)
      toast.error(error.message || 'Error al registrar entrada')
    } finally {
      setRegistrandoAsistencia(false)
    }
  }

  const marcarSalida = async () => {
    try {
      setRegistrandoAsistencia(true)
      
      const empId = await getEmpId()
      if (!empId) {
        toast.error('No se pudo encontrar tu perfil de empleado. Por favor cierra sesión y vuelve a ingresar.')
        return
      }

      let latitud = null
      let longitud = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          })
          latitud = position.coords.latitude
          longitud = position.coords.longitude
        } catch (error) {
          toast.error('No se pudo obtener tu ubicación GPS para verificar el Geo-fencing. Activa la ubicación.')
          return
        }
      } else {
        toast.error('Tu navegador no soporta geolocalización.')
        return
      }

      try {
        verificarGeofencing(latitud, longitud)
      } catch (geoError) {
        toast.error(geoError.message)
        return
      }

      const { error } = await supabase
        .from('asistencia')
        .update({
          hora_salida: new Date().toISOString()
        })
        .eq('id_asistencia', asistenciaHoy.id_asistencia)

      if (error) throw error

      toast.success('Salida registrada exitosamente')
      loadAsistencia()
    } catch (error) {
      console.error('Error marking salida:', error)
      toast.error(error.message || 'Error al registrar salida')
    } finally {
      setRegistrandoAsistencia(false)
    }
  }

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

  // Helper para convertir números a letras en español
  const numeroALetras = (num) => {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = {
      11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
      16: 'DIECISEIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
      21: 'VEINTIUNO', 22: 'VEINTIDOS', 23: 'VEINTITRES', 24: 'VEINTICUATRO',
      25: 'VEINTICINCO', 26: 'VEINTISEIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
    };
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertirGrupo(n) {
      if (n === 0) return '';
      let output = '';
      const c = Math.floor(n / 100);
      const restoC = n % 100;
      if (c > 0) {
        if (c === 1 && restoC === 0) {
          output += 'CIEN ';
        } else {
          output += centenas[c] + ' ';
        }
      }
      if (restoC > 0) {
        if (especiales[restoC]) {
          output += especiales[restoC] + ' ';
        } else {
          const d = Math.floor(restoC / 10);
          const u = restoC % 10;
          if (d > 0) {
            output += decenas[d];
            if (u > 0) output += ' Y ';
          }
          if (u > 0) {
            output += unidades[u];
          }
          output += ' ';
        }
      }
      return output.trim();
    }

    const entero = Math.floor(num);
    const centavos = Math.round((num - entero) * 100);
    const centavosStr = centavos.toString().padStart(2, '0') + '/100';

    if (entero === 0) return `CERO ${centavosStr}`;

    let texto = '';
    const miles = Math.floor(entero / 1000);
    const restoM = entero % 1000;

    if (miles > 0) {
      if (miles === 1) {
        texto += 'MIL ';
      } else {
        texto += convertirGrupo(miles) + ' MIL ';
      }
    }
    if (restoM > 0) {
      texto += convertirGrupo(restoM);
    }
    return `${texto.trim()} ${centavosStr}`;
  };

  const imprimirFactura = (venta, detalles, cliente, payData) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const fecha = new Date().toLocaleDateString('es-BO');
    const facturaNro = venta.id_venta;
    const total = venta.total;
    const totalLetras = numeroALetras(total);
    const efectivo = payData.method === 'efectivo' ? payData.amount : total;
    const cambio = payData.method === 'efectivo' ? payData.change : 0;
    let metodoPagoLabel = 'EFECTIVO';
    if (payData.method === 'qr') {
      metodoPagoLabel = 'QR';
    } else if (payData.method === 'tarjeta_credito' || payData.method === 'tarjeta_debito') {
      metodoPagoLabel = 'TARJETA';
    }

    const itemsHtml = detalles.map(item => {
      const prod = productos.find(p => p.id_producto === item.id_producto) || {};
      const sub = item.precio_unitario * item.cantidad;
      return `
        <tr>
          <td style="text-align: left; padding: 4px 0;">${prod.nombre || 'Producto'}</td>
          <td style="text-align: center; padding: 4px 0;">${item.cantidad}</td>
          <td style="text-align: right; padding: 4px 0;">${formatCurrency(item.precio_unitario)}</td>
          <td style="text-align: right; padding: 4px 0;">${formatCurrency(sub)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Factura de Venta</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              width: 72mm;
              margin: 0 auto;
              padding: 10px 0;
              text-align: center;
            }
            .bold { font-weight: bold; }
            .header { margin-bottom: 10px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { border-bottom: 1px dashed #000; padding: 4px 0; font-weight: bold; }
            .totals { text-align: right; margin-top: 10px; font-size: 11px; }
            .totals-table { width: 100%; }
            .totals-table td { padding: 2px 0; }
            .footer { font-size: 9px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="bold" style="font-size: 13px;">MiniMarket El Papi</div>
            <div>SUCURSAL 1</div>
            <div>Av. Emilio Mendizabal #309</div>
            <div>TELEFONO: 70333911</div>
            <div>Sucre - Bolivia</div>
            <div class="divider"></div>
            <div class="bold">FACTURA</div>
            <div>(Con derecho a Crédito Fiscal)</div>
            <div>N.I.T.: 7569748015</div>
            <div>FACTURA N°: ${facturaNro}</div>
            <div class="divider"></div>
            <div style="font-size: 9px;">VENTA DE UNA GRAN VARIEDAD DE PRODUCTOS</div>
            <div class="divider"></div>
          </div>
          
          <div style="text-align: left; font-size: 10px; line-height: 1.4;">
            <div><span class="bold">FECHA:</span> ${fecha}</div>
            <div><span class="bold">SEÑOR(S):</span> ${(cliente?.nombre || 'CLIENTE CASUAL').toUpperCase()}</div>
            <div><span class="bold">NIT/CI:</span> ${cliente?.ci_ruc || '0'}</div>
            <div><span class="bold">COD. CLIENTE:</span> ${cliente?.id_cliente || '0'}</div>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 45%;">Descripción</th>
                <th style="text-align: center; width: 15%;">Cant.</th>
                <th style="text-align: right; width: 20%;">P.unit</th>
                <th style="text-align: right; width: 20%;">P. Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="totals">
            <table class="totals-table">
              <tr>
                <td style="text-align: left;" class="bold">SUB TOTAL</td>
                <td style="text-align: right;">${formatCurrency(total)}</td>
              </tr>
              <tr>
                <td style="text-align: left;" class="bold">TOTAL FACTURA</td>
                <td style="text-align: right;" class="bold">${formatCurrency(total)}</td>
              </tr>
              <tr>
                <td style="text-align: left;">${metodoPagoLabel}</td>
                <td style="text-align: right;">${formatCurrency(efectivo)}</td>
              </tr>
              <tr>
                <td style="text-align: left;">CAMBIO</td>
                <td style="text-align: right;">${formatCurrency(cambio)}</td>
              </tr>
            </table>
          </div>
          
          <div class="divider"></div>
          
          <div style="text-align: left; font-size: 10px; margin-top: 5px;">
            <span class="bold">SON:</span> ${totalLetras.toUpperCase()}
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div>Código de control: 27-24-1D-2A</div>
            <div>Fecha límite de emisión: 14/09/2026</div>
            <br>
            <div class="bold">"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO DE ÉSTA SERÁ SANCIONADO DE ACUERDO A LEY"</div>
          </div>
        </body>
      </html>
    `;
    
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  const handleFinalizarCompra = async (payData) => {
    if (cartItems.length === 0) {
      toast.error('El carrito de compras está vacío')
      return
    }

    setLoading(true)
    try {
      const totalVenta = getTotal()
      
      const { data: venta, error: ventaError } = await supabase
        .from('venta')
        .insert([{
          id_cliente: selectedCliente?.id_cliente || null, // Venta al paso si no se selecciona cliente
          id_empleado: profile?.id_empleado || 1,
          total: totalVenta,
          tipo_entrega: 'tienda',
          metodo_pago: payData.method
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
        }
      }

      // Imprimir factura
      try {
        imprimirFactura(venta, detalles, selectedCliente, payData)
      } catch (printError) {
        console.error('Error al imprimir factura:', printError)
        toast.error('Venta registrada pero hubo un problema al imprimir la factura')
      }

      toast.success('¡Venta registrada correctamente!')
      setCartItems([])
      setSelectedCliente(null)
      setSearchClienteTerm('')
      loadProductos() // Recargar productos para actualizar stocks
    } catch (error) {
      console.error('Error al procesar la venta:', error)
      toast.error('Error al procesar la venta')
    } finally {
      setLoading(false)
      setShowPaymentModal(false)
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

              {/* Botones de Escáner y Asistencia */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAsistenciaModal(true)}
                  className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 font-semibold"
                >
                  <Clock size={18} />
                  Asistencia
                </button>
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

              {/* Botón Finalizar */}
              <button
                onClick={() => {
                  if (cartItems.length === 0) {
                    toast.error('El carrito de compras está vacío')
                    return
                  }
                  setShowPaymentModal(true)
                }}
                disabled={loading || cartItems.length === 0}
                className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-bold shadow-lg"
              >
                {loading ? <div className="spinner" /> : 'Registrar Venta'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de métodos de pago */}
      {showPaymentModal && (
        <PaymentMethodModal
          total={getTotal()}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleFinalizarCompra}
        />
      )}

      {/* Modal de Asistencia */}
      {showAsistenciaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full overflow-hidden transition-all transform scale-100">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Control de Asistencia
              </h3>
              <button
                onClick={() => setShowAsistenciaModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {loadingAsistencia ? (
                <div className="flex flex-col items-center py-8">
                  <div className="spinner w-8 h-8 text-blue-600 border-2 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verificando estado actual...</p>
                </div>
              ) : asistenciaHoy ? (
                <div className="space-y-4">
                  {/* Entrada registrada */}
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Entrada Registrada</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(asistenciaHoy.hora_entrada), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Salida */}
                  {asistenciaHoy.hora_salida ? (
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Salida Registrada</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(asistenciaHoy.hora_salida), 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={marcarSalida}
                      disabled={registrandoAsistencia}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-blue-500/10"
                    >
                      {registrandoAsistencia ? (
                        <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Clock className="w-5 h-5" />
                          Marcar Salida
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-300 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 dark:text-white">No has marcado entrada hoy</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Habilita tu GPS para verificar tu ubicación dentro de la sucursal.</p>
                  </div>
                  <button
                    onClick={marcarEntrada}
                    disabled={registrandoAsistencia}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-green-500/10"
                  >
                    {registrandoAsistencia ? (
                      <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Clock className="w-5 h-5" />
                        Marcar Entrada
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
