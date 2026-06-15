import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, Clock, Settings, Plus, ArrowRight, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { turnosService } from '../../lib/turnosService'

export default function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [tiposTurnos, setTiposTurnos] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('programacion')
  const [vistaMes, setVistaMes] = useState(new Date())
  const [busqueda, setBusqueda] = useState('')
  const [filtroEmpleado, setFiltroEmpleado] = useState('todos')
  const navigate = useNavigate()

  useEffect(() => {
    if (activeTab === 'programacion') {
      cargarProgramacion()
    } else if (activeTab === 'tipos') {
      cargarTiposTurnos()
    } else if (activeTab === 'empleados') {
      cargarEmpleados()
    }
  }, [activeTab, vistaMes])

  const cargarProgramacion = async () => {
    try {
      const primerDia = new Date(vistaMes.getFullYear(), vistaMes.getMonth(), 1)
      const ultimoDia = new Date(vistaMes.getFullYear(), vistaMes.getMonth() + 1, 0)
      
      const data = await turnosService.obtenerProgramacionTurnos(
        primerDia.toISOString().split('T')[0],
        ultimoDia.toISOString().split('T')[0]
      )
      setTurnos(data)
    } catch (error) {
      toast.error('Error al cargar programación de turnos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const cargarTiposTurnos = async () => {
    try {
      const data = await turnosService.obtenerTiposTurnos()
      setTiposTurnos(data)
    } catch (error) {
      toast.error('Error al cargar tipos de turnos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const cargarEmpleados = async () => {
    try {
      const primerDia = new Date(vistaMes.getFullYear(), vistaMes.getMonth(), 1)
      const ultimoDia = new Date(vistaMes.getFullYear(), vistaMes.getMonth() + 1, 0)
      
      const data = await turnosService.obtenerDisponibilidadEmpleados(primerDia.toISOString().split('T')[0])
      setEmpleados(data)
    } catch (error) {
      toast.error('Error al cargar disponibilidad de empleados')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearTipoTurno = () => {
    navigate('/admin/turnos/tipo/nuevo')
  }

  const handleProgramarTurnos = () => {
    navigate('/admin/turnos/programar')
  }

  const handleVerReporte = () => {
    navigate('/admin/turnos/reporte')
  }

  const agruparTurnosPorDia = () => {
    return turnos.reduce((acc, turno) => {
      const dia = turno.fecha
      if (!acc[dia]) {
        acc[dia] = []
      }
      acc[dia].push(turno)
      return acc
    }, {})
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'programado': return 'bg-blue-100 text-blue-800'
      case 'confirmado': return 'bg-green-100 text-green-800'
      case 'cumplido': return 'bg-gray-100 text-gray-800'
      case 'ausente': return 'bg-red-100 text-red-800'
      case 'cancelado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const turnosFiltrados = turnos.filter(turno => {
    const coincideBusqueda = 
      turno.empleado.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      turno.tipo_turno.nombre.toLowerCase().includes(busqueda.toLowerCase())
    
    const coincideEmpleado = filtroEmpleado === 'todos' || turno.empleado.id_empleado.toString() === filtroEmpleado
    
    return coincideBusqueda && coincideEmpleado
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600 mt-1">Administra la programación y tipos de turnos</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'programacion' && (
            <button
              onClick={handleProgramarTurnos}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Programar Turnos
            </button>
          )}
          {activeTab === 'tipos' && (
            <button
              onClick={handleCrearTipoTurno}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Nuevo Tipo
            </button>
          )}
          {activeTab === 'programacion' && (
            <button
              onClick={handleVerReporte}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Ver Reporte
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['programacion', 'tipos', 'empleados'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'programacion' && 'Programación'}
              {tab === 'tipos' && 'Tipos de Turno'}
              {tab === 'empleados' && 'Disponibilidad'}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'programacion' && (
        <div>
          {/* Controles de navegación y filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVistaMes(new Date(vistaMes.getFullYear(), vistaMes.getMonth() - 1))}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
                  {vistaMes.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setVistaMes(new Date(vistaMes.getFullYear(), vistaMes.getMonth() + 1))}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-4 flex-1">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por empleado o turno..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filtroEmpleado}
                    onChange={(e) => setFiltroEmpleado(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos los empleados</option>
                    {turnos.map(turno => (
                      <option key={turno.empleado.id_empleado} value={turno.empleado.id_empleado}>
                        {turno.empleado.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Calendario de turnos */}
          <div className="space-y-4">
            {Object.keys(agruparTurnosPorDia()).sort().length > 0 ? (
              Object.keys(agruparTurnosPorDia()).sort().map((dia) => (
                <div key={dia} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      {new Date(dia).toLocaleDateString('es', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    {agruparTurnosPorDia()[dia]
                      .filter(turno => {
                        const coincideBusqueda = 
                          turno.empleado.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          turno.tipo_turno.nombre.toLowerCase().includes(busqueda.toLowerCase())
                        
                        const coincideEmpleado = filtroEmpleado === 'todos' || turno.empleado.id_empleado.toString() === filtroEmpleado
                        
                        return coincideBusqueda && coincideEmpleado
                      })
                      .map((turno) => (
                      <div key={turno.id_turno} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: turno.tipo_turno.color }}
                          ></div>
                          <div>
                            <p className="font-medium text-gray-900">{turno.empleado.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {turno.tipo_turno.nombre} ({turno.tipo_turno.hora_inicio} - {turno.tipo_turno.hora_fin})
                            </p>
                            {turno.notas && (
                              <p className="text-sm text-gray-500 mt-1">Notas: {turno.notas}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getEstadoColor(turno.estado)}`}>
                            {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                          </span>
                          
                          <button
                            onClick={() => navigate(`/admin/turnos/${turno.id_turno}`)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay turnos programados</h3>
                <p className="text-gray-600">No hay turnos asignados para este período</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tipos' && (
        <div className="space-y-4">
          {tiposTurnos.map((tipo) => (
            <div key={tipo.id_turno_tipo} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tipo.color }}
                  ></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{tipo.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">{tipo.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/turnos/tipo/${tipo.id_turno_tipo}/editar`)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Hora inicio:</span>
                  <p className="font-medium text-gray-900">{tipo.hora_inicio}</p>
                </div>
                <div>
                  <span className="text-gray-600">Hora fin:</span>
                  <p className="font-medium text-gray-900">{tipo.hora_fin}</p>
                </div>
              </div>
            </div>
          ))}
          
          {tiposTurnos.length === 0 && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tipos de turno</h3>
              <p className="text-gray-600 mb-4">Crea tipos de turno para organizar el horario</p>
              <button
                onClick={handleCrearTipoTurno}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Crear Tipo de Turno
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'empleados' && (
        <div className="space-y-4">
          {empleados.map((empleado) => (
            <div key={empleado.id_empleado} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{empleado.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-1">Teléfono: {empleado.telefono}</p>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
                    empleado.disponible 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <Clock className="w-4 h-4" />
                    {empleado.disponible ? 'Disponible' : 'No disponible'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-600">Turnos asignados:</span>
                  <p className="font-medium text-gray-900">{empleado.turnos_asignados}</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas asignadas:</span>
                  <p className="font-medium text-gray-900">{empleado.horas_asignadas.toFixed(1)}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <p className="font-medium text-gray-900">{empleado.disponible ? 'Disponible' : 'Ocupado'}</p>
                </div>
              </div>
            </div>
          ))}
          
          {empleados.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empleados disponibles</h3>
              <p className="text-gray-600">No se encontraron empleados para mostrar</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
