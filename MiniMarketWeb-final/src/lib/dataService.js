import { supabase } from './supabase'

/**
 * Servicio centralizado para cargar datos de la base de datos
 * Asegura que todos los datos se carguen correctamente con manejo de errores
 */

// ============ PRODUCTOS ============
export const loadProductos = async (filtros = {}) => {
  try {
    let query = supabase.from('producto').select('*')
    
    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }
    
    const { data, error } = await query.order('nombre')
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading productos:', error)
    return { data: [], error: error.message }
  }
}

export const loadProductoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('producto')
      .select('*')
      .eq('id_producto', id)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error loading producto:', error)
    return { data: null, error: error.message }
  }
}

// ============ PROMOCIONES ============
export const loadPromociones = async (filtros = {}) => {
  try {
    let query = supabase
      .from('promocion')
      .select('*, producto:id_producto(*)')
    
    // Cargar solo promociones activas por defecto
    if (filtros.activas !== false) {
      const hoy = new Date().toISOString()
      query = query
        .lte('fecha_inicio', hoy)
        .gte('fecha_fin', hoy)
    }
    
    const { data, error } = await query.order('fecha_inicio', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading promociones:', error)
    return { data: [], error: error.message }
  }
}

// ============ VENTAS ============
export const loadVentas = async (filtros = {}) => {
  try {
    let query = supabase
      .from('venta')
      .select(`
        *,
        cliente:id_cliente(id_cliente, nombre, telefono, direccion),
        empleado:id_empleado(id_empleado, nombre),
        repartidor:id_repartidor(id_empleado, nombre),
        reparto(id_reparto, estado, fecha)
      `)
    
    if (filtros.id_cliente) {
      query = query.eq('id_cliente', filtros.id_cliente)
    }
    
    if (filtros.id_empleado) {
      query = query.eq('id_empleado', filtros.id_empleado)
    }
    
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado)
    }
    
    const { data, error } = await query.order('fecha', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading ventas:', error)
    return { data: [], error: error.message }
  }
}

export const loadVentaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('venta')
      .select(`
        *,
        cliente:id_cliente(*),
        empleado:id_empleado(*),
        repartidor:id_repartidor(*),
        reparto(*)
      `)
      .eq('id_venta', id)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error loading venta:', error)
    return { data: null, error: error.message }
  }
}

// ============ DETALLES DE VENTA ============
export const loadDetallesVenta = async (id_venta) => {
  try {
    const { data, error } = await supabase
      .from('detalle_venta')
      .select(`
        *,
        producto:id_producto(id_producto, nombre, imagen_url, precio)
      `)
      .eq('id_venta', id_venta)
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading detalles_venta:', error)
    return { data: [], error: error.message }
  }
}

// ============ REPARTOS ============
export const loadRepartos = async (filtros = {}) => {
  try {
    let query = supabase
      .from('reparto')
      .select(`
        *,
        empleado:id_empleado(id_empleado, nombre, telefono),
        venta:id_venta(
          id_venta,
          total,
          fecha,
          cliente:id_cliente(nombre, direccion, telefono)
        )
      `)
    
    if (filtros.id_empleado) {
      query = query.eq('id_empleado', filtros.id_empleado)
    }
    
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado)
    }
    
    const { data, error } = await query.order('fecha', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading repartos:', error)
    return { data: [], error: error.message }
  }
}

// ============ EMPLEADOS ============
export const loadEmpleados = async (filtros = {}) => {
  try {
    let query = supabase
      .from('empleado')
      .select(`
        *,
        usuario:id_usuario(usuario, rol)
      `)
    
    if (filtros.tipo_cargo) {
      query = query.eq('tipo_cargo', filtros.tipo_cargo)
    }
    
    const { data, error } = await query.order('nombre')
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading empleados:', error)
    return { data: [], error: error.message }
  }
}

export const loadEmpleadoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('empleado')
      .select(`
        *,
        usuario:id_usuario(*)
      `)
      .eq('id_empleado', id)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error loading empleado:', error)
    return { data: null, error: error.message }
  }
}

// ============ CLIENTES ============
export const loadClientes = async (filtros = {}) => {
  try {
    let query = supabase
      .from('cliente')
      .select(`
        *,
        usuario:id_usuario(usuario, rol)
      `)
    
    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo)
    }
    
    const { data, error } = await query.order('nombre')
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading clientes:', error)
    return { data: [], error: error.message }
  }
}

export const loadClienteById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('cliente')
      .select(`
        *,
        usuario:id_usuario(*)
      `)
      .eq('id_cliente', id)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error loading cliente:', error)
    return { data: null, error: error.message }
  }
}

