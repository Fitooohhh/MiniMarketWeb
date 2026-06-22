import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tag, Calendar, Percent, Gift, Copy, Search, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { promocionesService } from '../../../lib/promocionesService'
import { supabase } from '../../../lib/supabase'

export default function PromocionesTab({ profile }) {
  const [promociones, setPromociones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCuponesModal, setShowCuponesModal] = useState(false)
  const [editingPromocion, setEditingPromocion] = useState(null)
  const [selectedPromocion, setSelectedPromocion] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    cargarPromociones()
  }, [])

  const cargarPromociones = async () => {
    try {
      const data = await promocionesService.obtenerPromociones()
      setPromociones(data)
    } catch (error) {
      toast.error('Error al cargar promociones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearPromocion = () => {
    setEditingPromocion(null)
    setShowModal(true)
  }

  const handleEditarPromocion = (promocion) => {
    setEditingPromocion(promocion)
    setShowModal(true)
  }

  const handleEliminarPromocion = async (idPromocion) => {
    if (!confirm('¿Está seguro de eliminar esta promoción?')) return

    try {
      await promocionesService.eliminarPromocion(idPromocion)
      toast.success('Promoción eliminada correctamente')
      cargarPromociones()
    } catch (error) {
      toast.error('Error al eliminar promoción')
      console.error(error)
    }
  }

  const handleGenerarCupones = (promocion) => {
    setSelectedPromocion(promocion)
    setShowCuponesModal(true)
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'descuento': return <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case '2x1': return <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      case 'combo': return <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'cupon': return <Copy className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      default: return <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'descuento': return 'Descuento'
      case '2x1': return '2x1'
      case 'combo': return 'Combo'
      case 'cupon': return 'Cupón'
      default: return tipo
    }
  }

  const getEstadoBadge = (activa, fechaInicio, fechaFin) => {
    const hoy = new Date()
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)

    if (!activa) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Inactiva</span>
    }

    if (hoy < inicio) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Próxima</span>
    }

    if (hoy > fin) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Vencida</span>
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Activa</span>
  }

  const promocionesFiltradas = promociones.filter(promocion => {
    const coincideBusqueda = 
      promocion.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      promocion.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    
    const coincideEstado = filtroEstado === 'todos' || 
      (filtroEstado === 'activa' && promocion.activa && new Date() >= new Date(promocion.fecha_inicio) && new Date() <= new Date(promocion.fecha_fin)) ||
      (filtroEstado === 'inactiva' && !promocion.activa) ||
      (filtroEstado === 'vencida' && new Date() > new Date(promocion.fecha_fin))
    
    return coincideBusqueda && coincideEstado
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header con acciones */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Promociones</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona las promociones y descuentos del minimarket</p>
        </div>
        <button
          onClick={handleCrearPromocion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Promoción
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-150 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar promociones..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="activa">Activas</option>
              <option value="inactiva">Inactivas</option>
              <option value="vencida">Vencidas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de promociones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promocionesFiltradas.map((promocion) => (
          <div key={promocion.id_promocion} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {getTipoIcon(promocion.tipo)}
                  <span className="font-medium text-gray-900 dark:text-white">{promocion.nombre}</span>
                </div>
                {getEstadoBadge(promocion.activa, promocion.fecha_inicio, promocion.fecha_fin)}
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {promocion.descripcion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">{promocion.descripcion}</p>
                )}

                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span>Tipo: {getTipoLabel(promocion.tipo)}</span>
                </div>
                
                {promocion.descuento_porcentaje && (
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-gray-400" />
                    <span>{promocion.descuento_porcentaje}% descuento</span>
                  </div>
                )}

                {promocion.monto_descuento && (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-center font-bold text-gray-400">Bs</span>
                    <span>Bs {promocion.monto_descuento.toFixed(2)} descuento</span>
                  </div>
                )}

                {promocion.minimo_compra > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-center font-bold text-gray-400">!</span>
                    <span>Mínimo: Bs {promocion.minimo_compra.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(promocion.fecha_inicio).toLocaleDateString()} - {new Date(promocion.fecha_fin).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 text-center font-bold text-gray-400">U</span>
                  <span>{promocion.usos_actuales} / {promocion.limite_usos || 'Ilimitado'} usos</span>
                </div>

                {promocion.promocion_detalle && promocion.promocion_detalle.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Productos incluidos:</span>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside mt-1 max-h-20 overflow-y-auto">
                      {promocion.promocion_detalle.map(d => (
                        <li key={d.id_detalle}>
                          {d.producto?.nombre} {d.cantidad_requerida > 1 && `(x${d.cantidad_requerida})`}
                          {d.precio_especial && ` - Esp: Bs ${d.precio_especial}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handleEditarPromocion(promocion)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Edit className="w-3 h-3" />
                Editar
              </button>
              
              {promocion.tipo === 'cupon' && (
                <button
                  onClick={() => handleGenerarCupones(promocion)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Cupones
                </button>
              )}
              
              <button
                onClick={() => handleEliminarPromocion(promocion.id_promocion)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {promocionesFiltradas.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay promociones</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Crea tu primera promoción para empezar a ofrecer descuentos</p>
          <button
            onClick={handleCrearPromocion}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Promoción
          </button>
        </div>
      )}

      {/* Modales */}
      {showModal && (
        <PromocionModal
          promocion={editingPromocion}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            cargarPromociones()
          }}
        />
      )}

      {showCuponesModal && (
        <CuponesModal
          promocion={selectedPromocion}
          onClose={() => setShowCuponesModal(false)}
        />
      )}
    </div>
  )
}

// Componente Modal para Promoción
function PromocionModal({ promocion, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'descuento',
    descripcion: '',
    condiciones: '',
    fecha_inicio: '',
    fecha_fin: '',
    activa: true,
    limite_usos: null,
    descuento_porcentaje: 0,
    monto_descuento: 0,
    minimo_compra: 0
  })
  const [loading, setLoading] = useState(false)
  const [todosProductos, setTodosProductos] = useState([])
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosSeleccionados, setProductosSeleccionados] = useState([])

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('id_producto, nombre, precio, stock, imagen_url')
        .order('nombre')
      if (error) throw error
      setTodosProductos(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (promocion) {
      setFormData({
        nombre: promocion.nombre || '',
        tipo: promocion.tipo || 'descuento',
        descripcion: promocion.descripcion || '',
        condiciones: promocion.condiciones || '',
        fecha_inicio: promocion.fecha_inicio || '',
        fecha_fin: promocion.fecha_fin || '',
        activa: promocion.activa ?? true,
        limite_usos: promocion.limite_usos || null,
        descuento_porcentaje: promocion.descuento_porcentaje || 0,
        monto_descuento: promocion.monto_descuento || 0,
        minimo_compra: promocion.minimo_compra || 0
      })

      if (promocion.promocion_detalle) {
        setProductosSeleccionados(promocion.promocion_detalle.map(d => ({
          id_producto: d.id_producto,
          nombre: d.producto?.nombre || 'Producto',
          precio: d.producto?.precio || 0,
          cantidad_requerida: d.cantidad_requerida || 1,
          cantidad_regalo: d.cantidad_regalo || 0,
          precio_especial: d.precio_especial || ''
        })))
      }
    } else {
      setFormData({
        nombre: '',
        tipo: 'descuento',
        descripcion: '',
        condiciones: '',
        fecha_inicio: '',
        fecha_fin: '',
        activa: true,
        limite_usos: null,
        descuento_porcentaje: 0,
        monto_descuento: 0,
        minimo_compra: 0
      })
      setProductosSeleccionados([])
    }
  }, [promocion])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let savedPromocion
      if (promocion) {
        savedPromocion = await promocionesService.actualizarPromocion(promocion.id_promocion, formData)
        // Eliminar detalles anteriores
        await supabase.from('promocion_detalle').delete().eq('id_promocion', promocion.id_promocion)
        toast.success('Promoción actualizada correctamente')
      } else {
        savedPromocion = await promocionesService.crearPromocion(formData)
        toast.success('Promoción creada correctamente')
      }

      // Guardar los detalles
      if (savedPromocion && productosSeleccionados.length > 0) {
        const detalles = productosSeleccionados.map(p => ({
          id_producto: p.id_producto,
          cantidad_requerida: parseInt(p.cantidad_requerida) || 1,
          cantidad_regalo: parseInt(p.cantidad_regalo) || 0,
          precio_especial: p.precio_especial ? parseFloat(p.precio_especial) : null
        }))
        await promocionesService.agregarProductosPromocion(savedPromocion.id_promocion, detalles)
      }

      onSave()
    } catch (error) {
      toast.error('Error al guardar promoción')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddProducto = (prod) => {
    if (productosSeleccionados.some(p => p.id_producto === prod.id_producto)) {
      toast.error('El producto ya está seleccionado')
      return
    }
    setProductosSeleccionados(prev => [
      ...prev,
      {
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        precio: prod.precio,
        cantidad_requerida: 1,
        cantidad_regalo: 0,
        precio_especial: ''
      }
    ])
    setBusquedaProducto('')
  }

  const handleRemoveProducto = (id) => {
    setProductosSeleccionados(prev => prev.filter(p => p.id_producto !== id))
  }

  const handleProductoChange = (id, field, val) => {
    setProductosSeleccionados(prev => prev.map(p => {
      if (p.id_producto === id) {
        return { ...p, [field]: val }
      }
      return p
    }))
  }

  const productosFiltrados = todosProductos.filter(prod => 
    prod.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
    !productosSeleccionados.some(p => p.id_producto === prod.id_producto)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {promocion ? 'Editar Promoción' : 'Nueva Promoción'}
            </h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="descuento">Descuento</option>
                  <option value="2x1">2x1</option>
                  <option value="combo">Combo</option>
                  <option value="cupon">Cupón</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condiciones</label>
              <textarea
                name="condiciones"
                value={formData.condiciones}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {(formData.tipo === 'descuento' || formData.tipo === 'cupon') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">% Descuento</label>
                  <input
                    type="number"
                    name="descuento_porcentaje"
                    value={formData.descuento_porcentaje}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto Descuento (Bs)</label>
                  <input
                    type="number"
                    name="monto_descuento"
                    value={formData.monto_descuento}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Límite de Usos</label>
                <input
                  type="number"
                  name="limite_usos"
                  value={formData.limite_usos || ''}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Ilimitado"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mínimo de Compra (Bs)</label>
                <input
                  type="number"
                  name="minimo_compra"
                  value={formData.minimo_compra}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="activa"
                checked={formData.activa}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Promoción activa</label>
            </div>

            {/* SECCIÓN DE PRODUCTOS */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Productos en la Promoción</h3>
              
              {/* Buscador de productos */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto para agregar..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                
                {busquedaProducto && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    {productosFiltrados.length > 0 ? (
                      productosFiltrados.map(prod => (
                        <button
                          type="button"
                          key={prod.id_producto}
                          onClick={() => handleAddProducto(prod)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white flex justify-between items-center"
                        >
                          <span>{prod.nombre}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Bs {prod.precio.toFixed(2)}</span>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">No se encontraron productos disponibles</p>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de seleccionados */}
              {productosSeleccionados.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-3 py-2">Producto</th>
                        <th className="px-3 py-2 w-24">Cant. Req</th>
                        {formData.tipo === '2x1' && <th className="px-3 py-2 w-24">Regalo</th>}
                        <th className="px-3 py-2 w-28">Precio Esp.</th>
                        <th className="px-3 py-2 w-16 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {productosSeleccionados.map(prod => (
                        <tr key={prod.id_producto} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-1.5 dark:text-white">
                            <p className="font-medium">{prod.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Regular: Bs {prod.precio}</p>
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="1"
                              value={prod.cantidad_requerida}
                              onChange={(e) => handleProductoChange(prod.id_producto, 'cantidad_requerida', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                            />
                          </td>
                          {formData.tipo === '2x1' && (
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                min="0"
                                value={prod.cantidad_regalo}
                                onChange={(e) => handleProductoChange(prod.id_producto, 'cantidad_regalo', Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                              />
                            </td>
                          )}
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={prod.precio_especial}
                              placeholder="Sin cambio"
                              onChange={(e) => handleProductoChange(prod.id_producto, 'precio_especial', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProducto(prod.id_producto)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                  Ningún producto asignado a esta promoción. Aplica a toda la tienda por defecto.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (promocion ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Componente Modal para Cupones
function CuponesModal({ promocion, onClose }) {
  const [cantidad, setCantidad] = useState(10)
  const [loading, setLoading] = useState(false)
  const [cuponesGenerados, setCuponesGenerados] = useState([])

  const handleGenerarCupones = async () => {
    setLoading(true)
    try {
      const cupones = await promocionesService.generarCupones(promocion.id_promocion, cantidad)
      setCuponesGenerados(cupones)
      toast.success(`${cantidad} cupones generados correctamente`)
    } catch (error) {
      toast.error('Error al generar cupones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopiarCupon = (codigo) => {
    navigator.clipboard.writeText(codigo)
    toast.success('Cupón copiado al portapapeles')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generar Cupones</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            <p>Promoción: <span className="font-semibold text-gray-900 dark:text-white">{promocion.nombre}</span></p>
          </div>

          {!cuponesGenerados.length ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad de Cupones</label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerarCupones}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Generando...' : 'Generar Cupones'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-green-600 dark:text-green-400 font-semibold">{cuponesGenerados.length} cupones generados</p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cuponesGenerados.map((cupon) => (
                    <div key={cupon.id_cupon} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-mono text-sm dark:text-white">{cupon.codigo}</span>
                      <button
                        onClick={() => handleCopiarCupon(cupon.codigo)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCuponesGenerados([])}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Generar Más
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
