import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, ArrowRight, Search, Filter, Settings, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { turnosService } from '../../../lib/turnosService'
import { supabase } from '../../../lib/supabase'

export default function TurnosTab({ profile }) {
  const [turnos, setTurnos] = useState([])
  const [tiposTurnos, setTiposTurnos] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaMes, setVistaMes] = useState(new Date())
  const [busqueda, setBusqueda] = useState('')

  // Modales
  const [showProgramarModal, setShowProgramarModal] = useState(false)
  const [showTipoTurnoModal, setShowTipoTurnoModal] = useState(false)

  // Datos de formularios
  const [formProgramar, setFormProgramar] = useState({
    id_empleado: '',
    id_turno_tipo: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  })

  const [formTipoTurno, setFormTipoTurno] = useState({
    nombre: '',
    hora_inicio: '08:00:00',
    hora_fin: '16:00:00',
    descripcion: '',
    color: '#6366f1'
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [vistaMes])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const year = vistaMes.getFullYear()
      const month = vistaMes.getMonth() + 1
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const [turnosData, tiposData, empleadosData] = await Promise.all([
        turnosService.obtenerProgramacionTurnos(startDate, endDate),
        turnosService.obtenerTiposTurnos(),
        supabase.from('empleado').select('id_empleado, nombre').order('nombre')
      ])

      setTurnos(turnosData || [])
      setTiposTurnos(tiposData || [])
      setEmpleados(empleadosData.data || [])
    } catch (error) {
      toast.error('Error al cargar datos de turnos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleProgramarTurno = async (e) => {
    e.preventDefault()
    if (!formProgramar.id_empleado || !formProgramar.id_turno_tipo || !formProgramar.fecha) {
      toast.error('Por favor complete todos los campos')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id_empleado: parseInt(formProgramar.id_empleado),
        id_turno_tipo: parseInt(formProgramar.id_turno_tipo),
        fecha: formProgramar.fecha,
        notas: formProgramar.notas || null,
        estado: 'programado'
      }

      await turnosService.crearProgramacionTurnos([payload])
      toast.success('Turno programado correctamente')
      setShowProgramarModal(false)
      setFormProgramar({
        id_empleado: '',
        id_turno_tipo: '',
        fecha: new Date().toISOString().split('T')[0],
        notas: ''
      })
      cargarDatos()
    } catch (error) {
      toast.error('Error al programar turno')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleCrearTipoTurno = async (e) => {
    e.preventDefault()
    if (!formTipoTurno.nombre || !formTipoTurno.hora_inicio || !formTipoTurno.hora_fin) {
      toast.error('Por favor complete los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await turnosService.crearTipoTurno({
        nombre: formTipoTurno.nombre,
        hora_inicio: formTipoTurno.hora_inicio,
        hora_fin: formTipoTurno.hora_fin,
        descripcion: formTipoTurno.descripcion || null,
        color: formTipoTurno.color
      })
      toast.success('Tipo de turno creado correctamente')
      setShowTipoTurnoModal(false)
      setFormTipoTurno({
        nombre: '',
        hora_inicio: '08:00:00',
        hora_fin: '16:00:00',
        descripcion: '',
        color: '#6366f1'
      })
      cargarDatos()
    } catch (error) {
      toast.error('Error al crear tipo de turno')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleEliminarTurno = async (idTurno) => {
    if (!confirm('¿Está seguro de eliminar este turno programado?')) return
    try {
      await turnosService.eliminarTurno(idTurno)
      toast.success('Turno eliminado correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar turno')
      console.error(error)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'programado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'confirmado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'cumplido': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'ausente': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const agruparTurnosPorDia = () => {
    const filtrados = turnos.filter(turno => {
      const nomEmpleado = turno.empleado?.nombre?.toLowerCase() || ''
      const nomTurno = turno.tipo_turno?.nombre?.toLowerCase() || ''
      const busq = busqueda.toLowerCase()
      return nomEmpleado.includes(busq) || nomTurno.includes(busq)
    })

    return filtrados.reduce((acc, turno) => {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  const turnosPorDia = agruparTurnosPorDia()
  const diasMes = Object.keys(turnosPorDia).sort()

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Turnos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Administra la programación y tipos de turnos de tus empleados</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowTipoTurnoModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-1 sm:flex-none text-sm font-semibold"
          >
            <Settings className="w-4 h-4" />
            Nuevo Tipo Turno
          </button>
          <button
            onClick={() => setShowProgramarModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-none text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Programar Turno
          </button>
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => setVistaMes(new Date(vistaMes.getFullYear(), vistaMes.getMonth() - 1))}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium text-sm capitalize">
            {vistaMes.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setVistaMes(new Date(vistaMes.getFullYear(), vistaMes.getMonth() + 1))}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por empleado o turno..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Calendario de turnos */}
      <div className="space-y-4">
        {diasMes.length > 0 ? (
          diasMes.map((dia) => (
            <div key={dia} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {new Date(dia + 'T00:00:00').toLocaleDateString('es', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {turnosPorDia[dia].map((turno) => (
                  <div key={turno.id_turno} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-850">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: turno.tipo_turno?.color || '#6366f1' }}
                      ></div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{turno.empleado?.nombre || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-450 mt-0.5">
                          {turno.tipo_turno?.nombre || 'Turno'} ({turno.tipo_turno?.hora_inicio?.substring(0, 5)} - {turno.tipo_turno?.hora_fin?.substring(0, 5)})
                        </p>
                        {turno.notas && (
                          <p className="text-xs text-gray-500 dark:text-gray-450 mt-1 italic">Nota: {turno.notas}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getEstadoColor(turno.estado)}`}>
                        {turno.estado}
                      </span>
                      <button
                        onClick={() => handleEliminarTurno(turno.id_turno)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                        title="Eliminar turno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay turnos programados</h3>
            <p className="text-gray-600 dark:text-gray-400">No hay turnos asignados para este período o filtro</p>
          </div>
        )}
      </div>

      {/* Resumen del mes */}
      <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Resumen del Mes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm border dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Total turnos</span>
            <span className="font-bold text-gray-900 dark:text-white text-lg">{turnos.length}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm border dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Programados</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
              {turnos.filter(t => t.estado === 'programado').length}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm border dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Confirmados</span>
            <span className="font-bold text-green-600 dark:text-green-400 text-lg">
              {turnos.filter(t => t.estado === 'confirmado').length}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm border dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Cumplidos</span>
            <span className="font-bold text-gray-600 dark:text-gray-400 text-lg">
              {turnos.filter(t => t.estado === 'cumplido').length}
            </span>
          </div>
        </div>
      </div>

      {/* MODALES */}

      {/* Modal Programar Turno */}
      {showProgramarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border dark:border-gray-700 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Programar Turno</h3>
              <button onClick={() => setShowProgramarModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-750">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProgramarTurno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empleado</label>
                <select
                  value={formProgramar.id_empleado}
                  onChange={(e) => setFormProgramar(prev => ({ ...prev, id_empleado: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Seleccione un empleado</option>
                  {empleados.map(emp => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>{emp.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Turno</label>
                <select
                  value={formProgramar.id_turno_tipo}
                  onChange={(e) => setFormProgramar(prev => ({ ...prev, id_turno_tipo: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Seleccione tipo de turno</option>
                  {tiposTurnos.map(tipo => (
                    <option key={tipo.id_turno_tipo} value={tipo.id_turno_tipo}>
                      {tipo.nombre} ({tipo.hora_inicio?.substring(0, 5)} - {tipo.hora_fin?.substring(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={formProgramar.fecha}
                  onChange={(e) => setFormProgramar(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea 
                  value={formProgramar.notas}
                  onChange={(e) => setFormProgramar(prev => ({ ...prev, notas: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ej. Reemplazo, horas extra..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowProgramarModal(false)} 
                  className="flex-1 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-650 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
                >
                  {saving ? 'Guardando...' : 'Programar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Tipo Turno */}
      {showTipoTurnoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border dark:border-gray-700 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo Tipo de Turno</h3>
              <button onClick={() => setShowTipoTurnoModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-750">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearTipoTurno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={formTipoTurno.nombre}
                  onChange={(e) => setFormTipoTurno(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  placeholder="Ej. Mañana, Noche, Finde"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Inicio</label>
                  <input 
                    type="time" 
                    step="1"
                    value={formTipoTurno.hora_inicio}
                    onChange={(e) => setFormTipoTurno(prev => ({ ...prev, hora_inicio: e.target.value.includes(':') && e.target.value.split(':').length === 2 ? e.target.value + ':00' : e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Fin</label>
                  <input 
                    type="time" 
                    step="1"
                    value={formTipoTurno.hora_fin}
                    onChange={(e) => setFormTipoTurno(prev => ({ ...prev, hora_fin: e.target.value.includes(':') && e.target.value.split(':').length === 2 ? e.target.value + ':00' : e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color representativo</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formTipoTurno.color}
                    onChange={(e) => setFormTipoTurno(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 border-0 cursor-pointer rounded bg-transparent"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Este color se usará en el calendario.</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea 
                  value={formTipoTurno.descripcion}
                  onChange={(e) => setFormTipoTurno(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Descripción del horario..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowTipoTurnoModal(false)} 
                  className="flex-1 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-650 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold"
                >
                  {saving ? 'Guardando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
