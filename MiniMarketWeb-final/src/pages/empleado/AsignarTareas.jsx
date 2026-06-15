import { useEffect, useState } from 'react'
import { UserCheck, Plus, Edit, Trash2, Search, Calendar, Truck } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/currencyFormatter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AsignarTareas() {
  const [repartos, setRepartos] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    id_empleado: '',
    id_venta: '',
    estado: 'pendiente',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar repartos con información del empleado y venta
      const { data: repartosData, error: repError } = await supabase
        .from('reparto')
        .select(`
          *,
          empleado:id_empleado (
            id_empleado,
            nombre,
            rol,
            telefono
          ),
          venta:id_venta (
            id_venta,
            fecha,
            total,
            cliente:id_cliente (
              nombre,
              direccion,
              telefono
            )
          )
        `)
        .order('fecha', { ascending: false })

      if (repError) throw repError

      // Cargar empleados
      const { data: empleadosData, error: empError } = await supabase
        .from('empleado')
        .select('*')
        .order('nombre')

      if (empError) throw empError

      // Cargar ventas con información del cliente
      const { data: ventasData, error: ventError } = await supabase
        .from('venta')
        .select(`
          *,
          cliente:id_cliente (
            nombre,
            direccion
          )
        `)
        .order('fecha', { ascending: false })

      if (ventError) throw ventError

      setRepartos(repartosData || [])
      setEmpleados(empleadosData || [])
      setVentas(ventasData || [])
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
          .from('reparto')
          .update({
            id_empleado: parseInt(formData.id_empleado),
            id_venta: parseInt(formData.id_venta),
            estado: formData.estado,
          })
          .eq('id_reparto', editingItem.id_reparto)

        if (error) throw error
        alert('Tarea actualizada exitosamente')
      } else {
        // Crear
        const { error } = await supabase
          .from('reparto')
          .insert([{
            id_empleado: parseInt(formData.id_empleado),
            id_venta: parseInt(formData.id_venta),
            estado: formData.estado,
          }])

        if (error) throw error
        alert('Tarea asignada exitosamente')
      }

      setShowModal(false)
      setEditingItem(null)
      setFormData({
        id_empleado: '',
        id_venta: '',
        estado: 'pendiente',
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
      id_empleado: item.id_empleado.toString(),
      id_venta: item.id_venta.toString(),
      estado: item.estado || 'pendiente',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return

    try {
      const { error } = await supabase
        .from('reparto')
        .delete()
        .eq('id_reparto', id)

      if (error) throw error
      alert('Asignación eliminada exitosamente')
      loadData()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error al eliminar: ' + error.message)
    }
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      en_proceso: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return badges[estado] || badges.pendiente
  }

  const filteredRepartos = repartos.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.empleado?.nombre?.toLowerCase().includes(searchLower) ||
      item.venta?.cliente?.nombre?.toLowerCase().includes(searchLower) ||
      item.estado?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Asignación de Tareas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Asigna entregas y repartos a los empleados
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null)
              setFormData({
                id_empleado: '',
                id_venta: '',
                estado: 'pendiente',
              })
              setShowModal(true)
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Asignación
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {repartos.filter(r => r.estado === 'pendiente').length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">En Proceso</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {repartos.filter(r => r.estado === 'en_proceso').length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Completados</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {repartos.filter(r => r.estado === 'completado').length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Total</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {repartos.length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por empleado, cliente o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Tabla de repartos */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando...</p>
            </div>
          ) : filteredRepartos.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No se encontraron asignaciones' : 'No hay asignaciones de tareas'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRepartos.map((item) => (
                    <tr key={item.id_reparto} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCheck className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.empleado?.nombre || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.empleado?.cargo || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {item.venta?.cliente?.nombre || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {item.venta?.cliente?.direccion || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.venta?.total || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(item.estado)}`}>
                          {item.estado?.replace('_', ' ') || 'pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(item.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
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
                          onClick={() => handleDelete(item.id_reparto)}
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
              {editingItem ? 'Editar Asignación' : 'Nueva Asignación'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empleado *
                </label>
                <select
                  value={formData.id_empleado}
                  onChange={(e) => setFormData({ ...formData, id_empleado: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {emp.nombre} - {emp.cargo || 'Sin cargo'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Venta *
                </label>
                <select
                  value={formData.id_venta}
                  onChange={(e) => setFormData({ ...formData, id_venta: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Seleccionar venta</option>
                  {ventas.map((venta) => (
                    <option key={venta.id_venta} value={venta.id_venta}>
                      Venta #{venta.id_venta} - {venta.cliente?.nombre} - {formatCurrency(venta.total || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado *
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
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
                  {editingItem ? 'Actualizar' : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
