import { useState, useEffect } from 'react'
import { FileSpreadsheet, Eye, Save, Calendar, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { reporteService } from '../../../lib/reporteService'
import { formatCurrency } from '../../../lib/currencyFormatter'
import toast from 'react-hot-toast'

export default function ReportesTab({ profile }) {
  const [activeReportType, setActiveReportType] = useState('ventas_repartos')
  const [reportData, setReportData] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedHistorialReport, setSelectedHistorialReport] = useState(null)

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async () => {
    const { data, error } = await reporteService.obtenerHistorialReportes()
    if (!error) {
      setHistorial(data)
    }
  }

  const generarReporteAlInstante = async (type = activeReportType) => {
    setLoading(true)
    setSelectedHistorialReport(null)
    
    let res
    if (type === 'ventas_repartos') {
      res = await reporteService.obtenerDatosVentasYRepartos()
    } else {
      res = await reporteService.obtenerDatosProductos()
    }

    if (res.error) {
      toast.error('Error al generar el reporte: ' + res.error)
    } else {
      setReportData(res.data)
      toast.success('Reporte generado temporalmente con éxito. Puedes revisarlo en la tabla.')
    }
    setLoading(false)
  }

  const guardarReporteEnBD = async () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No hay datos generados para guardar.')
      return
    }

    setSaving(true)
    const { data, error } = await reporteService.guardarReporte(activeReportType, reportData)
    if (error) {
      toast.error('Error al guardar reporte en base de datos: ' + error)
    } else {
      toast.success('Reporte guardado exitosamente en la base de datos.')
      setReportData([])
      cargarHistorial()
    }
    setSaving(false)
  }

  const verReporteHistorial = (reporte) => {
    setSelectedHistorialReport(reporte)
    setReportData(reporte.datos)
    setActiveReportType(reporte.tipo_reporte)
    toast.success(`Cargada versión guardada del ${new Date(reporte.fecha_creacion).toLocaleDateString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Botones de Selección de Reporte */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveReportType('ventas_repartos')
              setReportData([])
              setSelectedHistorialReport(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeReportType === 'ventas_repartos'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
            }`}
          >
            Reporte Ventas y Repartos
          </button>
          <button
            onClick={() => {
              setActiveReportType('productos')
              setReportData([])
              setSelectedHistorialReport(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeReportType === 'productos'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
            }`}
          >
            Reporte de Productos
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => generarReporteAlInstante(activeReportType)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow disabled:opacity-50 transition-all duration-200"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Generar Reporte del Día
          </button>

          {reportData.length > 0 && !selectedHistorialReport && (
            <button
              onClick={guardarReporteEnBD}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg shadow disabled:opacity-50 transition-all duration-200"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar en BD
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Reporte Histórico */}
      {selectedHistorialReport && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Modo Histórico: </span>
            Estás visualizando un reporte guardado en la base de datos con fecha: {' '}
            <span className="font-semibold">{new Date(selectedHistorialReport.fecha_creacion).toLocaleString()}</span>. No se puede volver a guardar.
          </div>
        </div>
      )}

      {/* Tabla con los datos del reporte */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary-500" />
            Planilla: {activeReportType === 'ventas_repartos' ? 'Ventas y Repartos del Día' : 'Inventario y Vencimiento de Productos'}
          </h3>
          <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold px-2.5 py-1 rounded-full">
            {reportData.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportData.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se han cargado datos aún</p>
              <p className="text-xs mt-1">Haz clic en "Generar Reporte del Día" o selecciona un registro del historial abajo.</p>
            </div>
          ) : activeReportType === 'ventas_repartos' ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                  <th className="p-4">ID Venta</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Hora</th>
                  <th className="p-4">Tipo Venta</th>
                  <th className="p-4">Método Pago</th>
                  <th className="p-4">Despacho</th>
                  <th className="p-4">Repartidor</th>
                  <th className="p-4">Dirección Envió</th>
                  <th className="p-4">Detalle Productos</th>
                  <th className="p-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="p-4 font-mono font-semibold text-primary-600 dark:text-primary-400">#{row.id_venta}</td>
                    <td className="p-4 font-medium">{row.cliente_nombre || 'Sin cliente'}</td>
                    <td className="p-4">{row.fecha ? new Date(row.fecha).toLocaleTimeString() : 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        row.tipo_venta === 'Venta Online' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {row.tipo_venta}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-xs text-gray-600 dark:text-gray-400">{row.metodo_pago}</td>
                    <td className="p-4">{row.tipo_entrega}</td>
                    <td className="p-4 font-medium">{row.repartidor}</td>
                    <td className="p-4 max-w-[200px] truncate" title={row.direccion}>{row.direccion}</td>
                    <td className="p-4 max-w-[250px] truncate" title={row.productos}>{row.productos}</td>
                    <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                  <th className="p-4">ID Producto</th>
                  <th className="p-4">Código</th>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Fecha Vencimiento</th>
                  <th className="p-4">¿Venció?</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="p-4 font-mono">#{row.id_producto}</td>
                    <td className="p-4 font-mono text-xs">{row.codigo}</td>
                    <td className="p-4 font-medium">{row.nombre}</td>
                    <td className="p-4">{row.fecha_vencimiento}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        row.vencido === 'Sí (Vencido)' 
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {row.vencido}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold">{formatCurrency(row.precio)}</td>
                    <td className="p-4 text-right font-bold">{row.stock} uds.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Historial de Reportes Guardados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Historial de Reportes Guardados en la Base de Datos
          </h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {historial.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay reportes registrados históricamente en la base de datos.
            </div>
          ) : (
            historial.map((rep) => (
              <div key={rep.id_reporte} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <span className="font-mono text-sm font-bold text-gray-600 dark:text-gray-400">
                    Reporte #{rep.id_reporte}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    rep.tipo_reporte === 'ventas_repartos'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  }`}>
                    {rep.tipo_reporte === 'ventas_repartos' ? 'Ventas y Repartos' : 'Productos e Inventario'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Generado el: {new Date(rep.fecha_creacion).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => verReporteHistorial(rep)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-all duration-200"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Histórico
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
