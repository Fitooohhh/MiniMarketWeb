import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Star, Users, Gift, TrendingUp, Settings, Search, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { lealtadService } from '../../../lib/lealtadService'
import { supabase } from '../../../lib/supabase'

export default function LealtadTab({ profile }) {
  const [programa, setPrograma] = useState(null)
  const [niveles, setNiveles] = useState([])
  const [recompensas, setRecompensas] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('programa')

  // Modales
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showNivelModal, setShowNivelModal] = useState(false)
  const [showRecompensaModal, setShowRecompensaModal] = useState(false)
  
  // Objetos en edición
  const [editingNivel, setEditingNivel] = useState(null)
  const [editingRecompensa, setEditingRecompensa] = useState(null)

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
      setNiveles(nivelesData || [])
      setRecompensas(recompensasData || [])
      setEstadisticas(estadisticasData)
    } catch (error) {
      toast.error('Error al cargar datos de lealtad')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigurarPrograma = () => {
    setShowConfigModal(true)
  }

  const handleCrearNivel = () => {
    setEditingNivel(null)
    setShowNivelModal(true)
  }

  const handleEditarNivel = (nivel) => {
    setEditingNivel(nivel)
    setShowNivelModal(true)
  }

  const handleCrearRecompensa = () => {
    setEditingRecompensa(null)
    setShowRecompensaModal(true)
  }

  const handleEditarRecompensa = (recompensa) => {
    setEditingRecompensa(recompensa)
    setShowRecompensaModal(true)
  }

  const handleEliminarNivel = async (idNivel) => {
    if (!confirm('¿Está seguro de eliminar este nivel?')) return
    
    try {
      const { error } = await supabase
        .from('nivel_cliente')
        .delete()
        .eq('id_nivel', idNivel)

      if (error) throw error

      toast.success('Nivel eliminado correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar nivel')
      console.error(error)
    }
  }

  const handleEliminarRecompensa = async (idRecompensa) => {
    if (!confirm('¿Está seguro de eliminar esta recompensa?')) return
    
    try {
      const { error } = await supabase
        .from('recompensa')
        .delete()
        .eq('id_recompensa', idRecompensa)

      if (error) throw error

      toast.success('Recompensa eliminada correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar recompensa')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['programa', 'niveles', 'recompensas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Activos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.clientesActivos}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Canjes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.totalCanjes}</p>
                  </div>
                  <Gift className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Puntos Distribuidos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.puntosDistribuidos.toLocaleString()}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clientes con Puntos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.totalClientesConPuntos}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          )}

          {/* Configuración del programa */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuración del Programa</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reglas generales de asignación y canje de puntos</p>
              </div>
              <button
                onClick={handleConfigurarPrograma}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Editar Configuración
              </button>
            </div>
            
            {programa ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nombre del Programa</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{programa.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                    <span className={`mt-1 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      programa.activo 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {programa.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Puntos por Boliviano</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{programa.puntos_por_boliviano || programa.puntos_por_dolar}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Mínimo para Canjear</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{programa.minimo_puntos_canje || programa.puntos_minimos_canje} pts</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay programa configurado</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Configura tu programa de lealtad para empezar</p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Niveles de Cliente</h3>
            <button
              onClick={handleCrearNivel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Nivel
            </button>
          </div>

          <div className="space-y-3">
            {niveles.map((nivel) => (
              <div key={nivel.id_nivel} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-white">{nivel.nombre}</h4>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        {nivel.multiplicador_puntos}x puntos
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Pedidos mínimos:</span> {nivel.puntos_minimos}
                      </div>
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Descuento especial:</span> {nivel.descuento_especial}%
                      </div>
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Beneficios:</span> {nivel.beneficios || 'Ninguno'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditarNivel(nivel)}
                      className="flex items-center px-3 py-1.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminarNivel(nivel.id_nivel)}
                      className="flex items-center px-3 py-1.5 text-xs bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {niveles.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay niveles configurados</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Crea niveles para motivar a tus clientes</p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recompensas Disponibles</h3>
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
              <div key={recompensa.id_recompensa} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{recompensa.nombre}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      recompensa.activa 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {recompensa.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <span className="font-semibold text-gray-500 dark:text-gray-400">Puntos:</span> {recompensa.puntos_requeridos} pts
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 dark:text-gray-400">Tipo:</span> {recompensa.tipo}
                    </div>
                    {recompensa.valor && (
                      <div>
                        <span className="font-semibold text-gray-500 dark:text-gray-400">Valor:</span> Bs {recompensa.valor}
                      </div>
                    )}
                    {!recompensa.stock_ilimitado && (
                      <div>
                        <span className="font-semibold text-gray-500 dark:text-gray-400">Stock:</span> {recompensa.stock_disponible} uds
                      </div>
                    )}
                    {recompensa.descripcion && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {recompensa.descripcion}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-150 dark:border-gray-700">
                  <button
                    onClick={() => handleEditarRecompensa(recompensa)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminarRecompensa(recompensa.id_recompensa)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {recompensas.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay recompensas</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Crea recompensas para que tus clientes canjeen sus puntos</p>
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

      {/* MODALES */}

      {/* Modal Configuración del Programa */}
      {showConfigModal && (
        <ConfigProgramaModal 
          programa={programa}
          onClose={() => setShowConfigModal(false)}
          onSave={() => {
            setShowConfigModal(false)
            cargarDatos()
          }}
        />
      )}

      {/* Modal Nivel */}
      {showNivelModal && (
        <NivelModal 
          nivel={editingNivel}
          onClose={() => setShowNivelModal(false)}
          onSave={() => {
            setShowNivelModal(false)
            cargarDatos()
          }}
        />
      )}

      {/* Modal Recompensa */}
      {showRecompensaModal && (
        <RecompensaModal 
          recompensa={editingRecompensa}
          onClose={() => setShowRecompensaModal(false)}
          onSave={() => {
            setShowRecompensaModal(false)
            cargarDatos()
          }}
        />
      )}
    </div>
  )
}

// Modal Configuración
function ConfigProgramaModal({ programa, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: 'Programa General de Lealtad',
    puntos_por_boliviano: 0.1,
    minimo_puntos_canje: 10,
    activo: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (programa) {
      setFormData({
        nombre: programa.nombre || 'Programa General de Lealtad',
        puntos_por_boliviano: programa.puntos_por_boliviano || 0.1,
        minimo_puntos_canje: programa.minimo_puntos_canje || 10,
        activo: programa.activo ?? true
      })
    }
  }, [programa])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        nombre: formData.nombre,
        puntos_por_boliviano: parseFloat(formData.puntos_por_boliviano),
        puntos_por_dolar: parseFloat(formData.puntos_por_boliviano), // para retrocompatibilidad
        minimo_puntos_canje: parseInt(formData.minimo_puntos_canje),
        puntos_minimos_canje: parseInt(formData.minimo_puntos_canje), // para retrocompatibilidad
        activo: formData.activo
      }

      if (programa?.id_programa) {
        const { error } = await supabase
          .from('programa_lealtad')
          .update(payload)
          .eq('id_programa', programa.id_programa)
        if (error) throw error
        toast.success('Configuración actualizada')
      } else {
        const { error } = await supabase
          .from('programa_lealtad')
          .insert([payload])
        if (error) throw error
        toast.success('Programa configurado')
      }
      onSave()
    } catch (e) {
      toast.error('Error al guardar configuración')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Programa de Lealtad</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pts por Bs Gastado</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={formData.puntos_por_boliviano}
                onChange={(e) => setFormData(p => ({ ...p, puntos_por_boliviano: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mínimo para Canje</label>
              <input 
                type="number" 
                min="1"
                value={formData.minimo_puntos_canje}
                onChange={(e) => setFormData(p => ({ ...p, minimo_puntos_canje: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input 
              type="checkbox" 
              checked={formData.activo}
              onChange={(e) => setFormData(p => ({ ...p, activo: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Programa Activo</label>
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Nivel
function NivelModal({ nivel, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    puntos_minimos: 0,
    multiplicador_puntos: 1,
    descuento_especial: 0,
    beneficios: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (nivel) {
      setFormData({
        nombre: nivel.nombre || '',
        puntos_minimos: nivel.puntos_minimos || 0,
        multiplicador_puntos: nivel.multiplicador_puntos || 1,
        descuento_especial: nivel.descuento_especial || 0,
        beneficios: nivel.beneficios || ''
      })
    }
  }, [nivel])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        nombre: formData.nombre,
        puntos_minimos: parseInt(formData.puntos_minimos),
        multiplicador_puntos: parseFloat(formData.multiplicador_puntos),
        descuento_especial: parseFloat(formData.descuento_especial),
        beneficios: formData.beneficios
      }

      if (nivel) {
        const { error } = await supabase
          .from('nivel_cliente')
          .update(payload)
          .eq('id_nivel', nivel.id_nivel)
        if (error) throw error
        toast.success('Nivel actualizado')
      } else {
        const { error } = await supabase
          .from('nivel_cliente')
          .insert([payload])
        if (error) throw error
        toast.success('Nivel creado')
      }
      onSave()
    } catch (e) {
      toast.error('Error al guardar nivel')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{nivel ? 'Editar Nivel' : 'Nuevo Nivel'}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Nivel</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
              required
              placeholder="Ej. Oro, Plata"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pedidos Mínimos</label>
              <input 
                type="number" 
                min="0"
                value={formData.puntos_minimos}
                onChange={(e) => setFormData(p => ({ ...p, puntos_minimos: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Multiplicador Pts</label>
              <input 
                type="number" 
                step="0.1"
                min="1"
                value={formData.multiplicador_puntos}
                onChange={(e) => setFormData(p => ({ ...p, multiplicador_puntos: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descuento Especial (%)</label>
            <input 
              type="number" 
              min="0"
              max="100"
              value={formData.descuento_especial}
              onChange={(e) => setFormData(p => ({ ...p, descuento_especial: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beneficios (Descripción)</label>
            <textarea 
              value={formData.beneficios}
              onChange={(e) => setFormData(p => ({ ...p, beneficios: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Recompensa
function RecompensaModal({ recompensa, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    puntos_requeridos: 50,
    tipo: 'descuento',
    valor: '',
    stock_disponible: 10,
    stock_ilimitado: true,
    activa: true,
    descripcion: '',
    id_producto_relacionado: ''
  })
  const [todosProductos, setTodosProductos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase.from('producto').select('id_producto, nombre').order('nombre')
      if (error) throw error
      setTodosProductos(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (recompensa) {
      setFormData({
        nombre: recompensa.nombre || '',
        puntos_requeridos: recompensa.puntos_requeridos || 50,
        tipo: recompensa.tipo || 'descuento',
        valor: recompensa.valor || '',
        stock_disponible: recompensa.stock_disponible || 10,
        stock_ilimitado: recompensa.stock_ilimitado ?? true,
        activa: recompensa.activa ?? true,
        descripcion: recompensa.descripcion || '',
        id_producto_relacionado: recompensa.id_producto_relacionado || ''
      })
    }
  }, [recompensa])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        nombre: formData.nombre,
        puntos_requeridos: parseInt(formData.puntos_requeridos),
        tipo: formData.tipo,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        stock_disponible: formData.stock_ilimitado ? null : parseInt(formData.stock_disponible),
        stock_ilimitado: formData.stock_ilimitado,
        activa: formData.activa,
        descripcion: formData.descripcion,
        id_producto_relacionado: formData.id_producto_relacionado ? parseInt(formData.id_producto_relacionado) : null
      }

      if (recompensa) {
        const { error } = await supabase
          .from('recompensa')
          .update(payload)
          .eq('id_recompensa', recompensa.id_recompensa)
        if (error) throw error
        toast.success('Recompensa actualizada')
      } else {
        const { error } = await supabase
          .from('recompensa')
          .insert([payload])
        if (error) throw error
        toast.success('Recompensa creada')
      }
      onSave()
    } catch (e) {
      toast.error('Error al guardar recompensa')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border dark:border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{recompensa ? 'Editar Recompensa' : 'Nueva Recompensa'}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input 
              type="text" 
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pts Requeridos</label>
              <input 
                type="number" 
                name="puntos_requeridos"
                min="1"
                value={formData.puntos_requeridos}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="descuento">Descuento</option>
                <option value="producto">Producto de Regalo</option>
                <option value="servicio">Otro Beneficio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (Bs)</label>
              <input 
                type="number" 
                name="valor"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={handleInputChange}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producto Vinculado</label>
              <select
                name="id_producto_relacionado"
                value={formData.id_producto_relacionado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Ninguno</option>
                {todosProductos.map(p => (
                  <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {!formData.stock_ilimitado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Disponible</label>
              <input 
                type="number" 
                name="stock_disponible"
                min="0"
                value={formData.stock_disponible}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                name="stock_ilimitado"
                checked={formData.stock_ilimitado}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Stock Ilimitado</label>
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                name="activa"
                checked={formData.activa}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Activa</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea 
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
