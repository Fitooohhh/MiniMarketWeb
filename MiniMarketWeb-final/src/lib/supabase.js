import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Determinar si debemos usar el modo simulador local
const useMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')

let supabaseClient;

if (useMock) {
  console.warn('⚠️ Usando Supabase Local Simulador (Mock Mode) - Los cambios se guardarán en LocalStorage.')

  const defaultDb = {
    usuario: [
      { id_usuario: 1, usuario: 'admin', contrasena: '1234', rol: 'admin' },
      { id_usuario: 2, usuario: 'empleado', contrasena: '1234', rol: 'empleado' },
      { id_usuario: 3, usuario: 'cliente', contrasena: '1234', rol: 'cliente' },
      { id_usuario: 4, usuario: 'repartidor', contrasena: '1234', rol: 'repartidor' }
    ],
    empleado: [
      { id_empleado: 1, id_usuario: 1, nombre: 'Administrador Principal', cargo: 'Administrador', telefono: '70010001', salario_base: 5000 },
      { id_empleado: 2, id_usuario: 2, nombre: 'Juan Pérez (Cajero)', cargo: 'Cajero', telefono: '70020002', salario_base: 2500 },
      { id_empleado: 3, id_usuario: 4, nombre: 'Carlos Express (Repartidor)', cargo: 'Repartidor', telefono: '70030003', salario_base: 2200 }
    ],
    cliente: [
      { id_cliente: 1, id_usuario: 3, nombre: 'María Gómez', tipo: 'Regular', ci_ruc: '1234567', direccion: 'Calle Las Flores #456', telefono: '70040004', credito: 150, puntos: 35 }
    ],
    producto: [
      { id_producto: 1, codigo: 'L001', nombre: 'Leche Pil 1L', precio: 6.50, stock: 50, categoria: 'Lácteos', imagen_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300' },
      { id_producto: 2, codigo: 'P001', nombre: 'Pan de Molde Familiar', precio: 10.00, stock: 30, categoria: 'Panadería', imagen_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300' },
      { id_producto: 3, codigo: 'B001', nombre: 'Coca Cola 2L', precio: 11.50, stock: 100, categoria: 'Bebidas', imagen_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300' },
      { id_producto: 4, codigo: 'A001', nombre: 'Aceite Fino 1L', precio: 14.50, stock: 25, categoria: 'Abarrotes', imagen_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300' },
      { id_producto: 5, codigo: 'A002', nombre: 'Arroz Faraón 1kg', precio: 7.00, stock: 45, categoria: 'Abarrotes', imagen_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' }
    ],
    inventario: [
      { id_inventario: 1, id_producto: 1, cantidad: 20, fecha_ingreso: '2026-06-01' },
      { id_inventario: 2, id_producto: 2, cantidad: 15, fecha_ingreso: '2026-06-02' },
      { id_inventario: 3, id_producto: 3, cantidad: 50, fecha_ingreso: '2026-06-03' }
    ],
    venta: [
      { id_venta: 1, id_cliente: 1, fecha: '2026-06-05T14:30:00Z', total: 45.00, estado: 'completado', metodo_pago: 'efectivo', tipo_entrega: 'tienda', puntos_ganados: 4, id_empleado: 2 }
    ],
    reparto: [
      { id_reparto: 1, id_venta: 1, id_empleado: 3, estado: 'Pendiente', direccion_entrega: 'Calle Las Flores #456', fecha_asignacion: '2026-06-05T15:00:00Z' }
    ],
    asistencia: [
      { id_asistencia: 1, id_empleado: 2, fecha: '2026-06-11', hora_entrada: '08:00:00', hora_salida: '16:00:00', estado: 'Presente' }
    ],
    nomina_configuracion: [
      { id: 1, bono_transporte: 200.00, bono_antiguedad_anual: 100.00, descuento_afp: 12.71, iva_porcentaje: 13.00 }
    ],
    programa_lealtad: [
      { id: 1, puntos_por_boliviano: 0.10, valor_punto_boliviano: 0.50, minimo_puntos_canje: 10 }
    ],
    politica_devolucion: [
      { id: 1, dias_maximos: 7, requiere_factura: true, estado_producto_obligatorio: 'Intacto' }
    ],
    notificaciones: [
      { id: 1, id_usuario: 4, titulo: 'Nuevo reparto asignado', mensaje: 'Se te ha asignado el reparto #1', leido: false, fecha: '2026-06-11T08:30:00Z' }
    ],
    detalle_venta: [
      { id_detalle: 1, id_venta: 1, id_producto: 1, cantidad: 2, precio_unitario: 6.50, subtotal: 13.00 },
      { id_detalle: 2, id_venta: 1, id_producto: 3, cantidad: 2, precio_unitario: 11.50, subtotal: 23.00 }
    ],
    promocion: [
      { id_promocion: 1, id_producto: 1, tipo: 'Descuento', valor: 10, descripcion: '10% de descuento en Leche', activa: true },
      { id_promocion: 2, id_producto: 3, tipo: '2x1', valor: 0, descripcion: 'Lleva 2 Coca Colas por el precio de 1', activa: true }
    ],
    devolucion: [
      { id_devolucion: 1, id_venta: 1, id_producto: 1, cantidad: 1, motivo: 'Mal estado', estado: 'Pendiente', fecha: '2026-06-11' }
    ],
    turnos: [
      { id_turno: 1, id_empleado: 2, dia_semana: 'Lunes', hora_inicio: '08:00', hora_fin: '16:00' },
      { id_turno: 2, id_empleado: 2, dia_semana: 'Martes', hora_inicio: '08:00', hora_fin: '16:00' }
    ]
  };

  // Inicializar Base de Datos local
  if (typeof window !== 'undefined' && !localStorage.getItem('minimarket_mock_db')) {
    localStorage.setItem('minimarket_mock_db', JSON.stringify(defaultDb));
  }

  class MockSupabaseBuilder {
    constructor(table) {
      this.table = table
      this.filters = []
      this.orderField = null
      this.orderDesc = false
      this.limitVal = null
      this.isSingle = false
      this.isMaybeSingle = false
      this.insertData = null
      this.updateData = null
      this.isDelete = false
    }

    select(fields) {
      return this
    }

    eq(field, value) {
      this.filters.push({ type: 'eq', field, value })
      return this
    }

    neq(field, value) {
      this.filters.push({ type: 'neq', field, value })
      return this
    }

    gt(field, value) {
      this.filters.push({ type: 'gt', field, value })
      return this
    }

    gte(field, value) {
      this.filters.push({ type: 'gte', field, value })
      return this
    }

    lt(field, value) {
      this.filters.push({ type: 'lt', field, value })
      return this
    }

    lte(field, value) {
      this.filters.push({ type: 'lte', field, value })
      return this
    }

    like(field, value) {
      this.filters.push({ type: 'like', field, value })
      return this
    }

    ilike(field, value) {
      this.filters.push({ type: 'ilike', field, value })
      return this
    }

    order(field, options = {}) {
      this.orderField = field
      this.orderDesc = options.ascending === false
      return this
    }

    limit(val) {
      this.limitVal = val
      return this
    }

    single() {
      this.isSingle = true
      return this
    }

    maybeSingle() {
      this.isMaybeSingle = true
      return this
    }

    insert(data) {
      this.insertData = data
      return this
    }

    update(data) {
      this.updateData = data
      return this
    }

    delete() {
      this.isDelete = true
      return this
    }

    then(onfulfilled, onrejected) {
      return this.execute().then(onfulfilled, onrejected)
    }

    async execute() {
      let db = JSON.parse(localStorage.getItem('minimarket_mock_db') || JSON.stringify(defaultDb))
      if (!db[this.table]) {
        db[this.table] = []
      }
      let rows = [...db[this.table]]

      // Filtrar
      for (const filter of this.filters) {
        rows = rows.filter(row => {
          const rowVal = row[filter.field]
          if (filter.type === 'eq') return String(rowVal) === String(filter.value)
          if (filter.type === 'neq') return String(rowVal) !== String(filter.value)
          if (filter.type === 'gt') return Number(rowVal) > Number(filter.value)
          if (filter.type === 'gte') return Number(rowVal) >= Number(filter.value)
          if (filter.type === 'lt') return Number(rowVal) < Number(filter.value)
          if (filter.type === 'lte') return Number(rowVal) <= Number(filter.value)
          if (filter.type === 'like' || filter.type === 'ilike') {
            const pattern = String(filter.value).replace(/%/g, '')
            return String(rowVal).toLowerCase().includes(pattern.toLowerCase())
          }
          return true
        })
      }

      // Ordenar
      if (this.orderField) {
        rows.sort((a, b) => {
          const valA = a[this.orderField]
          const valB = b[this.orderField]
          if (valA < valB) return this.orderDesc ? 1 : -1
          if (valA > valB) return this.orderDesc ? -1 : 1
          return 0
        })
      }

      // Limitar
      if (this.limitVal !== null) {
        rows = rows.slice(0, this.limitVal)
      }

      // Auto-join relaciones conocidas
      rows = rows.map(row => {
        const cloned = { ...row }
        if (cloned.id_producto && db.producto) {
          cloned.producto = db.producto.find(p => p.id_producto === cloned.id_producto) || null
        }
        if (cloned.id_venta && db.venta) {
          cloned.venta = db.venta.find(v => v.id_venta === cloned.id_venta) || null
          if (cloned.venta && cloned.venta.id_cliente && db.cliente) {
            cloned.venta.cliente = db.cliente.find(c => c.id_cliente === cloned.venta.id_cliente) || null
          }
        }
        if (cloned.id_empleado && db.empleado) {
          cloned.empleado = db.empleado.find(e => e.id_empleado === cloned.id_empleado) || null
        }
        if (cloned.id_cliente && db.cliente) {
          cloned.cliente = db.cliente.find(c => c.id_cliente === cloned.id_cliente) || null
        }
        return cloned
      })

      // Manejar INSERT
      if (this.insertData) {
        const listToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData]
        const inserted = []
        for (const item of listToInsert) {
          const idField = `id_${this.table}`
          const maxId = db[this.table].reduce((max, r) => Math.max(max, Number(r[idField] || r.id || 0)), 0)
          const newItem = {
            ...item,
            [idField]: maxId + 1,
            id: maxId + 1
          }
          db[this.table].push(newItem)
          inserted.push(newItem)
        }
        localStorage.setItem('minimarket_mock_db', JSON.stringify(db))
        return {
          data: this.isSingle ? inserted[0] : (Array.isArray(this.insertData) ? inserted : inserted[0]),
          error: null
        }
      }

      // Manejar UPDATE
      if (this.updateData) {
        const originalList = db[this.table] || []
        const updated = []
        db[this.table] = originalList.map(row => {
          let match = true
          for (const filter of this.filters) {
            const rowVal = row[filter.field]
            if (filter.type === 'eq' && String(rowVal) !== String(filter.value)) match = false
          }
          if (match) {
            const newRow = { ...row, ...this.updateData }
            updated.push(newRow)
            return newRow
          }
          return row
        })
        localStorage.setItem('minimarket_mock_db', JSON.stringify(db))
        return {
          data: this.isSingle || this.isMaybeSingle ? (updated[0] || null) : updated,
          error: null
        }
      }

      // Manejar DELETE
      if (this.isDelete) {
        const originalList = db[this.table] || []
        const kept = []
        const deleted = []
        for (const row of originalList) {
          let match = true
          for (const filter of this.filters) {
            const rowVal = row[filter.field]
            if (filter.type === 'eq' && String(rowVal) !== String(filter.value)) match = false
          }
          if (match) {
            deleted.push(row)
          } else {
            kept.push(row)
          }
        }
        db[this.table] = kept
        localStorage.setItem('minimarket_mock_db', JSON.stringify(db))
        return {
          data: deleted,
          error: null
        }
      }

      // Retornar consulta normal
      if (this.isSingle) {
        if (rows.length === 0) {
          return { data: null, error: { message: 'Fila no encontrada en simulador local', code: 'PGRST116' } }
        }
        return { data: rows[0], error: null }
      }

      if (this.isMaybeSingle) {
        return { data: rows.length > 0 ? rows[0] : null, error: null }
      }

      return { data: rows, error: null }
    }
  }

  const mockAuth = {
    async signUp({ email, password }) {
      return { data: { user: { id: 999, email } }, error: null }
    },
    async signInWithPassword({ email, password }) {
      return { data: { user: { id: 999, email } }, error: null }
    },
    async signOut() {
      return { error: null }
    },
    async getSession() {
      return { data: { session: null }, error: null }
    },
    onAuthStateChange(callback) {
      setTimeout(() => {
        callback('INITIAL_SESSION', null)
      }, 0)
      return { data: { subscription: { unsubscribe() {} } } }
    }
  }

  supabaseClient = {
    auth: mockAuth,
    from: (table) => new MockSupabaseBuilder(table)
  }
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    },
    db: {
      schema: 'public'
    }
  })
}

export const supabase = supabaseClient

// Helper para manejar errores de Supabase
export const handleSupabaseError = (error) => {
  if (error) {
    console.error('Supabase error:', error)
    return error.message || 'Ocurrió un error inesperado'
  }
  return null
}
