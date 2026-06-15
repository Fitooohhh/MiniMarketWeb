import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, ArrowRight, Search, Filter, Settings, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TurnosTab({ profile }) {
  const [turnos, setTurnos] = useState([])
  const [tiposTurnos, setTiposTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaMes, setVistaMes] = useState(new Date())
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarProgramacion()
    cargarTiposTurnos()
  }, [vistaMes])

  const cargarProgramacion = async () => {
    try {
      // Simulación de datos
      const data = [
        {
          id_turno: 1,
          empleado: { id_empleado: 1, nombre: 'Juan Pérez' },
          tipo_turno: { id_turno_tipo: 1, nombre: 'Mañana', hora_inicio: '08:00', hora_fin: '16:00', color: '#6366f1' },
          fecha: new Date().toISOString().split('T')[0],
          estado: 'programado',
          notas: 'Turno regular'
        },
        {
          id_turno: 2,
          empleado: { id_empleado: 2, nombre: 'María García' },
          tipo_turno: { id_turno_tipo: 2, nombre: 'Tarde', hora_inicio: '16:00', hora_fin: '00:00', color: '#10b981' },
          fecha: new Date().toISOString().split('T')[0],
          estado: 'confirmado',
          notas: 'Turno especial'
        }
      ]
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
      // Simulación de datos
      const data = [
        { id_turno_tipo: 1, nombre: 'Mañana', hora_inicio: '08:00', hora_fin: '16:00', color: '#6366f1', descripcion: 'Turno matutino' },
        { id_turno_tipo: 2, nombre: 'Tarde', hora_inicio: '16:00', hora_fin: '00:00', color: '#10b981', descripcion: 'Turno vespertino' },
        { id_turno_tipo: 3, nombre: 'Noche', hora_inicio: '00:00', hora_fin: '08:00', color: '#f59e0b', descripcion: 'Turno nocturno' }
      ]
      setTiposTurnos(data)
    } catch (error) {
      toast.error('Error al cargar tipos de turnos')
      console.error(error)
    }
  }

  const handleCrearPeriodo = () => {
    toast.info('Función de crear período en desarrollo')
  }

  const handleGenerarTurnos = () => {
    toast.info('Función de generar turnos en desarrollo')
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'programado': return 'bg-blue-100 text-blue-800'
      case 'confirmado': return 'bg-green-100 text-green-800'
      case 'cumplido': return 'bg-gray-100 text-gray-800'
      case 'ausente': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const turnosPorDia = agruparTurnosPorDia()
  const diasMes = Object.keys(turnosPorDia).sort()

  return (
    <div>
      {/* Header con acciones */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Turnos</h2>
          <p className="text-gray-600 mt-1">Administra la programación y tipos de turnos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCrearPeriodo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Programar Turnos
          </button>
          <button
            onClick={handleGenerarTurnos}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Generar Automático
          </button>
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="flex justify-between items-center mb-6">
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
        <div className="flex items-center gap-2">
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
      </div>

      {/* Calendario de turnos */}
      <div className="space-y-4">
        {diasMes.length > 0 ? (
          diasMes.map((dia) => (
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
                {turnosPorDia[dia].map((turno) => (
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

      {/* Resumen del mes */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Resumen del Mes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total turnos:</span>
            <span className="ml-2 font-medium text-gray-900">{turnos.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Programados:</span>
            <span className="ml-2 font-medium text-blue-600">
              {turnos.filter(t => t.estado === 'programado').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Confirmados:</span>
            <span className="ml-2 font-medium text-green-600">
              {turnos.filter(t => t.estado === 'confirmado').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Cumplidos:</span>
            <span className="ml-2 font-medium text-gray-600">
              {turnos.filter(t => t.estado === 'cumplido').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
