import { useEffect, useState } from 'react'
import { Clock, Calendar, LogIn, LogOut, MapPin } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function EmpleadoAsistencia() {
  const { profile } = useAuthStore()
  const [asistenciaHoy, setAsistenciaHoy] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [registrando, setRegistrando] = useState(false)

  useEffect(() => {
    loadAsistencia()
  }, [])

  const loadAsistencia = async () => {
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      
      // Cargar asistencia de hoy
      const { data: hoyData } = await supabase
        .from('asistencia')
        .select('*')
        .eq('id_empleado', profile.id_empleado)
        .eq('fecha', hoy)
        .maybeSingle()

      setAsistenciaHoy(hoyData)

      // Cargar historial del mes actual
      const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const finMes = format(endOfMonth(new Date()), 'yyyy-MM-dd')

      const { data: historialData, error } = await supabase
        .from('asistencia')
        .select('*')
        .eq('id_empleado', profile.id_empleado)
        .gte('fecha', inicioMes)
        .lte('fecha', finMes)
        .order('fecha', { ascending: false })

      if (error) throw error
      setHistorial(historialData || [])
    } catch (error) {
      console.error('Error loading asistencia:', error)
      toast.error('Error al cargar asistencia')
    } finally {
      setLoading(false)
    }
  }

  const marcarEntrada = async () => {
    try {
      setRegistrando(true)
      const hoy = format(new Date(), 'yyyy-MM-dd')
      
      // Intentar obtener ubicación
      let latitud = null
      let longitud = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          latitud = position.coords.latitude
          longitud = position.coords.longitude
        } catch (error) {
          console.log('No se pudo obtener ubicación:', error)
        }
      }

      const { error } = await supabase
        .from('asistencia')
        .insert([
          {
            id_empleado: profile.id_empleado,
            fecha: hoy,
            hora_entrada: new Date().toISOString()
          }
        ])

      if (error) throw error

      toast.success('Entrada registrada exitosamente')
      loadAsistencia()
    } catch (error) {
      console.error('Error marking entrada:', error)
      toast.error('Error al registrar entrada')
    } finally {
      setRegistrando(false)
    }
  }

  const marcarSalida = async () => {
    try {
      setRegistrando(true)
      
      // Intentar obtener ubicación
      let latitud = null
      let longitud = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          latitud = position.coords.latitude
          longitud = position.coords.longitude
        } catch (error) {
          console.log('No se pudo obtener ubicación:', error)
        }
      }

      const { error } = await supabase
        .from('asistencia')
        .update({
          hora_salida: new Date().toISOString()
        })
        .eq('id_asistencia', asistenciaHoy.id_asistencia)

      if (error) throw error

      toast.success('Salida registrada exitosamente')
      loadAsistencia()
    } catch (error) {
      console.error('Error marking salida:', error)
      toast.error('Error al registrar salida')
    } finally {
      setRegistrando(false)
    }
  }

  const calcularHorasTrabajadas = (entrada, salida) => {
    if (!entrada || !salida) return null
    
    const diff = new Date(salida) - new Date(entrada)
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${horas}h ${minutos}m`
  }

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Control de Asistencia
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        {/* Registro de hoy */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Registro de Hoy
          </h2>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : asistenciaHoy ? (
            <div className="space-y-4">
              {/* Entrada */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full mr-4">
                    <LogIn className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Entrada Registrada
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(asistenciaHoy.hora_entrada), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
                {asistenciaHoy.latitud_entrada && (
                  <MapPin className="w-5 h-5 text-green-600" />
                )}
              </div>

              {/* Salida */}
              {asistenciaHoy.hora_salida ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full mr-4">
                      <LogOut className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Salida Registrada
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(asistenciaHoy.hora_salida), 'HH:mm:ss')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Horas trabajadas: {calcularHorasTrabajadas(asistenciaHoy.hora_entrada, asistenciaHoy.hora_salida)}
                      </p>
                    </div>
                  </div>
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
              ) : (
                <button
                  onClick={marcarSalida}
                  disabled={registrando}
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  {registrando ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 mr-2" />
                      Marcar Salida
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No has registrado tu entrada hoy
              </p>
              <button
                onClick={marcarEntrada}
                disabled={registrando}
                className="btn btn-primary inline-flex items-center"
              >
                {registrando ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Marcar Entrada
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Historial del mes */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2" />
            Historial del Mes
          </h2>

          {historial.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No hay registros este mes
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Fecha
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Entrada
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Salida
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Horas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((registro) => (
                    <tr 
                      key={registro.id_asistencia}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {format(new Date(registro.fecha), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {registro.hora_entrada ? 
                          format(new Date(registro.hora_entrada), 'HH:mm') : 
                          '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {registro.hora_salida ? 
                          format(new Date(registro.hora_salida), 'HH:mm') : 
                          '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {calcularHorasTrabajadas(registro.hora_entrada, registro.hora_salida) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