// ============ ASISTENCIA ============
export const loadAsistencias = async (filtros = {}) => {
  try {
    let query = supabase
      .from('asistencia')
      .select(`
        *,
        empleado:id_empleado(id_empleado, nombre, rol, telefono)
      `)
    
    if (filtros.id_empleado) {
      query = query.eq('id_empleado', filtros.id_empleado)
    }
    
    if (filtros.fecha_inicio && filtros.fecha_fin) {
      query = query
        .gte('fecha', filtros.fecha_inicio)
        .lte('fecha', filtros.fecha_fin)
    }
    
    const { data, error } = await query.order('fecha', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading asistencias:', error)
    return { data: [], error: error.message }
  }
}

// ============ INVENTARIO ============
export const loadInventario = async (filtros = {}) => {
  try {
    let query = supabase
      .from('inventario')
      .select(`
        *,
        producto:id_producto(
          id_producto,
          codigo,
          nombre,
          categoria,
          precio,
          stock
        )
      `)
    
    const { data, error } = await query.order('fecha_ingreso', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading inventario:', error)
    return { data: [], error: error.message }
  }
}

// ============ ÓRDENES DE COMPRA ============
export const loadOrdenesCompra = async (filtros = {}) => {
  try {
    let query = supabase
      .from('orden_compra')
      .select(`
        *,
        proveedor:id_proveedor(*),
        detalles:detalle_orden(
          id_detalle_orden,
          cantidad,
          producto:id_producto(nombre, codigo, precio)
        )
      `)
    
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado)
    }
    
    const { data, error } = await query.order('fecha', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading ordenes_compra:', error)
    return { data: [], error: error.message }
  }
}

// ============ PROVEEDORES ============
export const loadProveedores = async () => {
  try {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .order('nombre')
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading proveedores:', error)
    return { data: [], error: error.message }
  }
}

// ============ NOTIFICACIONES ============
export const loadNotificaciones = async (filtros = {}) => {
  try {
    let query = supabase
      .from('notificaciones')
      .select(`
        *,
        repartidor:id_repartidor(nombre),
        venta:id_venta(id_venta, total, cliente:id_cliente(nombre))
      `)
    
    if (filtros.id_repartidor) {
      query = query.eq('id_repartidor', filtros.id_repartidor)
    }
    
    if (filtros.leida !== undefined) {
      query = query.eq('leida', filtros.leida)
    }
    
    const { data, error } = await query.order('fecha', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading notificaciones:', error)
    return { data: [], error: error.message }
  }
}

// ============ DEVOLUCIONES ============
export const loadDevoluciones = async (filtros = {}) => {
  try {
    let query = supabase
      .from('devolucion')
      .select(`
        *,
        detalle_venta:id_detalle_venta(
          cantidad,
          precio_unitario,
          producto:id_producto(nombre),
          venta:id_venta(id_venta, cliente:id_cliente(nombre))
        )
      `)
    
    const { data, error } = await query.order('fecha', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading devoluciones:', error)
    return { data: [], error: error.message }
  }
}

// ============ HORARIOS ============
export const loadHorarios = async (filtros = {}) => {
  try {
    let query = supabase
      .from('horario_empleado')
      .select(`
        *,
        empleado:id_empleado(nombre, rol)
      `)
    
    if (filtros.id_empleado) {
      query = query.eq('id_empleado', filtros.id_empleado)
    }
    
    const { data, error } = await query.order('dia', { ascending: false })
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading horarios:', error)
    return { data: [], error: error.message }
  }
}

// ============ USUARIOS ============
export const loadUsuarios = async () => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        *,
        empleado:empleado(id_empleado, nombre, rol, telefono),
        cliente:cliente(id_cliente, nombre, telefono)
      `)
      .order('usuario')
    
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error loading usuarios:', error)
    return { data: [], error: error.message }
  }
}

// ============ ESTADÍSTICAS ============
export const loadEstadisticas = async () => {
  try {
    const [
      { data: ventasData },
      { data: productosData },
      { data: empleadosData },
      { data: clientesData },
    ] = await Promise.all([
      supabase.from('venta').select('id_venta', { count: 'exact', head: true }),
      supabase.from('producto').select('id_producto', { count: 'exact', head: true }),
      supabase.from('empleado').select('id_empleado', { count: 'exact', head: true }),
      supabase.from('cliente').select('id_cliente', { count: 'exact', head: true }),
    ])
    
    return {
      data: {
        totalVentas: ventasData?.length || 0,
        totalProductos: productosData?.length || 0,
        totalEmpleados: empleadosData?.length || 0,
        totalClientes: clientesData?.length || 0,
      },
      error: null
    }
  } catch (error) {
    console.error('Error loading estadisticas:', error)
    return { data: {}, error: error.message }
  }
}
