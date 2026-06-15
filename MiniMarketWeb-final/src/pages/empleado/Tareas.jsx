import { useEffect, useState } from 'react'
import { CheckSquare, Clock, AlertCircle, Filter } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function EmpleadoTareas() {
  const { profile } = useAuthStore()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [selectedTarea, setSelectedTarea] = useState(null)
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    loadTareas()
  }, [filtro])

  const loadTareas = async () => {
    try {
      // Cargar repartos con datos de la venta y cliente
      let query = supabase
        .from('reparto')
        .select(`
          *,
          venta:id_venta(
            total,
            fecha,
            cliente:id_cliente(
              nombre,
              direccion,
              telefono
            )
          )
        `)
        .eq('id_empleado', profile.id_empleado)
        .order('fecha', { ascending: false })

      if (filtro !== 'todas') {
        query = query.eq('estado', filtro)
      }

      const { data, error } = await query

      if (error) throw error
      setTareas(data || [])
    } catch (error) {
      console.error('Error loading tareas:', error)
      toast.error('Error al cargar repartos')
    } finally {
      setLoading(false)
    }
  }

  const updateEstado = async (repartoId, nuevoEstado) => {
    try {
      const updates = {
        estado: nuevoEstado
      }

      if (observaciones) {
        updates.observaciones = observaciones
      }

      if (nuevoEstado === 'completada') {
        updates.fecha_completada = new Date().toISOString()
      }

      const { error } = await supabase
        .from('reparto')
        .update(updates)
        .eq('id_reparto', repartoId)

      if (error) throw error

      toast.success('Reparto actualizado')
      setObservaciones('')
      setSelectedTarea(null)
      loadTareas()
    } catch (error) {
      console.error('Error updating tarea:', error)
      toast.error('Error al actualizar tarea')
    }
  }

  const getPrioridadBadge = (prioridad) => {
    const badges = {
      baja: 'badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      media: 'badge badge-info',
      alta: 'badge badge-warning',
      urgente: 'badge badge-danger',
    }
    return badges[prioridad] || 'badge'
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge badge-warning',
      en_progreso: 'badge badge-info',
      completada: 'badge badge-success',
      cancelada: 'badge badge-danger',
    }
    return badges[estado] || 'badge'
  }

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada',
    }
    return labels[estado] || estado
  }

  const isVencida = (fechaLimite) => {
    return new Date(fechaLimite) < new Date()
  }

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mis Tareas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona tus tareas asignadas
            </p>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input py-2"
            >
              <option value="todas">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completada">Completadas</option>
            </select>
          </div>
        </div>

        {/* Lista de tareas */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : tareas.length === 0 ? (
          <div className="card text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay tareas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filtro === 'todas' 
                ? 'No tienes tareas asignadas'
                : `No hay tareas ${getEstadoLabel(filtro).toLowerCase()}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tareas.map((tarea) => {
              const vencida = tarea.fecha_limite && isVencida(tarea.fecha_limite) && tarea.estado !== 'completada'
              
              return (
                <div 
                  key={tarea.id} 
                  className={`card hover:shadow-lg transition-shadow ${
                    vencida ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Info de la tarea */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <CheckSquare className="w-5 h-5 text-primary-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {tarea.titulo}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={getPrioridadBadge(tarea.prioridad)}>
                              {tarea.prioridad.toUpperCase()}
                            </span>
                            <span className={getEstadoBadge(tarea.estado)}>
                              {getEstadoLabel(tarea.estado)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {tarea.descripcion && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {tarea.descripcion}
                        </p>
                      )}

                      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                        {tarea.fecha_inicio && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Inicio: {format(new Date(tarea.fecha_inicio), 'dd/MM/yyyy')}
                          </div>
                        )}
                        {tarea.fecha_limite && (
                          <div className={`flex items-center ${vencida ? 'text-red-600 font-semibold' : ''}`}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Límite: {format(new Date(tarea.fecha_limite), 'dd/MM/yyyy')}
                            {vencida && ' - ¡VENCIDA!'}
                          </div>
                        )}
                        {tarea.fecha_completada && (
                          <div className="flex items-center text-green-600">
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Completada: {format(new Date(tarea.fecha_completada), 'dd/MM/yyyy HH:mm')}
                          </div>
                        )}
                      </div>

                      {tarea.observaciones && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                          <span className="font-medium">Observaciones:</span> {tarea.observaciones}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    {tarea.estado !== 'completada' && tarea.estado !== 'cancelada' && (
                      <div className="flex flex-col gap-2 lg:w-48">
                        {tarea.estado === 'pendiente' && (
                          <button
                            onClick={() => updateEstado(tarea.id, 'en_progreso')}
                            className="btn btn-primary text-sm"
                          >
                            Iniciar Tarea
                          </button>
                        )}
                        {tarea.estado === 'en_progreso' && (
                          <button
                            onClick={() => setSelectedTarea(tarea)}
                            className="btn btn-primary text-sm"
                          >
                            Marcar Completada
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal para completar tarea */}
        {selectedTarea && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Completar Tarea
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedTarea.titulo}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones finales (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Agregar comentarios sobre la tarea completada..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedTarea(null)
                    setObservaciones('')
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => updateEstado(selectedTarea.id, 'completada')}
                  className="btn btn-primary flex-1"
                >
                  Completar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
