import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Gift, TrendingUp, Clock, CheckCircle, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { lealtadService } from '../../lib/lealtadService'
import { useAuthStore } from '../../store/useAuthStore'

export default function Lealtad() {
  const [infoLealtad, setInfoLealtad] = useState(null)
  const [historialPuntos, setHistorialPuntos] = useState([])
  const [recompensas, setRecompensas] = useState([])
  const [recompensasDisponibles, setRecompensasDisponibles] = useState([])
  const [historialCanjes, setHistorialCanjes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumen')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.profile?.id_cliente) {
      cargarDatosCliente()
    }
  }, [user])

  const cargarDatosCliente = async () => {
    try {
      const idCliente = user.profile.id_cliente
      
      const [
        infoLealtadData,
        historialPuntosData,
        recompensasData,
        recompensasDisponiblesData,
        historialCanjesData
      ] = await Promise.all([
        lealtadService.obtenerInfoLealtadCliente(idCliente),
        lealtadService.obtenerHistorialPuntos(idCliente),
        lealtadService.obtenerRecompensas(),
        lealtadService.obtenerRecompensasDisponiblesCliente(idCliente),
        lealtadService.obtenerHistorialCanjes(idCliente)
      ])
      
      setInfoLealtad(infoLealtadData)
      setHistorialPuntos(historialPuntosData)
      setRecompensas(recompensasData)
      setRecompensasDisponibles(recompensasDisponiblesData)
      setHistorialCanjes(historialCanjesData)
    } catch (error) {
      toast.error('Error al cargar datos de lealtad')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCanjearRecompensa = async (idRecompensa) => {
    try {
      const idCliente = user.profile.id_cliente
      await lealtadService.canjearRecompensa(idCliente, idRecompensa)
      toast.success('Recompensa canjeada correctamente')
      cargarDatosCliente()
    } catch (error) {
      toast.error(error.message || 'Error al canjear recompensa')
    }
  }

  const getNivelColor = (puntos) => {
    if (puntos >= 1000) return 'bg-purple-100 text-purple-800'
    if (puntos >= 500) return 'bg-blue-100 text-blue-800'
    if (puntos >= 100) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getNivelNombre = (puntos) => {
    if (puntos >= 1000) return 'Oro'
    if (puntos >= 500) return 'Plata'
    if (puntos >= 100) return 'Bronce'
    return 'Nuevo'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!infoLealtad) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Programa de Lealtad no disponible</h3>
          <p className="text-gray-600">El programa de lealtad no está activo actualmente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Programa de Lealtad</h1>
        <p className="text-gray-600 mt-1">Acumula puntos y canjea recompensas exclusivas</p>
      </div>

      {/* Resumen de puntos */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Star className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm opacity-90">Puntos Acumulados</p>
            <p className="text-3xl font-bold">{infoLealtad.puntos_acumulados.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm opacity-90">Nivel Actual</p>
            <div className="inline-flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
                {getNivelNombre(infoLealtad.puntos_acumulados)}
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <Gift className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm opacity-90">Recompensas Disponibles</p>
            <p className="text-3xl font-bold">{recompensasDisponibles.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['resumen', 'recompensas', 'historial'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'resumen' && 'Resumen'}
              {tab === 'recompensas' && 'Recompensas'}
              {tab === 'historial' && 'Historial'}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Progreso al siguiente nivel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Progreso al Siguiente Nivel</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Nivel Actual: {getNivelNombre(infoLealtad.puntos_acumulados)}</span>
                  <span className="text-gray-900 font-medium">{infoLealtad.puntos_acumulados} puntos</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (infoLealtad.puntos_acumulados % 100) / 100 * 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  {100 - (infoLealtad.puntos_acumulados % 100)} puntos para el siguiente nivel
                </p>
              </div>
              
              {infoLealtad.nivel && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Beneficios de tu nivel</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>×{infoLealtad.nivel.multiplicador_puntos} multiplicador de puntos</li>
                    {infoLealtad.nivel.descuento_especial > 0 && (
                      <li>{infoLealtad.nivel.descuento_especial}% de descuento especial</li>
                    )}
                    {infoLealtad.nivel.beneficios && (
                      <li>{infoLealtad.nivel.beneficios}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>
            
            <div className="space-y-3">
              {historialPuntos.slice(0, 5).map((punto) => (
                <div key={punto.id_puntos} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      punto.puntos_ganados > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {punto.puntos_ganados > 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <Gift className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{punto.concepto}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(punto.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      punto.puntos_ganados > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {punto.puntos_ganados > 0 ? '+' : '-'}{punto.puntos_ganados || punto.puntos_usados}
                    </p>
                    <p className="text-xs text-gray-500">
                      Saldo: {punto.saldo_actual}
                    </p>
                  </div>
                </div>
              ))}
              
              {historialPuntos.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recompensas' && (
        <div className="space-y-6">
          {/* Recompensas disponibles */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recompensas Disponibles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recompensasDisponibles.map((recompensa) => (
                <div key={recompensa.id_recompensa} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">{recompensa.nombre}</h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{recompensa.descripcion}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Puntos requeridos:</span>
                      <span className="font-medium text-gray-900">{recompensa.puntos_requeridos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium text-gray-900">{recompensa.tipo}</span>
                    </div>
                    {recompensa.valor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium text-gray-900">${recompensa.valor}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleCanjearRecompensa(recompensa.id_recompensa)}
                    className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Canjear Ahora
                  </button>
                </div>
              ))}
            </div>
            
            {recompensasDisponibles.length === 0 && (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recompensas disponibles</h3>
                <p className="text-gray-600">Acumula más puntos para desbloquear recompensas</p>
              </div>
            )}
          </div>

          {/* Todas las recompensas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Todas las Recompensas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recompensas.map((recompensa) => (
                <div key={recompensa.id_recompensa} className={`bg-white rounded-lg shadow-sm border p-4 ${
                  infoLealtad.puntos_acumulados >= recompensa.puntos_requeridos 
                    ? 'border-gray-200' 
                    : 'border-gray-200 opacity-75'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className={`w-5 h-5 ${
                      infoLealtad.puntos_acumulados >= recompensa.puntos_requeridos 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }`} />
                    <h4 className="font-medium text-gray-900">{recompensa.nombre}</h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{recompensa.descripcion}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Puntos requeridos:</span>
                      <span className={`font-medium ${
                        infoLealtad.puntos_acumulados >= recompensa.puntos_requeridos 
                          ? 'text-gray-900' 
                          : 'text-red-600'
                      }`}>
                        {recompensa.puntos_requeridos}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium text-gray-900">{recompensa.tipo}</span>
                    </div>
                    {recompensa.valor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium text-gray-900">${recompensa.valor}</span>
                      </div>
                    )}
                  </div>
                  
                  {infoLealtad.puntos_acumulados >= recompensa.puntos_requeridos ? (
                    <button
                      onClick={() => handleCanjearRecompensa(recompensa.id_recompensa)}
                      className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Canjear Ahora
                    </button>
                  ) : (
                    <div className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center">
                      Necesitas {recompensa.puntos_requeridos - infoLealtad.puntos_acumulados} puntos más
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-6">
          {/* Historial de puntos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Puntos</h3>
            
            <div className="space-y-3">
              {historialPuntos.map((punto) => (
                <div key={punto.id_puntos} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      punto.puntos_ganados > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {punto.puntos_ganados > 0 ? (
                        <ShoppingBag className="w-5 h-5 text-green-600" />
                      ) : (
                        <Gift className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{punto.concepto}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(punto.fecha).toLocaleDateString()} a las {new Date(punto.fecha).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-lg ${
                      punto.puntos_ganados > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {punto.puntos_ganados > 0 ? '+' : '-'}{punto.puntos_ganados || punto.puntos_usados}
                    </p>
                    <p className="text-xs text-gray-500">
                      Saldo: {punto.saldo_actual}
                    </p>
                  </div>
                </div>
              ))}
              
              {historialPuntos.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay historial de puntos</p>
                </div>
              )}
            </div>
          </div>

          {/* Historial de canjes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Canjes</h3>
            
            <div className="space-y-3">
              {historialCanjes.map((canje) => (
                <div key={canje.id_canje} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{canje.recompensa.nombre}</p>
                      <p className="text-xs text-gray-500">
                        Canjeado el {new Date(canje.fecha_canje).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-purple-600">-{canje.puntos_utilizados} pts</p>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      canje.estado === 'activo' 
                        ? 'bg-green-100 text-green-800' 
                        : canje.estado === 'usado'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {canje.estado === 'activo' && 'Activo'}
                      {canje.estado === 'usado' && 'Usado'}
                      {canje.estado === 'expirado' && 'Expirado'}
                    </span>
                  </div>
                </div>
              ))}
              
              {historialCanjes.length === 0 && (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No has canjeado recompensas aún</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
