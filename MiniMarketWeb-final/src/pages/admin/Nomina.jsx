import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, Calendar, Settings, FileText, Plus, TrendingUp, Users, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { nominaService } from '../../lib/nominaService'

export default function Nomina() {
  const [periodos, setPeriodos] = useState([])
  const [configuracion, setConfiguracion] = useState(null)
  const [periodoActivo, setPeriodoActivo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('periodos')
  const navigate = useNavigate()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [periodosData, configuracionData] = await Promise.all([
        nominaService.obtenerPeriodosNomina(),
        nominaService.obtenerConfiguracionNomina()
      ])
      
      setPeriodos(periodosData)
      setConfiguracion(configuracionData)
      
      // Buscar período activo
      const activo = periodosData.find(p => p.estado === 'abierto')
      setPeriodoActivo(activo)
    } catch (error) {
      toast.error('Error al cargar datos de nómina')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearPeriodo = () => {
    navigate('/admin/nomina/periodo/nuevo')
  }

  const handleConfigurarNomina = () => {
    navigate('/admin/nomina/configuracion')
  }

  const handleVerPeriodo = (idPeriodo) => {
    navigate(`/admin/nomina/periodo/${idPeriodo}`)
  }

  const handleProcesarNomina = async (idPeriodo) => {
    if (!confirm('¿Está seguro de procesar la nómina? Esta acción cerrará el período.')) return

    try {
      await nominaService.procesarNomina(idPeriodo)
      toast.success('Nómina procesada correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al procesar nómina')
      console.error(error)
    }
  }

  const handleCalcularNomina = async (idPeriodo) => {
    try {
      await nominaService.calcularNominaPeriodo(idPeriodo)
      toast.success('Nómina calculada correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al calcular nómina')
      console.error(error)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'abierto': return 'bg-green-100 text-green-800'
      case 'procesando': return 'bg-yellow-100 text-yellow-800'
      case 'cerrado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'abierto': return <Calendar className="w-4 h-4" />
      case 'procesando': return <Clock className="w-4 h-4" />
      case 'cerrado': return <FileText className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Nómina y Sueldos</h1>
          <p className="text-gray-600 mt-1">Gestiona la nómina y sueldos de empleados</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'periodos' && (
            <button
              onClick={handleCrearPeriodo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Período
            </button>
          )}
          <button
            onClick={handleConfigurarNomina}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['periodos', 'configuracion', 'reportes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'periodos' && 'Períodos de Nómina'}
              {tab === 'configuracion' && 'Configuración'}
              {tab === 'reportes' && 'Reportes'}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'periodos' && (
        <div className="space-y-4">
          {periodos.map((periodo) => (
            <div key={periodo.id_periodo} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getEstadoColor(periodo.estado)}`}>
                      {getEstadoIcon(periodo.estado)}
                      {periodo.estado.charAt(0).toUpperCase() + periodo.estado.slice(1)}
                    </span>
                    {periodo.estado === 'abierto' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Activo
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900">{periodo.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Período: {new Date(periodo.fecha_inicio).toLocaleDateString()} - {new Date(periodo.fecha_fin).toLocaleDateString()}
                  </p>
                  {periodo.fecha_proceso && (
                    <p className="text-sm text-gray-600">
                      Procesado: {new Date(periodo.fecha_proceso).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">${periodo.total_nomina.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total nómina</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleVerPeriodo(periodo.id_periodo)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Detalles
                </button>
                
                {periodo.estado === 'abierto' && (
                  <>
                    <button
                      onClick={() => handleCalcularNomina(periodo.id_periodo)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Calcular
                    </button>
                    <button
                      onClick={() => handleProcesarNomina(periodo.id_periodo)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Procesar
                    </button>
                  </>
                )}
                
                {periodo.estado === 'cerrado' && (
                  <button
                    onClick={() => navigate(`/admin/nomina/periodo/${periodo.id_periodo}/exportar`)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Exportar
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {periodos.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay períodos de nómina</h3>
              <p className="text-gray-600 mb-4">Crea un período para empezar a gestionar la nómina</p>
              <button
                onClick={handleCrearPeriodo}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear Período
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'configuracion' && (
        <div className="space-y-6">
          {configuracion ? (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Nómina</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">{configuracion.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Salario Base</label>
                    <p className="mt-1 text-sm text-gray-900">${configuracion.salario_base}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Días Laborales</label>
                    <p className="mt-1 text-sm text-gray-900">{configuracion.dias_laborales} días</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hora Entrada</label>
                    <p className="mt-1 text-sm text-gray-900">{configuracion.hora_entrada}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hora Salida</label>
                    <p className="mt-1 text-sm text-gray-900">{configuracion.hora_salida}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      configuracion.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {configuracion.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bono Puntualidad</label>
                    <p className="mt-1 text-sm text-gray-900">${configuracion.bono_puntualidad}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bono Asistencia</label>
                    <p className="mt-1 text-sm text-gray-900">${configuracion.bono_asistencia}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descuento Tardanza</label>
                    <p className="mt-1 text-sm text-gray-900">${configuracion.descuento_tardanza}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descuento Ausencia</label>
                    <p className="mt-1 text-sm text-gray-900">${configuracion.descuento_ausencia}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={handleConfigurarNomina}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar Configuración
                  </button>
                </div>
              </div>

              {/* Sección de bonos y deducciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BonosDeduccionesSection tipo="bonos" />
                <BonosDeduccionesSection tipo="deducciones" />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay configuración</h3>
              <p className="text-gray-600 mb-4">Configura los parámetros de nómina para empezar</p>
              <button
                onClick={handleConfigurarNomina}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configurar Nómina
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reportes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reportes de Nómina</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/admin/nomina/reporte/anual')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Reporte Anual</span>
                </div>
                <p className="text-sm text-gray-600">Ver estadísticas y totales anuales</p>
              </button>
              
              <button
                onClick={() => navigate('/admin/nomina/reporte/empleados')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Reporte por Empleado</span>
                </div>
                <p className="text-sm text-gray-600">Ver historial de nómina por empleado</p>
              </button>
              
              <button
                onClick={() => navigate('/admin/nomina/reporte/asistencia')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Reporte de Asistencia</span>
                </div>
                <p className="text-sm text-gray-600">Ver asistencia y su impacto en nómina</p>
              </button>
              
              <button
                onClick={() => navigate('/admin/nomina/reporte/general')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Reporte General</span>
                </div>
                <p className="text-sm text-gray-600">Ver resumen completo de nómina</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente auxiliar para bonos y deducciones
function BonosDeduccionesSection({ tipo }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarItems()
  }, [tipo])

  const cargarItems = async () => {
    try {
      const data = tipo === 'bonos' 
        ? await nominaService.obtenerBonos()
        : await nominaService.obtenerDeducciones()
      setItems(data)
    } catch (error) {
      console.error('Error al cargar items:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900 capitalize">{tipo}</h4>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Agregar {tipo.slice(0, -1)}
        </button>
      </div>
      
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id_bono || item.id_deduccion} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
              <p className="text-xs text-gray-600">{item.descripcion}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {item.tipo === 'fijo' ? `$${item.valor}` : `${item.valor}%`}
              </p>
              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                item.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay {tipo} configurados
          </p>
        )}
      </div>
    </div>
  )
}
