import { useEffect, useState } from 'react'
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function AsistenciaTab({ profile }) {
  const [asistencias, setAsistencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasEntradaHoy, setHasEntradaHoy] = useState(false)
  const [horaEntrada, setHoraEntrada] = useState(null)
  const [horaSalida, setHoraSalida] = useState(null)
  const [dateRange, setDateRange] = useState({
    inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    fin: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    loadAsistencias()
  }, [profile?.id_empleado, dateRange])

  const loadAsistencias = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('asistencia')
        .select('*')
        .eq('id_empleado', profile.id_empleado)
        .gte('fecha', dateRange.inicio)
        .lte('fecha', dateRange.fin)
        .order('fecha', { ascending: false })

      if (error) throw error

      setAsistencias(data || [])

      // Verificar si ya marcó entrada hoy
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const asistenciaHoy = data?.find(a => a.fecha === hoy)

      if (asistenciaHoy) {
        setHasEntradaHoy(true)
        setHoraEntrada(asistenciaHoy.hora_entrada)
        setHoraSalida(asistenciaHoy.hora_salida)
      } else {
        setHasEntradaHoy(false)
        setHoraEntrada(null)
        setHoraSalida(null)
      }
    } catch (error) {
      console.error('Error loading asistencias:', error)
      toast.error('Error al cargar asistencias')
    } finally {
      setLoading(false)
    }
  }

  const handleEntrada = async () => {
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const ahora = new Date().toISOString()

      const { error } = await supabase.from('asistencia').insert([
        {
          id_empleado: profile.id_empleado,
          fecha: hoy,
          hora_entrada: ahora,
        },
      ])

      if (error) throw error

      setHasEntradaHoy(true)
      setHoraEntrada(ahora)
      toast.success('Entrada registrada')
      loadAsistencias()
    } catch (error) {
      console.error('Error marking entrada:', error)
      toast.error('Error al registrar entrada')
    }
  }

  const handleSalida = async () => {
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const ahora = new Date().toISOString()

      const { error } = await supabase
        .from('asistencia')
        .update({ hora_salida: ahora })
        .eq('id_empleado', profile.id_empleado)
        .eq('fecha', hoy)

      if (error) throw error

      setHoraSalida(ahora)
      toast.success('Salida registrada')
      loadAsistencias()
    } catch (error) {
      console.error('Error marking salida:', error)
      toast.error('Error al registrar salida')
    }
  }

  const calcularHorasTrabajadas = (entrada, salida) => {
    if (!entrada || !salida) return '-'

    const start = new Date(entrada)
    const end = new Date(salida)
    const diff = end - start
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${horas}h ${minutos}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Control de Asistencia Hoy */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-primary-200 dark:border-primary-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Asistencia de Hoy
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Hora de Entrada */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Hora de Entrada
            </p>
            {horaEntrada ? (
              <p className="text-2xl font-bold text-green-600">
                {format(new Date(horaEntrada), 'HH:mm:ss')}
              </p>
            ) : (
              <p className="text-2xl font-bold text-gray-400">--:--:--</p>
            )}
          </div>

          {/* Hora de Salida */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Hora de Salida
            </p>
            {horaSalida ? (
              <p className="text-2xl font-bold text-red-600">
                {format(new Date(horaSalida), 'HH:mm:ss')}
              </p>
            ) : (
              <p className="text-2xl font-bold text-gray-400">--:--:--</p>
            )}
          </div>
        </div>

        {/* Botones de Control */}
        <div className="flex gap-3">
          {!hasEntradaHoy ? (
            <button
              onClick={handleEntrada}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Marcar Entrada
            </button>
          ) : horaSalida ? (
            <button
              disabled
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
            >
              Jornada Completada
            </button>
          ) : (
            <button
              onClick={handleSalida}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Marcar Salida
            </button>
          )}
        </div>
      </div>

      {/* Historial de Asistencias */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Historial del Mes
        </h3>

        {asistencias.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No hay registros de asistencia
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Entrada
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Salida
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Horas Trabajadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map(asistencia => (
                  <tr
                    key={asistencia.id_asistencia}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {format(new Date(asistencia.fecha), 'dd/MM/yyyy', {
                        locale: es,
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {asistencia.hora_entrada
                        ? format(new Date(asistencia.hora_entrada), 'HH:mm:ss')
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {asistencia.hora_salida
                        ? format(new Date(asistencia.hora_salida), 'HH:mm:ss')
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                      {calcularHorasTrabajadas(
                        asistencia.hora_entrada,
                        asistencia.hora_salida
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
