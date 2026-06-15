import { supabase } from './supabase'

class DevolucionesService {
  // Obtener políticas de devolución
  async obtenerPoliticasDevolucion() {
    const { data, error } = await supabase
      .from('politica_devolucion')
      .select('*')
      .eq('activa', true)
      .order('dias_maximos', { ascending: true })

    if (error) throw error
    return data
  }

  // Crear nueva política de devolución
  async crearPoliticaDevolucion(politica) {
    const { data, error } = await supabase
      .from('politica_devolucion')
      .insert([politica])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener ventas elegibles para devolución de un cliente
  async obtenerVentasElegiblesDevolucion(idCliente) {
    const politicas = await this.obtenerPoliticasDevolucion()
    const diasMaximos = Math.max(...politicas.map(p => p.dias_maximos))
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasMaximos)

    const { data, error } = await supabase
      .from('venta')
      .select(`
        id_venta,
        fecha,
        total,
        estado,
        detalle_venta (
          id_detalle_venta,
          cantidad,
          precio_unitario,
          producto:producto(id_producto, nombre, imagen_url, categoria),
          devoluciones:devolucion_detalle (
            id_devolucion_detalle,
            cantidad_devuelta,
            estado
          )
        )
      `)
      .eq('id_cliente', idCliente)
      .gte('fecha', fechaLimite.toISOString())
      .eq('estado', 'completada')
      .order('fecha', { ascending: false })

    if (error) throw error

    // Filtrar productos que aún pueden ser devueltos
    return data.map(venta => ({
      ...venta,
      detalle_venta: venta.detalle_venta.map(detalle => {
        const cantidadDevuelta = detalle.devoluciones?.reduce((sum, d) => 
          d.estado === 'procesada' ? sum + d.cantidad_devuelta : sum, 0) || 0
        const cantidadDisponible = detalle.cantidad - cantidadDevuelta
        
        return {
          ...detalle,
          cantidad_devuelta,
          cantidad_disponible: Math.max(0, cantidadDisponible),
          puede_devolver: cantidadDisponible > 0
        }
      }).filter(d => d.puede_devolver)
    })).filter(v => v.detalle_venta.length > 0)
  }

  // Crear solicitud de devolución
  async crearSolicitudDevolucion(solicitud) {
    const { id_detalle_venta, cantidad_devuelta, motivo, id_cliente } = solicitud

    // Verificar si la venta es elegible
    const { data: detalle, error: errorDetalle } = await supabase
      .from('detalle_venta')
      .select(`
        *,
        venta:venta(id_venta, id_cliente, fecha),
        producto:producto(nombre)
      `)
      .eq('id_detalle_venta', id_detalle_venta)
      .single()

    if (errorDetalle || !detalle) {
      throw new Error('Detalle de venta no encontrado')
    }

    if (detalle.venta.id_cliente !== id_cliente) {
      throw new Error('Esta venta no pertenece al cliente')
    }

    // Verificar política de devolución
    const politicas = await this.obtenerPoliticasDevolucion()
    const diasTranscurridos = Math.floor((new Date() - new Date(detalle.venta.fecha)) / (1000 * 60 * 60 * 24))
    
    const politicaAplicable = politicas.find(p => diasTranscurridos <= p.dias_maximos)
    if (!politicaAplicable) {
      throw new Error('El período de devolución ha expirado')
    }

    // Verificar cantidad disponible para devolver
    const { data: devolucionesExistentes } = await supabase
      .from('devolucion_detalle')
      .select('cantidad_devuelta')
      .eq('id_detalle_venta', id_detalle_venta)
      .eq('estado', 'procesada')

    const cantidadYaDevuelta = devolucionesExistentes?.reduce((sum, d) => sum + d.cantidad_devuelta, 0) || 0
    const cantidadDisponible = detalle.cantidad - cantidadYaDevuelta

    if (cantidad_devuelta > cantidadDisponible) {
      throw new Error(`Solo puede devolver ${cantidadDisponible} unidades de este producto`)
    }

    // Crear devolución principal
    const { data: devolucion, error: errorDevolucion } = await supabase
      .from('devolucion')
      .insert([{
        id_detalle_venta,
        cantidad: cantidad_devuelta,
        fecha: new Date().toISOString()
      }])
      .select()
      .single()

    if (errorDevolucion) throw errorDevolucion

    // Crear detalle de devolución
    const montoReembolso = detalle.precio_unitario * cantidad_devuelta * (politicaAplicable.porcentaje_reembolso / 100)

    const { data: devolucionDetalle, error: errorDetalleDevolucion } = await supabase
      .from('devolucion_detalle')
      .insert([{
        id_devolucion: devolucion.id_devolucion,
        id_detalle_venta,
        cantidad_devuelta,
        motivo,
        estado: 'pendiente',
        tipo_reembolso: politicaAplicable.credito_tienda ? 'credito_tienda' : 'efectivo',
        monto_reembolso
      }])
      .select(`
        *,
        devolucion:devolucion(fecha),
        detalle_venta:detalle_venta (
          cantidad,
          precio_unitario,
          producto:producto(nombre),
          venta:venta(id_venta, fecha)
        )
      `)
      .single()

    if (errorDetalleDevolucion) throw errorDetalleDevolucion

    return devolucionDetalle
  }

