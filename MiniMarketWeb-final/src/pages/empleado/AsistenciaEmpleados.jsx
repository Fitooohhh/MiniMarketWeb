import { useEffect, useState } from 'react'
import { 
  Users, Calendar, Clock, Search, Filter, Download, 
  Tag, Star, RotateCcw, DollarSign, Settings, Plus, Shield
} from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// Importar componentes de pestañas
import PromocionesTab from './tabs/PromocionesTab'
import LealtadTab from './tabs/LealtadTab'
import TurnosTab from './tabs/TurnosTab'
import GeofencingTab from './tabs/GeofencingTab'

export default function AsistenciaEmpleados() {
  const [activeTab, setActiveTab] = useState('asistencia')
  const [asistencias, setAsistencias] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmpleado, setSelectedEmpleado] = useState('')
  const [dateRange, setDateRange] = useState({
    inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    fin: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    if (activeTab === 'asistencia') {
      loadData()
    }
  }, [dateRange, selectedEmpleado, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar empleados
      const { data: empleadosData, error: empError } = await supabase
        .from('empleado')
        .select('*')
        .order('nombre')

      if (empError) throw empError

      // Construir query de asistencias
      let query = supabase
        .from('asistencia')
        .select(`
          *,
          empleado:id_empleado (
            id_empleado,
            nombre,
            rol,
            telefono
          )
        `)
        .gte('fecha', dateRange.inicio)
        .lte('fecha', dateRange.fin)
        .order('fecha', { ascending: false })

      // Aplicar filtros
      if (selectedEmpleado) {
        query = query.eq('id_empleado', selectedEmpleado)
      }

      const { data: asistenciasData, error: asistError } = await query

      if (asistError) throw asistError

      setEmpleados(empleadosData || [])
      setAsistencias(asistenciasData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const calcularHorasTrabajadas = (horaEntrada, horaSalida) => {
    if (!horaEntrada || !horaSalida) return 'N/A'
    
    const entrada = new Date(horaEntrada)
    const salida = new Date(horaSalida)
    const diffMs = salida - entrada
    const diffHours = diffMs / (1000 * 60 * 60)
    
    return diffHours.toFixed(1)
  }

  const stats = {
    totalRegistros: asistencias.length,
    empleadosActivos: new Set(asistencias.map(a => a.id_empleado)).size,
    registrosCompletos: asistencias.filter(a => a.hora_entrada && a.hora_salida).length,
    registrosPendientes: asistencias.filter(a => a.hora_entrada && !a.hora_salida).length,
  }

  const filteredAsistencias = asistencias.filter(asistencia => {
    const matchesSearch = asistencia.empleado?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const exportarCSV = () => {
    const headers = ['Fecha', 'Empleado', 'Cargo', 'Hora Entrada', 'Hora Salida', 'Horas Trabajadas']
    const rows = filteredAsistencias.map(a => [
      format(new Date(a.fecha), 'dd/MM/yyyy'),
      a.empleado?.nombre || 'N/A',
      a.empleado?.cargo || 'N/A',
      a.hora_entrada ? format(new Date(a.hora_entrada), 'HH:mm') : 'N/A',
      a.hora_salida ? format(new Date(a.hora_salida), 'HH:mm') : 'N/A',
      calcularHorasTrabajadas(a.hora_entrada, a.hora_salida),
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asistencias_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const tabs = [
    { id: 'asistencia', label: 'Asistencia', icon: Clock },
    { id: 'geofencing', label: 'Geo-fencing', icon: Shield },
  ]

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión Administrativa
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Administra asistencia, promociones, lealtad, devoluciones, turnos y nómina
            </p>
          </div>
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
            {activeTab === 'asistencia' && (
              <div>
                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Registros</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {stats.totalRegistros}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Empleados Activos</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {stats.empleadosActivos}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Completos</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {stats.registrosCompletos}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">En Turno</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                          {stats.registrosPendientes}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>

                {/* Filtros */}
                <div className="card mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Buscar empleado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Selector de empleado */}
                    <select
                      value={selectedEmpleado}
                      onChange={(e) => setSelectedEmpleado(e.target.value)}
                      className="px-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los empleados</option>
                      {empleados.map(emp => (
                        <option key={emp.id_empleado} value={emp.id_empleado}>
                          {emp.nombre}
                        </option>
                      ))}
                    </select>

                    {/* Rango de fechas */}
                    <input
                      type="date"
                      value={dateRange.inicio}
                      onChange={(e) => setDateRange(prev => ({ ...prev, inicio: e.target.value }))}
                      className="px-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />

                    <input
                      type="date"
                      value={dateRange.fin}
                      onChange={(e) => setDateRange(prev => ({ ...prev, fin: e.target.value }))}
                      className="px-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Botón de exportar */}
                  <div className="md:col-span-4 flex justify-end">
                    <button
                      onClick={exportarCSV}
                      className="btn-primary flex items-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                {/* Tabla de asistencias */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Empleado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cargo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Entrada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Salida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Horas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {loading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredAsistencias.length > 0 ? (
                        filteredAsistencias.map((asistencia) => (
                          <tr key={asistencia.id_asistencia} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {format(new Date(asistencia.fecha), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {asistencia.empleado?.nombre || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {asistencia.empleado?.cargo || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {asistencia.hora_entrada ? format(new Date(asistencia.hora_entrada), 'HH:mm') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {asistencia.hora_salida ? format(new Date(asistencia.hora_salida), 'HH:mm') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {calcularHorasTrabajadas(asistencia.hora_entrada, asistencia.hora_salida)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <Users className="w-12 h-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No hay registros de asistencia
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                No se encontraron registros para el período seleccionado
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'promociones' && (
              <PromocionesTab profile={{ id_empleado: 1 }} />
            )}

            {activeTab === 'lealtad' && (
              <LealtadTab profile={{ id_empleado: 1 }} />
            )}

             {activeTab === 'turnos' && (
              <TurnosTab profile={{ id_empleado: 1 }} />
            )}

            {activeTab === 'geofencing' && (
              <GeofencingTab />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
