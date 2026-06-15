import { useEffect, useState, useRef } from 'react'
import { 
  Package, Plus, Edit, Trash2, Search, DollarSign, Calendar, Image as ImageIcon, AlertCircle,
  Tag, Star, RotateCcw, Users, Camera, Scan
} from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/currencyFormatter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// Importar componentes de pestañas
import PromocionesTab from './tabs/PromocionesTab'
import LealtadTab from './tabs/LealtadTab'
import DevolucionesTab from './tabs/DevolucionesTab'
import TurnosTab from './tabs/TurnosTab'
import NominaTab from './tabs/NominaTab'

export default function Productos() {
  const [activeTab, setActiveTab] = useState('productos')
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    precio: '',
    stock: '',
    fecha_vencimiento: '',
    imagen_url: '',
    imagen_codigo_url: '',
  })
  
  // Estados para cámara de código de barras
  const [useCamera, setUseCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [scanStatus, setScanStatus] = useState('')
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const videoRef = useRef(null)

  const openBarcodeCamera = async (deviceId = null) => {
    setUseCamera(true)
    setScanStatus('Iniciando cámara...')
    try {
      let stream
      if (deviceId && typeof deviceId === 'string') {
        stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
      } else {
        try {
          // Intentar primero con la cámara trasera (ideal para celulares)
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        } catch (e) {
          // Fallback para laptops/PCs sin cámara trasera
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanStatus('Cámara encendida')
      }

      // Enumerar cámaras
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
      setDevices(videoDevices)
      
      if (videoDevices.length > 0) {
        if (deviceId) {
          setSelectedDeviceId(deviceId)
        } else {
          const activeTrack = stream.getVideoTracks()[0]
          const activeSettings = activeTrack ? activeTrack.getSettings() : {}
          const currentId = activeSettings.deviceId || videoDevices[0].deviceId
          setSelectedDeviceId(currentId)
        }
      }
    } catch (err) {
      console.error('Error al abrir la cámara:', err)
      setScanStatus('No se pudo acceder a la cámara')
      toast.error('Error al acceder a la cámara')
    }
  }

  const closeBarcodeCameraOnlyStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const closeBarcodeCamera = () => {
    closeBarcodeCameraOnlyStream()
    setUseCamera(false)
  }

  const handleCameraChange = async (e) => {
    const newId = e.target.value
    closeBarcodeCameraOnlyStream()
    await openBarcodeCamera(newId)
  }

  const captureBarcodePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      
      // Convertir a Base64 para guardarlo directamente en base de datos temporalmente
      const dataUrl = canvas.toDataURL('image/jpeg')
      setCapturedImage(dataUrl)
      setFormData(prev => ({ ...prev, imagen_codigo_url: dataUrl }))
      closeBarcodeCamera()
      toast.success('Foto del código de barras capturada')
    }
  }

  const handleBarcodeFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target.result
        setCapturedImage(dataUrl)
        setFormData(prev => ({ ...prev, imagen_codigo_url: dataUrl }))
        toast.success('Foto del código de barras cargada exitosamente')
      }
      reader.readAsDataURL(file)
    }
  }

  const scanBarcodeFromVideo = async () => {
    setScanStatus('Intentando decodificar código...')
    if (videoRef.current) {
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['code_128', 'ean_13', 'qr_code'] })
          const detected = await barcodeDetector.detect(videoRef.current)
          if (detected && detected.length > 0) {
            const rawVal = detected[0].rawValue
            setFormData(prev => ({ ...prev, codigo: rawVal }))
            toast.success(`Código detectado: ${rawVal}`)
            setScanStatus(`Detectado: ${rawVal}`)
            return
          }
        } catch (e) {
          console.warn(e)
        }
      }
      setScanStatus('No se detectó un código claro. Saca una foto e introduce el código manualmente.')
    }
  }

  useEffect(() => {
    if (activeTab === 'productos') {
      loadProductos()
    }
  }, [activeTab])

  const loadProductos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .order('nombre')

      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error('Error loading productos:', error)
      toast.error('Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const productData = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
      }

      if (editingItem) {
        const { error } = await supabase
          .from('producto')
          .update(productData)
          .eq('id_producto', editingItem.id_producto)

        if (error) throw error
        toast.success('Producto actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('producto')
          .insert(productData)

        if (error) throw error
        toast.success('Producto creado correctamente')
      }

      setShowModal(false)
      setEditingItem(null)
      setFormData({
        codigo: '',
        nombre: '',
        categoria: '',
        precio: '',
        stock: '',
        fecha_vencimiento: '',
        imagen_url: '',
        imagen_codigo_url: '',
      })
      setCapturedImage(null)
      setUseCamera(false)
      loadProductos()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Error al guardar el producto')
    }
  }

  const handleEdit = (producto) => {
    setEditingItem(producto)
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      fecha_vencimiento: producto.fecha_vencimiento,
      imagen_url: producto.imagen_url || '',
      imagen_codigo_url: producto.imagen_codigo_url || '',
    })
    setCapturedImage(producto.imagen_codigo_url || null)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return

    try {
      const { error } = await supabase
        .from('producto')
        .delete()
        .eq('id_producto', id)

      if (error) throw error
      toast.success('Producto eliminado correctamente')
      loadProductos()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar el producto')
    }
  }

  const filteredProductos = productos.filter(producto =>
    producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))]

  const tabs = [
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'promociones', label: 'Promociones', icon: Tag },
    { id: 'lealtad', label: 'Programa Lealtad', icon: Star },
    { id: 'devoluciones', label: 'Devoluciones', icon: RotateCcw },
    { id: 'turnos', label: 'Gestión Turnos', icon: Calendar },
    { id: 'nomina', label: 'Nómina', icon: Users },
  ]

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Productos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Administra productos, promociones, lealtad, devoluciones, turnos y nómina
            </p>
          </div>
          {activeTab === 'productos' && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Producto
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'productos' && (
              <div>
                {/* Filtros */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                {/* Grid de productos */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="card animate-pulse">
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                        <div className="p-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProductos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProductos.map((producto) => (
                      <div key={producto.id_producto} className="card hover:shadow-lg transition-shadow">
                        <div className="aspect-w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative">
                          {producto.imagen_url ? (
                            <img
                              src={producto.imagen_url}
                              alt={producto.nombre}
                              className="w-full h-full object-cover rounded-t-lg"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-t-lg">
                                    <ImageIcon className="w-12 h-12 text-gray-400" />
                                  </div>
                                `
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-t-lg">
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Badge de stock */}
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              producto.stock > 10 
                                ? 'bg-green-100 text-green-800' 
                                : producto.stock > 0 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Stock: {producto.stock}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {producto.nombre}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {producto.codigo}
                              </p>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {producto.categoria}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(producto)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(producto.id_producto)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Precio:</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(producto.precio)}
                              </span>
                            </div>

                            {producto.fecha_vencimiento && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Vence:</span>
                                <span className={`text-sm font-medium ${
                                  new Date(producto.fecha_vencimiento) < new Date()
                                    ? 'text-red-600'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {format(new Date(producto.fecha_vencimiento), 'dd/MM/yyyy')}
                                </span>
                              </div>
                            )}

                            {new Date(producto.fecha_vencimiento) < new Date() && (
                              <div className="flex items-center text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Producto vencido
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No hay productos
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No se encontraron productos que coincidan con los filtros
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'promociones' && (
              <PromocionesTab profile={{ id_empleado: 1 }} />
            )}

            {activeTab === 'lealtad' && (
              <LealtadTab profile={{ id_empleado: 1 }} />
            )}

            {activeTab === 'devoluciones' && (
              <DevolucionesTab profile={{ id_empleado: 1 }} />
            )}

            {activeTab === 'turnos' && (
              <TurnosTab profile={{ id_empleado: 1 }} />
            )}

            {activeTab === 'nomina' && (
              <NominaTab profile={{ id_empleado: 1 }} />
            )}
          </div>
        </div>

        {/* Modal para crear/editar producto */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                    setFormData({
                      codigo: '',
                      nombre: '',
                      categoria: '',
                      precio: '',
                      stock: '',
                      fecha_vencimiento: '',
                      imagen_url: '',
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Código de Barras / QR
                    </label>
                    
                    {/* Botones de control de cámara / subida */}
                    <div className="flex items-center gap-2">
                      {!useCamera ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openBarcodeCamera()}
                            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold"
                          >
                            <Camera size={14} /> Usar Cámara
                          </button>
                          <span className="text-gray-300">|</span>
                          <label
                            htmlFor="barcode-file-upload"
                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            <ImageIcon size={14} /> Subir Foto
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="barcode-file-upload"
                            onChange={handleBarcodeFileUpload}
                          />
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={closeBarcodeCamera}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold"
                        >
                          Cerrar Cámara
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feed de video en vivo */}
                  {useCamera && (
                    <div className="bg-black rounded-lg p-2 mb-2 flex flex-col items-center">
                      {devices.length > 0 && (
                        <div className="w-full mb-2">
                          <label className="text-[10px] text-gray-400 block mb-0.5">Seleccionar Cámara:</label>
                          <select
                            value={selectedDeviceId}
                            onChange={handleCameraChange}
                            className="w-full text-xs bg-gray-800 text-white rounded p-1 border border-gray-700 focus:outline-none"
                          >
                            {devices.map((device, idx) => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Cámara ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <video ref={videoRef} className="w-full max-h-[180px] rounded object-cover" playsInline muted />
                      <div className="flex gap-2 mt-2 w-full">
                        <button
                          type="button"
                          onClick={captureBarcodePhoto}
                          className="flex-1 bg-purple-600 text-white text-xs py-1 px-2 rounded hover:bg-purple-700"
                        >
                          Capturar Foto Código
                        </button>
                        <button
                          type="button"
                          onClick={scanBarcodeFromVideo}
                          className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700"
                        >
                          Escanear Texto
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{scanStatus}</p>
                    </div>
                  )}

                  {/* Input manual */}
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Código detectado o escrito a mano"
                  />

                  {/* Visualización de la foto del código de barras si ya fue tomada */}
                  {capturedImage && (
                    <div className="mt-2 flex items-center gap-3 bg-gray-50 dark:bg-gray-900/40 p-2 rounded border border-purple-200">
                      <img src={capturedImage} className="w-16 h-10 object-cover rounded border" alt="Código capturado" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-purple-700">Foto de Código Guardada</p>
                        <p className="text-[10px] text-gray-400">Esta imagen sirve para registrar el código físico.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage(null)
                          setFormData(prev => ({ ...prev, imagen_codigo_url: '' }))
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio (Bs)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ingrese el precio en Bolivianos (Bs)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={formData.imagen_url}
                    onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingItem(null)
                      setFormData({
                        codigo: '',
                        nombre: '',
                        categoria: '',
                        precio: '',
                        stock: '',
                        fecha_vencimiento: '',
                        imagen_url: '',
                      })
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