  // Obtener devoluciones pendientes de aprobación
  async obtenerDevolucionesPendientes() {
    const { data, error } = await supabase
      .from('devolucion_detalle')
      .select(`
        *,
        devolucion:devolucion(fecha),
        detalle_venta:detalle_venta (
          cantidad,
          precio_unitario,
          producto:producto(nombre, imagen_url),
          venta:venta (
            id_venta,
            fecha,
            cliente:cliente(nombre, telefono)
          )
        )
      `)
      .eq('estado', 'pendiente')
      .order('id_devolucion_detalle', { ascending: false })

    if (error) throw error
    return data
  }

  // Aprobar devolución
  async aprobarDevolucion(idDevolucionDetalle, idEmpleadoAutoriza, notas = '') {
    const devolucion = await this.obtenerDetalleDevolucion(idDevolucionDetalle)

    if (devolucion.estado !== 'pendiente') {
      throw new Error('Esta devolución ya ha sido procesada')
    }

    // Actualizar stock del producto
    await supabase
      .from('producto')
      .update({ stock: supabase.raw('stock + ' + devolucion.cantidad_devuelta) })
      .eq('id_producto', devolucion.detalle_venta.producto.id_producto)

    // Registrar en inventario (entrada por devolución)
    await supabase
      .from('inventario')
      .insert([{
        id_producto: devolucion.detalle_venta.producto.id_producto,
        cantidad: devolucion.cantidad_devuelta,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'devolucion',
        referencia: `Devolución #${idDevolucionDetalle}`
      }])

    // Si es crédito a tienda, actualizar crédito del cliente
    if (devolucion.tipo_reembolso === 'credito_tienda') {
      await supabase
        .from('cliente')
        .update({ 
          credito: supabase.raw('credito + ' + devolucion.monto_reembolso)
        })
        .eq('id_cliente', devolucion.detalle_venta.venta.cliente.id_cliente)
    }

    // Actualizar estado de la devolución
    const { data, error } = await supabase
      .from('devolucion_detalle')
      .update({
        estado: 'aprobada',
        id_empleado_autoriza: idEmpleadoAutoriza,
        fecha_autorizacion: new Date().toISOString(),
        notas
      })
      .eq('id_devolucion_detalle', idDevolucionDetalle)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Rechazar devolución
  async rechazarDevolucion(idDevolucionDetalle, idEmpleadoAutoriza, motivoRechazo) {
    const { data, error } = await supabase
      .from('devolucion_detalle')
      .update({
        estado: 'rechazada',
        id_empleado_autoriza: idEmpleadoAutoriza,
        fecha_autorizacion: new Date().toISOString(),
        motivo: motivoRechazo
      })
      .eq('id_devolucion_detalle', idDevolucionDetalle)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener detalle de una devolución
  async obtenerDetalleDevolucion(idDevolucionDetalle) {
    const { data, error } = await supabase
      .from('devolucion_detalle')
      .select(`
        *,
        devolucion:devolucion(fecha),
        detalle_venta:detalle_venta (
          cantidad,
          precio_unitario,
          producto:producto(id_producto, nombre, imagen_url),
          venta:venta (
            id_venta,
            fecha,
            cliente:cliente(id_cliente, nombre, telefono, credito)
          )
        ),
        empleado_autoriza:empleado(nombre)
      `)
      .eq('id_devolucion_detalle', idDevolucionDetalle)
      .single()

    if (error) throw error
    return data
  }

  // Obtener historial de devoluciones de un cliente
  async obtenerHistorialDevolucionesCliente(idCliente, limit = 20) {
    const { data, error } = await supabase
      .from('devolucion_detalle')
      .select(`
        *,
        devolucion:devolucion(fecha),
        detalle_venta:detalle_venta!inner (
          cantidad,
          precio_unitario,
          producto:producto(nombre, imagen_url),
          venta:venta!inner (
            id_venta,
            fecha,
            id_cliente
          )
        )
      `)
      .eq('detalle_venta.venta.id_cliente', idCliente)
      .order('id_devolucion_detalle', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // Obtener estadísticas de devoluciones
  async obtenerEstadisticasDevoluciones(fechaInicio, fechaFin) {
    const { data: devoluciones, error } = await supabase
      .from('devolucion_detalle')
      .select(`
        estado,
        cantidad_devuelta,
        monto_reembolso,
        devolucion:devolucion!inner(fecha),
        detalle_venta:detalle_venta (
          producto:producto(categoria),
          venta:venta(fecha)
        )
      `)
      .gte('devolucion.fecha', fechaInicio)
      .lte('devolucion.fecha', fechaFin)

    if (error) throw error

    const estadisticas = {
      total_devoluciones: devoluciones.length,
      devoluciones_aprobadas: devoluciones.filter(d => d.estado === 'aprobada').length,
      devoluciones_rechazadas: devoluciones.filter(d => d.estado === 'rechazada').length,
      devoluciones_pendientes: devoluciones.filter(d => d.estado === 'pendiente').length,
      total_unidades_devueltas: devoluciones.reduce((sum, d) => sum + d.cantidad_devuelta, 0),
      total_monto_reembolsado: devoluciones
        .filter(d => d.estado === 'aprobada')
        .reduce((sum, d) => sum + (d.monto_reembolso || 0), 0),
      por_categoria: devoluciones.reduce((acc, d) => {
        const categoria = d.detalle_venta.producto?.categoria || 'Sin categoría'
        acc[categoria] = (acc[categoria] || 0) + 1
        return acc
      }, {})
    }

    return estadisticas
  }

  // Marcar devolución como procesada (cuando se entrega el reembolso)
  async marcarDevolucionProcesada(idDevolucionDetalle) {
    const { data, error } = await supabase
      .from('devolucion_detalle')
      .update({ estado: 'procesada' })
      .eq('id_devolucion_detalle', idDevolucionDetalle)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener devoluciones por período
  async obtenerDevolucionesPorPeriodo(fechaInicio, fechaFin, estado = null) {
    let query = supabase
      .from('devolucion_detalle')
      .select(`
        *,
        devolucion:devolucion!inner(fecha),
        detalle_venta:detalle_venta (
          cantidad,
          precio_unitario,
          producto:producto(nombre, categoria),
          venta:venta (
            id_venta,
            fecha,
            cliente:cliente(nombre)
          )
        ),
        empleado_autoriza:empleado(nombre)
      `)
      .gte('devolucion.fecha', fechaInicio)
      .lte('devolucion.fecha', fechaFin)
      .order('id_devolucion_detalle', { ascending: false })

    if (estado) {
      query = query.eq('estado', estado)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }
}

export const devolucionesService = new DevolucionesService()
