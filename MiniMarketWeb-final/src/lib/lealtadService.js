import { supabase } from './supabase'

class LealtadService {
  // Calcular puntos de lealtad basados en el total de compra
  calcularPuntosCompra(totalCompra) {
    // Los puntos son la mitad del total, redondeados a número entero
    return Math.round(totalCompra / 2)
  }

  // Registrar puntos de lealtad por una compra
  async registrarPuntosCompra(idCliente, idVenta, totalCompra) {
    try {
      const puntosGanados = this.calcularPuntosCompra(totalCompra)
      
      // Insertar puntos en la tabla puntos_cliente
      const { data, error } = await supabase
        .from('puntos_cliente')
        .insert({
          id_cliente: idCliente,
          id_venta: idVenta,
          puntos_ganados: puntosGanados,
          fecha_ganado: new Date().toISOString(),
          descripcion: `Puntos por compra #${idVenta}`,
          tipo: 'compra'
        })
        .select()
        .single()

      if (error) throw error

      // Actualizar puntos totales del cliente
      await this.actualizarPuntosTotales(idCliente)

      return data
    } catch (error) {
      console.error('Error al registrar puntos de lealtad:', error)
      throw error
    }
  }

  // Obtener configuración del programa de lealtad
  async obtenerProgramaLealtad() {
    const { data, error } = await supabase
      .from('programa_lealtad')
      .select('*')
      .eq('activo', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Obtener niveles de cliente
  async obtenerNivelesCliente() {
    const { data, error } = await supabase
      .from('nivel_cliente')
      .select('*')
      .order('puntos_minimos', { ascending: true })

    if (error) throw error
    return data
  }

  // Obtener información de lealtad de un cliente
  async obtenerInfoLealtadCliente(idCliente) {
    const { data, error } = await supabase
      .from('cliente')
      .select(`
        *,
        nivel:nivel_cliente(*)
      `)
      .eq('id_cliente', idCliente)
      .single()

    if (error) throw error
    return data
  }

  // Obtener historial de puntos de un cliente
  async obtenerHistorialPuntos(idCliente, limit = 50) {
    const { data, error } = await supabase
      .from('puntos_cliente')
      .select(`
        *,
        venta:venta(id_venta, fecha, total)
      `)
      .eq('id_cliente', idCliente)
      .order('fecha', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // Calcular y asignar puntos por compra
  async asignarPuntosCompra(idVenta, idCliente, montoCompra) {
    const programa = await this.obtenerProgramaLealtad()
    if (!programa) return null

    const cliente = await this.obtenerInfoLealtadCliente(idCliente)
    const multiplicador = cliente.nivel?.multiplicador_puntos || 1

    const puntosGanados = Math.floor(montoCompra * programa.puntos_por_dolar * multiplicador)
    const saldoActual = (cliente.puntos_acumulados || 0) + puntosGanados

    // Registrar transacción de puntos
    const { data: transaccion, error: errorTransaccion } = await supabase
      .from('puntos_cliente')
      .insert([{
        id_cliente: idCliente,
        id_venta: idVenta,
        puntos_ganados: puntosGanados,
        saldo_anterior: cliente.puntos_acumulados || 0,
        saldo_actual: saldoActual,
        concepto: `Compra #${idVenta}`
      }])
      .select()
      .single()

    if (errorTransaccion) throw errorTransaccion

    // Actualizar puntos acumulados del cliente
    await supabase
      .from('cliente')
      .update({ 
        puntos_acumulados: saldoActual,
        id_nivel_actual: await this.calcularNivelCliente(saldoActual)
      })
      .eq('id_cliente', idCliente)

    return transaccion
  }

  // Calcular nivel del cliente según puntos
  async calcularNivelCliente(puntos) {
    const niveles = await this.obtenerNivelesCliente()
    let nivelActual = null

    for (const nivel of niveles.reverse()) {
      if (puntos >= nivel.puntos_minimos) {
        nivelActual = nivel.id_nivel
        break
      }
    }

    return nivelActual
  }

  // Obtener recompensas disponibles
  async obtenerRecompensas() {
    const { data, error } = await supabase
      .from('recompensa')
      .select(`
        *,
        producto_relacionado:producto(id_producto, nombre, imagen_url)
      `)
      .eq('activa', true)
      .order('puntos_requeridos', { ascending: true })

    if (error) throw error
    return data
  }

  // Obtener recompensas que el cliente puede canjear
  async obtenerRecompensasDisponiblesCliente(idCliente) {
    const cliente = await this.obtenerInfoLealtadCliente(idCliente)
    const recompensas = await this.obtenerRecompensas()

    return recompensas.filter(recompensa => 
      cliente.puntos_acumulados >= recompensa.puntos_requeridos &&
      (recompensa.stock_ilimitado || recompensa.stock_disponible > 0)
    )
  }

  // Realizar canje de recompensa
  async canjearRecompensa(idCliente, idRecompensa) {
    const cliente = await this.obtenerInfoLealtadCliente(idCliente)
    const recompensa = await this.obtenerDetalleRecompensa(idRecompensa)

    if (cliente.puntos_acumulados < recompensa.puntos_requeridos) {
      throw new Error('Puntos insuficientes para canjear esta recompensa')
    }

    if (!recompensa.stock_ilimitado && recompensa.stock_disponible <= 0) {
      throw new Error('Recompensa agotada')
    }

    const nuevoSaldo = cliente.puntos_acumulados - recompensa.puntos_requeridos
    const fechaVencimiento = new Date()
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 6) // Vence en 6 meses

    // Registrar canje
    const { data: canje, error: errorCanje } = await supabase
      .from('canje')
      .insert([{
        id_cliente: idCliente,
        id_recompensa: idRecompensa,
        puntos_utilizados: recompensa.puntos_requeridos,
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0]
      }])
      .select()
      .single()

    if (errorCanje) throw errorCanje

    // Actualizar puntos del cliente
    await supabase
      .from('cliente')
      .update({ 
        puntos_acumulados: nuevoSaldo,
        id_nivel_actual: await this.calcularNivelCliente(nuevoSaldo),
        fecha_ultimo_canje: new Date().toISOString().split('T')[0]
      })
      .eq('id_cliente', idCliente)

    // Registrar transacción de puntos (uso)
    await supabase
      .from('puntos_cliente')
      .insert([{
        id_cliente: idCliente,
        puntos_ganados: 0,
        puntos_usados: recompensa.puntos_requeridos,
        saldo_anterior: cliente.puntos_acumulados,
        saldo_actual: nuevoSaldo,
        concepto: `Canje: ${recompensa.nombre}`
      }])

    // Actualizar stock de recompensa si no es ilimitado
    if (!recompensa.stock_ilimitado) {
      await supabase
        .from('recompensa')
        .update({ stock_disponible: supabase.raw('stock_disponible - 1') })
        .eq('id_recompensa', idRecompensa)
    }

    return canje
  }

  // Obtener detalle de una recompensa
  async obtenerDetalleRecompensa(idRecompensa) {
    const { data, error } = await supabase
      .from('recompensa')
      .select(`
        *,
        producto_relacionado:producto(id_producto, nombre, imagen_url)
      `)
      .eq('id_recompensa', idRecompensa)
      .single()

    if (error) throw error
    return data
  }

  // Obtener historial de canjes de un cliente
  async obtenerHistorialCanjes(idCliente, limit = 20) {
    const { data, error } = await supabase
      .from('canje')
      .select(`
        *,
        recompensa:recompensa(nombre, tipo, valor)
      `)
      .eq('id_cliente', idCliente)
      .order('fecha_canje', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // Crear nueva recompensa
  async crearRecompensa(recompensa) {
    const { data, error } = await supabase
      .from('recompensa')
      .insert([recompensa])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Crear nuevo nivel de cliente
  async crearNivelCliente(nivel) {
    const { data, error } = await supabase
      .from('nivel_cliente')
      .insert([nivel])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Configurar programa de lealtad
  async configurarProgramaLealtad(configuracion) {
    const { data, error } = await supabase
      .from('programa_lealtad')
      .upsert([configuracion])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener estadísticas de lealtad
  async obtenerEstadisticasLealtad() {
    const [
      totalClientes,
      clientesActivos,
      totalCanjes,
      puntosDistribuidos
    ] = await Promise.all([
      // Total clientes con puntos
      supabase
        .from('cliente')
        .select('id_cliente')
        .gt('puntos_acumulados', 0),

      // Clientes con canjes en último mes
      supabase
        .from('canje')
        .select('id_cliente')
        .gte('fecha_canje', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Total canjes
      supabase
        .from('canje')
        .select('id_canje', { count: 'exact' }),

      // Total puntos distribuidos
      supabase
        .from('puntos_cliente')
        .select('puntos_ganados')
        .eq('puntos_usados', 0)
    ])

    return {
      totalClientesConPuntos: totalClientes.data?.length || 0,
      clientesActivos: new Set(clientesActivos.data?.map(c => c.id_cliente)).size,
      totalCanjes: totalCanjes.count || 0,
      puntosDistribuidos: puntosDistribuidos.data?.reduce((sum, p) => sum + p.puntos_ganados, 0) || 0
    }
  }

  // Actualizar puntos totales del cliente
  async actualizarPuntosTotales(idCliente) {
    try {
      const totalPuntos = await this.obtenerPuntosTotales(idCliente)
      
      // Actualizar el campo puntos_totales en la tabla cliente si existe
      const { error } = await supabase
        .from('cliente')
        .update({ 
          puntos_acumulados: totalPuntos,
          ultima_actualizacion_puntos: new Date().toISOString()
        })
        .eq('id_cliente', idCliente)

      if (error) {
        console.warn('No se pudo actualizar puntos_totales en tabla cliente:', error.message)
      }

      return totalPuntos
    } catch (error) {
      console.error('Error al actualizar puntos totales:', error)
      throw error
    }
  }

  // Obtener puntos totales de un cliente
  async obtenerPuntosTotales(idCliente) {
    try {
      const { data, error } = await supabase
        .from('puntos_cliente')
        .select('puntos_ganados')
        .eq('id_cliente', idCliente)

      if (error) throw error

      const totalPuntos = data?.reduce((sum, p) => sum + p.puntos_ganados, 0) || 0
      return totalPuntos
    } catch (error) {
      console.error('Error al obtener puntos totales:', error)
      throw error
    }
  }

  // Ajustar puntos manuales (para administrador)
  async ajustarPuntosManuales(idCliente, puntos, motivo) {
    const cliente = await this.obtenerInfoLealtadCliente(idCliente)
    const nuevoSaldo = cliente.puntos_acumulados + puntos

    // Registrar ajuste
    const { data: ajuste, error } = await supabase
      .from('puntos_cliente')
      .insert([{
        id_cliente: idCliente,
        puntos_ganados: Math.max(0, puntos),
        puntos_usados: Math.max(0, -puntos),
        saldo_anterior: cliente.puntos_acumulados,
        saldo_actual: nuevoSaldo,
        concepto: `Ajuste manual: ${motivo}`
      }])
      .select()
      .single()

    if (error) throw error

    // Actualizar puntos del cliente
    await supabase
      .from('cliente')
      .update({ 
        puntos_acumulados: nuevoSaldo,
        id_nivel_actual: await this.calcularNivelCliente(nuevoSaldo)
      })
      .eq('id_cliente', idCliente)

    return ajuste
  }
}

export const lealtadService = new LealtadService()
