import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'
import * as dataService from '../lib/dataService'

/**
 * Componente de diagnóstico para verificar que todos los datos se cargan correctamente
 * Útil para debugging y verificación de la conexión a la base de datos
 */
export default function DataDiagnostics() {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    const diagnosticResults = {}

    const tests = [
      { name: 'Productos', fn: () => dataService.loadProductos() },
      { name: 'Promociones', fn: () => dataService.loadPromociones() },
      { name: 'Ventas', fn: () => dataService.loadVentas() },
      { name: 'Repartos', fn: () => dataService.loadRepartos() },
      { name: 'Empleados', fn: () => dataService.loadEmpleados() },
      { name: 'Clientes', fn: () => dataService.loadClientes() },
      { name: 'Asistencias', fn: () => dataService.loadAsistencias() },
      { name: 'Inventario', fn: () => dataService.loadInventario() },
      { name: 'Órdenes de Compra', fn: () => dataService.loadOrdenesCompra() },
      { name: 'Proveedores', fn: () => dataService.loadProveedores() },
      { name: 'Notificaciones', fn: () => dataService.loadNotificaciones() },
      { name: 'Devoluciones', fn: () => dataService.loadDevoluciones() },
      { name: 'Horarios', fn: () => dataService.loadHorarios() },
      { name: 'Usuarios', fn: () => dataService.loadUsuarios() },
      { name: 'Estadísticas', fn: () => dataService.loadEstadisticas() },
    ]

    for (const test of tests) {
      try {
        const startTime = performance.now()
        const result = await test.fn()
        const endTime = performance.now()

        diagnosticResults[test.name] = {
          success: !result.error,
          error: result.error,
          dataCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
          time: (endTime - startTime).toFixed(2),
        }
      } catch (error) {
        diagnosticResults[test.name] = {
          success: false,
          error: error.message,
          dataCount: 0,
          time: 0,
        }
      }
    }

    setResults(diagnosticResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-blue-700 dark:text-blue-300">Ejecutando diagnóstico de datos...</p>
        </div>
      </div>
    )
  }

  const successCount = Object.values(results).filter(r => r.success).length
  const totalCount = Object.keys(results).length

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Diagnóstico de Carga de Datos
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Estado General</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {successCount}/{totalCount}
            </p>
          </div>
          {successCount === totalCount ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-6 h-6" />
              <span>Todos los datos se cargan correctamente</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
              <span>{totalCount - successCount} error(es) detectado(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                Tabla
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                Estado
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                Registros
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                Tiempo (ms)
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                Detalles
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(results).map(([name, result]) => (
              <tr
                key={name}
                className={`${
                  result.success
                    ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {name}
                </td>
                <td className="px-4 py-3">
                  {result.success ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">Éxito</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400">Error</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {result.dataCount}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {result.time}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {result.error ? (
                    <span className="text-red-600 dark:text-red-400 text-xs">
                      {result.error}
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 text-xs">
                      Cargado correctamente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón para re-ejecutar */}
      <button
        onClick={runDiagnostics}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
      >
        Re-ejecutar Diagnóstico
      </button>

      {/* Información adicional */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Información
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Este diagnóstico verifica que todos los datos se cargan correctamente</li>
          <li>• Los tiempos de carga incluyen la latencia de la red</li>
          <li>• Si hay errores, verifica la conexión a Supabase y los permisos</li>
          <li>• Este componente es útil para debugging durante el desarrollo</li>
        </ul>
      </div>
    </div>
  )
}
