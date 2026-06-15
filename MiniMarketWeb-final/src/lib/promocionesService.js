import { supabase } from './supabase'

class PromocionesService {
  // Obtener todas las promociones avanzadas
  async obtenerPromociones() {
    const { data, error } = await supabase
      .from('promocion_avanzada')
      .select(`
        *,
        promocion_detalle (
          id_detalle,
          id_producto,
          cantidad_requerida,
          cantidad_regalo,
          precio_especial,
          producto:producto(id_producto, nombre, precio, imagen_url)
        )
      `)
      .order('fecha_creacion', { ascending: false })

    if (error) throw error
    return data
  }

  // Obtener promociones activas para clientes
  async obtenerPromocionesActivas() {
    const hoy = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('promocion_avanzada')
      .select(`
        *,
        promocion_detalle (
          id_detalle,
          id_producto,
          cantidad_requerida,
          cantidad_regalo,
          precio_especial,
          producto:producto(id_producto, nombre, precio, imagen_url, stock)
        )
      `)
      .eq('activa', true)
      .lte('fecha_inicio', hoy)
      .gte('fecha_fin', hoy)
      .order('fecha_creacion', { ascending: false })

    if (error) throw error
    return data
  }

  // Crear nueva promoción
  async crearPromocion(promocion) {
    const { data, error } = await supabase
      .from('promocion_avanzada')
      .insert([promocion])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Agregar productos a promoción
  async agregarProductosPromocion(idPromocion, productos) {
    const { data, error } = await supabase
      .from('promocion_detalle')
      .insert(productos.map(p => ({ ...p, id_promocion: idPromocion })))
      .select()

    if (error) throw error
    return data
  }

  // Generar cupones
  async generarCupones(idPromocion, cantidad, idCliente = null) {
    const cupones = []
    for (let i = 0; i < cantidad; i++) {
      const codigo = this.generarCodigoCupon()
      cupones.push({
        id_promocion: idPromocion,
        codigo,
        id_cliente: idCliente,
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    }

    const { data, error } = await supabase
      .from('cupon')
      .insert(cupones)
      .select()

    if (error) throw error
    return data
  }

  // Validar y aplicar cupón
  async validarCupon(codigo, idCliente, totalCompra) {
    const { data: cupon, error: errorCupon } = await supabase
      .from('cupon')
      .select(`
        *,
        promocion:promocion_avanzada(*)
      `)
      .eq('codigo', codigo)
      .eq('usado', false)
      .single()

    if (errorCupon || !cupon) {
      throw new Error('Cupón no válido o ya utilizado')
    }

    // Validar vencimiento
    if (new Date(cupon.fecha_vencimiento) < new Date()) {
      throw new Error('Cupón vencido')
    }

    // Validar límite de usos
    if (cupon.usos_actuales >= cupon.limite_usos) {
      throw new Error('Cupón ha alcanzado su límite de usos')
    }

    // Validar mínimo de compra
    if (totalCompra < cupon.promocion.minimo_compra) {
      throw new Error(`Mínimo de compra requerido: $${cupon.promocion.minimo_compra}`)
    }

    // Validar cliente específico
    if (cupon.id_cliente && cupon.id_cliente !== idCliente) {
      throw new Error('Cupón no válido para este cliente')
    }

    return cupon
  }

  // Aplicar descuento a una venta
  async aplicarPromocionVenta(idVenta, idPromocion, idCupon = null) {
    // Marcar cupón como usado si aplica
    if (idCupon) {
      await supabase
        .from('cupon')
        .update({ 
          usado: true, 
          fecha_uso: new Date().toISOString(),
          usos_actuales: supabase.raw('usos_actuales + 1')
        })
        .eq('id_cupon', idCupon)
    }

    // Incrementar contador de usos de promoción
    await supabase
      .from('promocion_avanzada')
      .update({ 
        usos_actuales: supabase.raw('usos_actuales + 1')
      })
      .eq('id_promocion', idPromocion)

    // Registrar en detalle de venta (necesitarás modificar la tabla venta)
    const { data, error } = await supabase
      .from('venta')
      .update({ 
        id_promocion_aplicada: idPromocion,
        id_cupon_usado: idCupon
      })
      .eq('id_venta', idVenta)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Calcular descuento para carrito
  calcularDescuento(carrito, promocion) {
    let descuento = 0
    let productosValidos = []

    switch (promocion.tipo) {
      case 'descuento':
        const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
        if (promocion.descuento_porcentaje) {
          descuento = totalCarrito * (promocion.descuento_porcentaje / 100)
        } else if (promocion.monto_descuento) {
          descuento = Math.min(totalCarrito, promocion.monto_descuento)
        }
        break

      case '2x1':
        promocion.promocion_detalle.forEach(detalle => {
          const itemsCarrito = carrito.filter(item => item.id_producto === detalle.id_producto)
          if (itemsCarrito.length > 0) {
            const cantidadTotal = itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0)
            const pares = Math.floor(cantidadTotal / 2)
            const precioProducto = itemsCarrito[0].precio
            descuento += pares * precioProducto
          }
        })
        break

      case 'combo':
        // Verificar si se cumplen las condiciones del combo
        let comboCompleto = true
        let valorCombo = 0

        promocion.promocion_detalle.forEach(detalle => {
          const itemsCarrito = carrito.filter(item => item.id_producto === detalle.id_producto)
          const cantidadTotal = itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0)
          
          if (cantidadTotal < detalle.cantidad_requerida) {
            comboCompleto = false
          } else {
            valorCombo += itemsCarrito[0].precio * detalle.cantidad_requerida
          }
        })

        if (comboCompleto && promocion.monto_descuento) {
          descuento = valorCombo - promocion.monto_descuento
        }
        break
    }

    return Math.max(0, descuento)
  }

  // Generar código de cupón único
  generarCodigoCupon() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let codigo = ''
    for (let i = 0; i < 8; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
    }
    return codigo
  }

  // Eliminar promoción
  async eliminarPromocion(idPromocion) {
    // Eliminar detalles primero
    await supabase
      .from('promocion_detalle')
      .delete()
      .eq('id_promocion', idPromocion)

    // Eliminar cupones asociados
    await supabase
      .from('cupon')
      .delete()
      .eq('id_promocion', idPromocion)

    // Eliminar promoción
    const { data, error } = await supabase
      .from('promocion_avanzada')
      .delete()
      .eq('id_promocion', idPromocion)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const promocionesService = new PromocionesService()
