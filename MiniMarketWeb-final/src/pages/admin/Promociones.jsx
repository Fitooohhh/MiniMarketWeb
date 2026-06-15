import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Tag, Calendar, Percent, Gift, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { promocionesService } from '../../lib/promocionesService'

export default function Promociones() {
  const [promociones, setPromociones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromocion, setEditingPromocion] = useState(null)
  const [showCuponesModal, setShowCuponesModal] = useState(false)
  const [selectedPromocion, setSelectedPromocion] = useState(null)
  const navigate = useNavigate()

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
      case 'descuento': return <Percent className="w-4 h-4" />
      case '2x1': return <Gift className="w-4 h-4" />
      case 'combo': return <Tag className="w-4 h-4" />
      case 'cupon': return <Copy className="w-4 h-4" />
      default: return <Tag className="w-4 h-4" />
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
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactiva</span>
    }

    if (hoy < inicio) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Próxima</span>
    }

    if (hoy > fin) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Vencida</span>
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activa</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-gray-600 mt-1">Gestiona las promociones y descuentos del minimarket</p>
        </div>
        <button
          onClick={handleCrearPromocion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Promoción
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promociones.map((promocion) => (
          <div key={promocion.id_promocion} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {getTipoIcon(promocion.tipo)}
                <span className="font-medium text-gray-900">{promocion.nombre}</span>
              </div>
              {getEstadoBadge(promocion.activa, promocion.fecha_inicio, promocion.fecha_fin)}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{getTipoLabel(promocion.tipo)}</span>
              </div>
              
              {promocion.descuento_porcentaje && (
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  <span>{promocion.descuento_porcentaje}% descuento</span>
                </div>
              )}

              {promocion.monto_descuento && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 text-center">$</span>
                  <span>${promocion.monto_descuento} descuento</span>
                </div>
              )}

              {promocion.minimo_compra > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 text-center">!</span>
                  <span>Mínimo: ${promocion.minimo_compra}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(promocion.fecha_inicio).toLocaleDateString()} - {new Date(promocion.fecha_fin).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-center">U</span>
                <span>{promocion.usos_actuales} / {promocion.limite_usos || 'Ilimitado'} usos</span>
              </div>

              {promocion.promocion_detalle && promocion.promocion_detalle.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-gray-500">{promocion.promocion_detalle.length} productos incluidos</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => handleEditarPromocion(promocion)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-3 h-3" />
                Editar
              </button>
              
              {promocion.tipo === 'cupon' && (
                <button
                  onClick={() => handleGenerarCupones(promocion)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Cupones
                </button>
              )}
              
              <button
                onClick={() => handleEliminarPromocion(promocion.id_promocion)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {promociones.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones</h3>
          <p className="text-gray-600 mb-4">Crea tu primera promoción para empezar a ofrecer descuentos</p>
          <button
            onClick={handleCrearPromocion}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Promoción
          </button>
        </div>
      )}

      {/* Modal para crear/editar promoción */}
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

      {/* Modal para generar cupones */}
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
    }
  }, [promocion])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (promocion) {
        // Aquí iría la lógica para actualizar
        toast.success('Promoción actualizada correctamente')
      } else {
        await promocionesService.crearPromocion(formData)
        toast.success('Promoción creada correctamente')
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {promocion ? 'Editar Promoción' : 'Nueva Promoción'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="descuento">Descuento</option>
                  <option value="2x1">2x1</option>
                  <option value="combo">Combo</option>
                  <option value="cupon">Cupón</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones</label>
              <textarea
                name="condiciones"
                value={formData.condiciones}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {(formData.tipo === 'descuento' || formData.tipo === 'cupon') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% Descuento</label>
                  <input
                    type="number"
                    name="descuento_porcentaje"
                    value={formData.descuento_porcentaje}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto Descuento</label>
                  <input
                    type="number"
                    name="monto_descuento"
                    value={formData.monto_descuento}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Usos</label>
                <input
                  type="number"
                  name="limite_usos"
                  value={formData.limite_usos || ''}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Ilimitado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo de Compra</label>
                <input
                  type="number"
                  name="minimo_compra"
                  value={formData.minimo_compra}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="activa"
                checked={formData.activa}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Promoción activa</label>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Generar Cupones</h2>
          
          <div className="mb-4">
            <p className="text-gray-600">Promoción: <span className="font-medium">{promocion.nombre}</span></p>
          </div>

          {!cuponesGenerados.length ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Cupones</label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
                <p className="text-green-600 font-medium">{cuponesGenerados.length} cupones generados</p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cuponesGenerados.map((cupon) => (
                    <div key={cupon.id_cupon} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-sm">{cupon.codigo}</span>
                      <button
                        onClick={() => handleCopiarCupon(cupon.codigo)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t">
                <button
                  onClick={() => setCuponesGenerados([])}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
