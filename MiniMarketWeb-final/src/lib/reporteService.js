import { supabase } from './supabase'

/**
 * Servicio para recopilar datos de reportes y guardarlos/cargarlos de la Base de Datos
 */
export const reporteService = {
  /**
   * Genera la planilla de datos para el Reporte de Ventas y Repartos del día actual.
   * Filtra las ventas cuya fecha sea del día de hoy.
   */
  async obtenerDatosVentasYRepartos() {
    try {
      // 1. Obtener todas las ventas con detalles, cliente y empleado (cajero/vendedor)
      const { data: ventas, error: ventasError } = await supabase
        .from('venta')
        .select(`
          *,
          cliente:id_cliente(id_cliente, nombre, telefono, direccion),
          empleado:id_empleado(id_empleado, nombre)
        `)
      
      if (ventasError) throw ventasError

      // Obtener el rango de fechas para los últimos 3 días (local)
      const hoy = new Date()
      const hace3Dias = new Date()
      hace3Dias.setDate(hoy.getDate() - 3)
      hace3Dias.setHours(0, 0, 0, 0)

      const ventasHoy = (ventas || []).filter(v => {
        if (!v.fecha) return false
        const vFecha = new Date(v.fecha)
        return vFecha >= hace3Dias
      })

      // 2. Para cada venta, obtener sus detalles de productos
      const { data: detalles, error: detallesError } = await supabase
        .from('detalle_venta')
        .select(`
          *,
          producto:id_producto(id_producto, nombre, codigo)
        `)

      if (detallesError) throw detallesError

      // 3. Obtener los repartos para vincular el repartidor si aplica
      const { data: repartos, error: repartosError } = await supabase
        .from('reparto')
        .select(`
          *,
          empleado:id_empleado(id_empleado, nombre)
        `)

      if (repartosError) throw repartosError

      // 4. Mapear cada venta a la estructura final de planilla requerida
      const planilla = ventasHoy.map(venta => {
        // Filtrar detalles de esta venta
        const detallesDeVenta = (detalles || []).filter(d => d.id_venta === venta.id_venta)
        const productosStr = detallesDeVenta
          .map(d => `${d.producto?.nombre || 'Producto'} (x${d.cantidad})`)
          .join(', ')

        // Buscar reparto vinculado a la venta
        const repartoVenta = (repartos || []).find(r => r.id_venta === venta.id_venta)

        // Determinar tipo de venta y datos de despacho
        // Si la venta tiene id_empleado vinculado a un cajero/vendedor o no es online por el cliente, es venta en caja.
        const esOnline = venta.tipo_entrega === 'domicilio' || (venta.tipo_entrega === 'tienda' && !venta.empleado)
        const tipoVenta = esOnline ? 'Venta Online' : 'Venta en Caja'

        let infoDespacho = 'Recogido en Local'
        let repartidorNombre = 'N/A'
        let direccionEnvio = 'N/A'

        if (venta.tipo_entrega === 'domicilio') {
          infoDespacho = 'A Domicilio'
          direccionEnvio = venta.direccion_envio || venta.cliente?.direccion || 'Sin dirección'
          repartidorNombre = repartoVenta?.empleado?.nombre || 'Sin repartidor asignado'
        } else if (!esOnline) {
          infoDespacho = 'Entregado en Caja'
        }

        return {
          id_venta: venta.id_venta,
          fecha: venta.fecha,
          cliente_nombre: venta.cliente?.nombre || 'Sin cliente (Caja)',
          tipo_venta: tipoVenta,
          metodo_pago: (venta.metodo_pago || 'efectivo').replace('_', ' ').toUpperCase(),
          tipo_entrega: infoDespacho,
          repartidor: repartidorNombre,
          direccion: direccionEnvio,
          productos: productosStr,
          total: venta.total || 0
        }
      })

      return { data: planilla, error: null }
    } catch (error) {
      console.error('Error al generar reporte de ventas y repartos:', error)
      return { data: [], error: error.message }
    }
  },

  /**
   * Genera el Reporte de Productos e Inventario, evaluando fecha de vencimiento.
   */
  async obtenerDatosProductos() {
    try {
      const { data: productos, error } = await supabase
        .from('producto')
        .select('*')
        .order('id_producto')

      if (error) throw error

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const planilla = (productos || []).map(p => {
        let yaVencio = false
        if (p.fecha_vencimiento) {
          const fechaVenc = new Date(p.fecha_vencimiento)
          fechaVenc.setHours(0, 0, 0, 0)
          yaVencio = fechaVenc < hoy
        }

        return {
          id_producto: p.id_producto,
          codigo: p.codigo,
          nombre: p.nombre,
          fecha_vencimiento: p.fecha_vencimiento || 'Sin fecha',
          vencido: yaVencio ? 'Sí (Vencido)' : 'No',
          precio: p.precio,
          stock: p.stock ?? 0
        }
      })

      return { data: planilla, error: null }
    } catch (error) {
      console.error('Error al generar reporte de productos:', error)
      return { data: [], error: error.message }
    }
  },

  /**
   * Guarda un reporte en la base de datos (Supabase).
   * @param {string} tipoReporte - 'ventas_repartos' o 'productos'
   * @param {Array} datos - Datos del reporte en formato Array/JSON
   */
  async guardarReporte(tipoReporte, datos) {
    try {
      const { data, error } = await supabase
        .from('reporte')
        .insert({
          tipo_reporte: tipoReporte,
          fecha_creacion: new Date().toISOString(),
          datos: datos
        })
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error al guardar reporte en base de datos:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Carga el historial de reportes generados desde la base de datos.
   */
  async obtenerHistorialReportes() {
    try {
      const { data, error } = await supabase
        .from('reporte')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error al cargar historial de reportes:', error)
      return { data: [], error: error.message }
    }
  }
}
