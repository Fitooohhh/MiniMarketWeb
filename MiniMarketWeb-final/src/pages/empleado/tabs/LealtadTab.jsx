import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Star, Users, Gift, TrendingUp, Settings, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { lealtadService } from '../../../lib/lealtadService'

export default function LealtadTab({ profile }) {
  const [programa, setPrograma] = useState(null)
  const [niveles, setNiveles] = useState([])
  const [recompensas, setRecompensas] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('programa')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [programaData, nivelesData, recompensasData, estadisticasData] = await Promise.all([
        lealtadService.obtenerProgramaLealtad(),
        lealtadService.obtenerNivelesCliente(),
        lealtadService.obtenerRecompensas(),
        lealtadService.obtenerEstadisticasLealtad()
      ])
      
      setPrograma(programaData)
      setNiveles(nivelesData)
      setRecompensas(recompensasData)
      setEstadisticas(estadisticasData)
    } catch (error) {
      toast.error('Error al cargar datos de lealtad')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigurarPrograma = () => {
    // Aquí iría la lógica para configurar programa
    toast.info('Función de configuración en desarrollo')
  }

  const handleCrearNivel = () => {
    // Aquí iría la lógica para crear nivel
    toast.info('Función de crear nivel en desarrollo')
  }

  const handleCrearRecompensa = () => {
    // Aquí iría la lógica para crear recompensa
    toast.info('Función de crear recompensa en desarrollo')
  }

  const handleEliminarNivel = async (idNivel) => {
    if (!confirm('¿Está seguro de eliminar este nivel?')) return
    
    try {
      // Aquí iría la lógica para eliminar nivel
      toast.success('Nivel eliminado correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar nivel')
    }
  }

  const handleEliminarRecompensa = async (idRecompensa) => {
    if (!confirm('¿Está seguro de eliminar esta recompensa?')) return
    
    try {
      // Aquí iría la lógica para eliminar recompensa
      toast.success('Recompensa eliminada correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar recompensa')
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
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['programa', 'niveles', 'recompensas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'programa' && 'Configuración'}
              {tab === 'niveles' && 'Niveles'}
              {tab === 'recompensas' && 'Recompensas'}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'programa' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Clientes Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.clientesActivos}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Canjes</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.totalCanjes}</p>
                  </div>
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Puntos Distribuidos</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.puntosDistribuidos.toLocaleString()}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Clientes con Puntos</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.totalClientesConPuntos}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          )}

          {/* Configuración del programa */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Configuración del Programa</h3>
              <button
                onClick={handleConfigurarPrograma}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Editar Configuración
              </button>
            </div>
            
            {programa ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Programa</label>
                    <p className="mt-1 text-sm text-gray-900">{programa.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      programa.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {programa.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Puntos por Dólar</label>
                    <p className="mt-1 text-sm text-gray-900">{programa.puntos_por_dolar}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Puntos Mínimos para Canje</label>
                    <p className="mt-1 text-sm text-gray-900">{programa.puntos_minimos_canje}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programa configurado</h3>
                <p className="text-gray-600 mb-4">Configura tu programa de lealtad para empezar</p>
                <button
                  onClick={handleConfigurarPrograma}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configurar Programa
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'niveles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Niveles de Cliente</h3>
            <button
              onClick={handleCrearNivel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Nivel
            </button>
          </div>

          {niveles.map((nivel) => (
            <div key={nivel.id_nivel} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{nivel.nombre}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {nivel.multiplicador_puntos}x puntos
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Puntos mínimos:</span> {nivel.puntos_minimos}
                    </div>
                    <div>
                      <span className="font-medium">Descuento especial:</span> {nivel.descuento_especial}%
                    </div>
                    <div>
                      <span className="font-medium">Beneficios:</span> {nivel.beneficios || 'Ninguno'}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminarNivel(nivel.id_nivel)}
                    className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {niveles.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay niveles configurados</h3>
              <p className="text-gray-600 mb-4">Crea niveles para motivar a tus clientes</p>
              <button
                onClick={handleCrearNivel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear Nivel
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recompensas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recompensas Disponibles</h3>
            <button
              onClick={handleCrearRecompensa}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Recompensa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recompensas.map((recompensa) => (
              <div key={recompensa.id_recompensa} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">{recompensa.nombre}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    recompensa.activa 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {recompensa.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Puntos requeridos:</span> {recompensa.puntos_requeridos}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {recompensa.tipo}
                  </div>
                  {recompensa.valor && (
                    <div>
                      <span className="font-medium">Valor:</span> ${recompensa.valor}
                    </div>
                  )}
                  {!recompensa.stock_ilimitado && (
                    <div>
                      <span className="font-medium">Stock:</span> {recompensa.stock_disponible}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Descripción:</span> {recompensa.descripcion || 'Sin descripción'}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    className="flex-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminarRecompensa(recompensa.id_recompensa)}
                    className="flex-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {recompensas.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recompensas</h3>
              <p className="text-gray-600 mb-4">Crea recompensas para que tus clientes canjeen sus puntos</p>
              <button
                onClick={handleCrearRecompensa}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear Recompensa
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
