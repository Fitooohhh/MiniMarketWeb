import { useEffect, useState } from 'react'
import { Package, Plus, Edit, Trash2, Search, Calendar } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Inventario() {
  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    id_producto: '',
    cantidad: '',
    fecha_ingreso: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar inventario con información del producto
      const { data: inventarioData, error: invError } = await supabase
        .from('inventario')
        .select(`
          *,
          producto:id_producto (
            id_producto,
            codigo,
            nombre,
            categoria,
            precio,
            stock
          )
        `)
        .order('fecha_ingreso', { ascending: false })

      if (invError) throw invError

      // Cargar todos los productos para el selector
      const { data: productosData, error: prodError } = await supabase
        .from('producto')
        .select('*')
        .order('nombre')

      if (prodError) throw prodError

      setInventario(inventarioData || [])
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingItem) {
        // Actualizar
        const { error } = await supabase
          .from('inventario')
          .update({
            id_producto: parseInt(formData.id_producto),
            cantidad: parseInt(formData.cantidad),
            fecha_ingreso: formData.fecha_ingreso,
          })
          .eq('id_inventario', editingItem.id_inventario)

        if (error) throw error
        alert('Registro de inventario actualizado exitosamente')
      } else {
        // Crear
        const { error } = await supabase
          .from('inventario')
          .insert([{
            id_producto: parseInt(formData.id_producto),
            cantidad: parseInt(formData.cantidad),
            fecha_ingreso: formData.fecha_ingreso,
          }])

        if (error) throw error
        alert('Registro de inventario creado exitosamente')
      }

      setShowModal(false)
      setEditingItem(null)
      setFormData({
        id_producto: '',
        cantidad: '',
        fecha_ingreso: format(new Date(), 'yyyy-MM-dd'),
      })
      loadData()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error al guardar: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      id_producto: item.id_producto.toString(),
      cantidad: item.cantidad.toString(),
      fecha_ingreso: item.fecha_ingreso,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro de inventario?')) return

    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id_inventario', id)

      if (error) throw error
      alert('Registro eliminado exitosamente')
      loadData()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error al eliminar: ' + error.message)
    }
  }

  const filteredInventario = inventario.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.producto?.nombre?.toLowerCase().includes(searchLower) ||
      item.producto?.codigo?.toLowerCase().includes(searchLower) ||
      item.producto?.categoria?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Inventario
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Administra los registros de entrada de productos
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null)
              setFormData({
                id_producto: '',
                cantidad: '',
                fecha_ingreso: format(new Date(), 'yyyy-MM-dd'),
              })
              setShowModal(true)
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Registro
          </button>
        </div>

        {/* Buscador */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando...</p>
            </div>
          ) : filteredInventario.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No se encontraron registros' : 'No hay registros de inventario'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Ingreso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInventario.map((item) => (
                    <tr key={item.id_inventario} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.producto?.nombre || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.producto?.codigo || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {item.producto?.categoria || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.cantidad}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.producto?.stock || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(item.fecha_ingreso), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_inventario)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Producto *
                </label>
                <select
                  value={formData.id_producto}
                  onChange={(e) => setFormData({ ...formData, id_producto: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((prod) => (
                    <option key={prod.id_producto} value={prod.id_producto}>
                      {prod.nombre} - {prod.codigo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Ingreso *
                </label>
                <input
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
