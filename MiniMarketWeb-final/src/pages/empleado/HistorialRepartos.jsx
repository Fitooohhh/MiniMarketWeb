import { useEffect, useState } from 'react'
import { Clock, Search, Filter, Download, MapPin, User, Package, Calendar } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function HistorialRepartos() {
  const [repartos, setRepartos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterEmpleado, setFilterEmpleado] = useState('')
  const [empleados, setEmpleados] = useState([])
  const [dateRange, setDateRange] = useState({
    inicio: '',
    fin: '',
  })

  useEffect(() => {
    loadData()
  }, [filterStatus, filterEmpleado, dateRange])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar empleados
      const { data: empleadosData, error: empError } = await supabase
        .from('empleado')
        .select('*')
        .order('nombre')

      if (empError) throw empError
      setEmpleados(empleadosData || [])

      // Construir query de repartos
      let query = supabase
        .from('reparto')
        .select(`
          *,
          empleado:id_empleado (
            id_empleado,
            nombre,
            telefono,
            rol
          ),
          venta:id_venta (
            id_venta,
            direccion_envio,
            estado
          )
        `)
        .order('fecha', { ascending: false })

      // Filtrar por empleado
      if (filterEmpleado) {
        query = query.eq('id_empleado', parseInt(filterEmpleado))
      }

      // Filtrar por rango de fechas
      if (dateRange.inicio) {
        query = query.gte('fecha', `${dateRange.inicio}T00:00:00`)
      }
      if (dateRange.fin) {
        query = query.lte('fecha', `${dateRange.fin}T23:59:59`)
      }

      const { data: repartosData, error: repartosError } = await query

      if (repartosError) throw repartosError
      
      // Filtrar por estado en memoria (ya que está en la tabla venta)
      let filteredRepartos = repartosData || []
      if (filterStatus !== 'todos') {
        filteredRepartos = filteredRepartos.filter(r => r.venta?.estado === filterStatus)
      }
      
      setRepartos(filteredRepartos)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar el historial de repartos')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente'
      case 'en_progreso':
        return 'En Progreso'
      case 'completado':
        return 'Completado'
      case 'cancelado':
        return 'Cancelado'
      default:
        return estado
    }
  }

  const filteredRepartos = repartos.filter(reparto => {
    const searchLower = searchTerm.toLowerCase()
    return (
      reparto.empleado?.nombre?.toLowerCase().includes(searchLower) ||
      reparto.venta?.id_venta?.toString().includes(searchLower) ||
      reparto.venta?.direccion_envio?.toLowerCase().includes(searchLower)
    )
  })

  // Calcular estadísticas
  const stats = {
    totalRepartos: repartos.length,
    completados: repartos.filter(r => r.venta?.estado === 'completado').length,
    enProgreso: repartos.filter(r => r.venta?.estado === 'en_progreso').length,
    pendientes: repartos.filter(r => r.venta?.estado === 'pendiente').length,
  }

  const handleExport = () => {
    try {
      const csv = [
        ['Fecha', 'Empleado', 'Venta', 'Dirección', 'Estado', 'Observaciones'],
        ...filteredRepartos.map(r => [
          format(new Date(r.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
          r.empleado?.nombre || '-',
          r.venta?.id_venta || '-',
          r.venta?.direccion_envio || '-',
          getEstadoLabel(r.venta?.estado),
          r.observaciones || '-',
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial-repartos-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Archivo descargado correctamente')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Error al descargar el archivo')
    }
  }

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock size={32} />
              Historial de Repartos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visualiza el historial completo de entregas y repartos
            </p>
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            Descargar CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total de Repartos</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalRepartos}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Completados</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {stats.completados}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">En Progreso</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {stats.enProgreso}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">
              {stats.pendientes}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 md:col-span-2">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar por empleado, pedido o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            {/* Filter by Empleado */}
            <select
              value={filterEmpleado}
              onChange={(e) => setFilterEmpleado(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los empleados</option>
              {empleados.map(emp => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={dateRange.inicio}
                onChange={(e) => setDateRange(prev => ({ ...prev, inicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={dateRange.fin}
                onChange={(e) => setDateRange(prev => ({ ...prev, fin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Cargando historial de repartos...
            </div>
          ) : filteredRepartos.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No hay repartos para mostrar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Venta
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRepartos.map((reparto) => (
                    <tr key={reparto.id_reparto} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {format(new Date(reparto.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          {reparto.empleado?.nombre || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          {reparto.venta?.id_venta || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="truncate max-w-xs">
                            {reparto.venta?.direccion_envio || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(reparto.venta?.estado)}`}>
                          {getEstadoLabel(reparto.venta?.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="truncate max-w-xs block">
                          {reparto.observaciones || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
