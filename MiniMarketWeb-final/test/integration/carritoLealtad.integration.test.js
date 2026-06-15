import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() }
}))
vi.mock('zustand/middleware', () => ({ persist: (fn) => fn }))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}))

import { supabase } from '../../src/lib/supabase'
const mockSupabase = supabase


import { useCartStore } from '../../src/store/useCartStore'
import { lealtadService } from '../../src/lib/lealtadService'

describe('Carrito + Lealtad - Pruebas de Integración', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
    vi.clearAllMocks()
  })

  const p = (id, precio) => ({ id, id_producto: id, nombre: `Prod${id}`, precio })

  // I-01: Total del carrito concuerda con puntos calculados
  it('I-01: puntos calculados coinciden con total del carrito (getTotal)', () => {
    useCartStore.getState().addItem(p(1, 100), 2)
    const total = useCartStore.getState().getTotal()          // 200
    const puntos = lealtadService.calcularPuntosCompra(total) // 100
    expect(puntos).toBe(100)
  })

  // I-02: Carrito vacío genera 0 puntos
  it('I-02: carrito vacío genera 0 puntos de lealtad', () => {
    const total = useCartStore.getState().getTotal()
    const puntos = lealtadService.calcularPuntosCompra(total)
    expect(puntos).toBe(0)
  })

  // I-03: Agregar varios productos y verificar puntos proporcionales
  it('I-03: puntos son proporcionales al total con múltiples productos', () => {
    useCartStore.getState().addItem(p(1, 50), 2)  // 100
    useCartStore.getState().addItem(p(2, 30), 1)  // 30
    const total = useCartStore.getState().getTotal() // 130
    const puntos = lealtadService.calcularPuntosCompra(total)
    expect(puntos).toBe(65)
  })

  // I-04: Actualizar cantidad recalcula puntos correctamente
  it('I-04: actualizar cantidad en carrito cambia los puntos a ganar', () => {
    useCartStore.getState().addItem(p(1, 40), 1)
    useCartStore.getState().updateQuantity(1, 3)
    const total = useCartStore.getState().getTotal() // 120
    expect(lealtadService.calcularPuntosCompra(total)).toBe(60)
  })

  // I-05: Eliminar producto reduce puntos
  it('I-05: eliminar un producto reduce los puntos a ganar', () => {
    useCartStore.getState().addItem(p(1, 100), 1)
    useCartStore.getState().addItem(p(2, 50), 1)
    useCartStore.getState().removeItem(2)
    const total = useCartStore.getState().getTotal() // 100
    expect(lealtadService.calcularPuntosCompra(total)).toBe(50)
  })

  // I-06: clearCart resetea puntos a 0
  it('I-06: vaciar carrito resetea los puntos a 0', () => {
    useCartStore.getState().addItem(p(1, 200), 1)
    useCartStore.getState().clearCart()
    expect(lealtadService.calcularPuntosCompra(useCartStore.getState().getTotal())).toBe(0)
  })

  // I-07: registrarPuntosCompra llama a supabase insert
  it('I-07: registrarPuntosCompra inserta correctamente en Supabase', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id_puntos: 1, puntos_ganados: 50 },
      error: null,
    })
    // actualizarPuntosTotales también usa supabase
    mockSupabase.single.mockResolvedValue({ data: { saldo_puntos: 50 }, error: null })

    const result = await lealtadService.registrarPuntosCompra(1, 1, 100)
    expect(result).toBeTruthy()
    expect(mockSupabase.from).toHaveBeenCalledWith('puntos_cliente')
  })

  // I-08: Precio con descuento afecta puntos
  it('I-08: precio_con_descuento reduce el total y los puntos a ganar', () => {
    const prodConDesc = { id: 5, id_producto: 5, precio: 100, precio_con_descuento: 70 }
    useCartStore.getState().addItem(prodConDesc, 1)
    const total = useCartStore.getState().getTotal() // 70
    expect(lealtadService.calcularPuntosCompra(total)).toBe(35)
  })

  // I-09: Cantidad de ítems no afecta cálculo de puntos directamente
  it('I-09: getItemCount no interfiere con el cálculo de puntos', () => {
    useCartStore.getState().addItem(p(1, 20), 5) // 100
    const count = useCartStore.getState().getItemCount() // 5
    const total = useCartStore.getState().getTotal()     // 100
    expect(count).toBe(5)
    expect(lealtadService.calcularPuntosCompra(total)).toBe(50)
  })

  // I-10: Puntos se mantienen enteros para cualquier combinación de precios
  it('I-10: puntos siempre son enteros para cualquier combinación de carrito', () => {
    useCartStore.getState().addItem(p(1, 33), 1)
    useCartStore.getState().addItem(p(2, 17), 1)
    const total = useCartStore.getState().getTotal() // 50
    const puntos = lealtadService.calcularPuntosCompra(total)
    expect(Number.isInteger(puntos)).toBe(true)
  })

  // I-11: obtenerRecompensas llama a supabase
  it('I-11: obtenerRecompensas consulta la tabla recompensa en Supabase', async () => {
    mockSupabase.order = vi.fn().mockResolvedValue({ data: [], error: null })
    await lealtadService.obtenerRecompensas()
    expect(mockSupabase.from).toHaveBeenCalledWith('recompensa')
  })

  // I-12: obtenerProgramaLealtad consulta tabla correcta
  it('I-12: obtenerProgramaLealtad consulta la tabla programa_lealtad', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { activo: true }, error: null })
    await lealtadService.obtenerProgramaLealtad()
    expect(mockSupabase.from).toHaveBeenCalledWith('programa_lealtad')
  })

  // I-13: Agregar mismo producto varias veces acumula total correctamente
  it('I-13: agregar mismo producto varias veces suma total correctamente para puntos', () => {
    useCartStore.getState().addItem(p(1, 10))
    useCartStore.getState().addItem(p(1, 10))
    useCartStore.getState().addItem(p(1, 10))
    const total = useCartStore.getState().getTotal() // 30
    expect(lealtadService.calcularPuntosCompra(total)).toBe(15)
  })

  // I-14: Secuencia add-remove-add mantiene coherencia
  it('I-14: add-remove-add mantiene total y puntos coherentes', () => {
    useCartStore.getState().addItem(p(1, 100))
    useCartStore.getState().removeItem(1)
    useCartStore.getState().addItem(p(2, 60))
    const total = useCartStore.getState().getTotal() // 60
    expect(lealtadService.calcularPuntosCompra(total)).toBe(30)
  })

  // I-15: Puntos ≥ 1 para cualquier compra con monto > 0
  it('I-15: cualquier compra > 0 Bs genera al menos 1 punto', () => {
    useCartStore.getState().addItem(p(1, 1))
    const total = useCartStore.getState().getTotal()
    expect(lealtadService.calcularPuntosCompra(total)).toBeGreaterThanOrEqual(1)
  })
})
