import { useState, useEffect } from 'react'
import { Calendar, Clock, Truck, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { turnosService } from '../../lib/turnosService'
import { useAuthStore } from '../../store/useAuthStore'

export default function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaMes, setVistaMes] = useState(new Date())
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.profile?.id_empleado) {
      cargarTurnos()
    }
  }, [user, vistaMes])

  const cargarTurnos = async () => {
    try {
      const idEmpleado = user.profile.id_empleado
      const primerDia = new Date(vistaMes.getFullYear(), vistaMes.getMonth(), 1)
      const ultimoDia = new Date(vistaMes.getFullYear(), vistaMes.getMonth() + 1, 0)
      
      const data = await turnosService.obtenerTurnosEmpleado(
        idEmpleado,
        primerDia.toISOString().split('T')[0],
        ultimoDia.toISOString().split('T')[0]
      )
      setTurnos(data)
    } catch (error) {
      toast.error('Error al cargar turnos de entrega')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarAsistencia = async (idTurno, estado) => {
    try {
      await turnosService.actualizarEstadoTurno(idTurno, estado)
      toast.success(`Turno marcado como ${estado}`)
      cargarTurnos()
    } catch (error) {
      toast.error('Error al actualizar estado del turno')
      console.error(error)
    }
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

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'programado': return <Calendar className="w-4 h-4" />
      case 'confirmado': return <Clock className="w-4 h-4" />
      case 'cumplido': return <CheckCircle className="w-4 h-4" />
      case 'ausente': return <XCircle className="w-4 h-4" />
      case 'cancelado': return <XCircle className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
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

  const getTurnosHoy = () => {
    const hoy = new Date().toISOString().split('T')[0]
    return turnos.filter(turno => turno.fecha === hoy)
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
  const turnosHoy = getTurnosHoy()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turnos de Entrega</h1>
          <p className="text-gray-600 mt-1">Gestiona tu horario de entregas</p>
        </div>
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
      </div>

      {/* Turnos de hoy */}
      {turnosHoy.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Turnos de Hoy</h3>
          <div className="space-y-3">
            {turnosHoy.map((turno) => (
              <div key={turno.id_turno} className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{turno.tipo_turno.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {turno.tipo_turno.hora_inicio} - {turno.tipo_turno.hora_fin}
                      </p>
                      {turno.notas && (
                        <p className="text-sm text-gray-500 mt-1">Notas: {turno.notas}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getEstadoColor(turno.estado)}`}>
                      {getEstadoIcon(turno.estado)}
                      {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                    </span>
                    
                    {turno.estado === 'programado' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarcarAsistencia(turno.id_turno, 'confirmado')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Iniciar Turno
                        </button>
                        <button
                          onClick={() => handleMarcarAsistencia(turno.id_turno, 'ausente')}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          No Asistir
                        </button>
                      </div>
                    )}
                    
                    {turno.estado === 'confirmado' && (
                      <button
                        onClick={() => handleMarcarAsistencia(turno.id_turno, 'cumplido')}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Finalizar Turno
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {dia === new Date().toISOString().split('T')[0] && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    Hoy
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                {turnosPorDia[dia].map((turno) => (
                  <div key={turno.id_turno} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: turno.tipo_turno.color }}
                      ></div>
                      <Truck className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{turno.tipo_turno.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {turno.tipo_turno.hora_inicio} - {turno.tipo_turno.hora_fin}
                        </p>
                        {turno.notas && (
                          <p className="text-sm text-gray-500 mt-1">Notas: {turno.notas}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getEstadoColor(turno.estado)}`}>
                        {getEstadoIcon(turno.estado)}
                        {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                      </span>
                      
                      {dia === new Date().toISOString().split('T')[0] && turno.estado === 'programado' && (
                        <button
                          onClick={() => handleMarcarAsistencia(turno.id_turno, 'confirmado')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Iniciar
                        </button>
                      )}
                      
                      {dia === new Date().toISOString().split('T')[0] && turno.estado === 'confirmado' && (
                        <button
                          onClick={() => handleMarcarAsistencia(turno.id_turno, 'cumplido')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay turnos programados</h3>
            <p className="text-gray-600">No tienes turnos de entrega asignados para este período</p>
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
            <span className="text-gray-600">En curso:</span>
            <span className="ml-2 font-medium text-yellow-600">
              {turnos.filter(t => t.estado === 'confirmado').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Completados:</span>
            <span className="ml-2 font-medium text-green-600">
              {turnos.filter(t => t.estado === 'cumplido').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
