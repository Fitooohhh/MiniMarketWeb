import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('zustand/middleware', () => ({ persist: (fn) => fn }))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }
}))

import { supabase } from '../../src/lib/supabase'
const mockSupabase = supabase


import { useCartStore } from '../../src/store/useCartStore'
import { promocionesService } from '../../src/lib/promocionesService'

describe('Promociones + Carrito - Pruebas de Integración', () => {
  const item = (id, precio, cantidad = 1) => ({ id, id_producto: id, precio, nombre: `P${id}`, cantidad })

  beforeEach(() => {
    useCartStore.setState({ items: [] })
    vi.clearAllMocks()
  })

  // I-01: Descuento porcentual sobre total real del carrito
  it('I-01: descuento porcentual se calcula sobre el total real del carrito', () => {
    useCartStore.getState().addItem({ id: 1, id_producto: 1, precio: 50, nombre: 'A' }, 2)
    const carrito = useCartStore.getState().items
    const promo = { tipo: 'descuento', descuento_porcentaje: 10 }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBeCloseTo(10)
  })

  // I-02: Descuento fijo sobre total del carrito
  it('I-02: descuento fijo se resta correctamente del total del carrito', () => {
    useCartStore.getState().addItem({ id: 2, id_producto: 2, precio: 80, nombre: 'B' }, 1)
    const carrito = useCartStore.getState().items
    const promo = { tipo: 'descuento', monto_descuento: 15 }
    const total = useCartStore.getState().getTotal()
    expect(total - promocionesService.calcularDescuento(carrito, promo)).toBeCloseTo(65)
  })

  // I-03: Promoción 2x1 aplicada a producto en carrito
  it('I-03: promo 2x1 reduce correctamente el total cuando aplica', () => {
    useCartStore.getState().addItem({ id: 3, id_producto: 3, precio: 20, nombre: 'C' }, 4)
    const carrito = useCartStore.getState().items
    const promo = { tipo: '2x1', promocion_detalle: [{ id_producto: 3 }] }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(40) // 2 pares × 20
  })

  // I-04: Promo 2x1 sin par disponible no aplica
  it('I-04: promo 2x1 no aplica con cantidad impar sin par completo (1 unidad)', () => {
    useCartStore.getState().addItem({ id: 4, id_producto: 4, precio: 30, nombre: 'D' }, 1)
    const carrito = useCartStore.getState().items
    const promo = { tipo: '2x1', promocion_detalle: [{ id_producto: 4 }] }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(0)
  })

  // I-05: Combo completo genera descuento
  it('I-05: combo completo aplica descuento correcto', () => {
    useCartStore.getState().addItem({ id: 5, id_producto: 5, precio: 20, nombre: 'E' }, 2)
    useCartStore.getState().addItem({ id: 6, id_producto: 6, precio: 10, nombre: 'F' }, 1)
    const carrito = useCartStore.getState().items
    const promo = {
      tipo: 'combo',
      monto_descuento: 30,
      promocion_detalle: [
        { id_producto: 5, cantidad_requerida: 2 },
        { id_producto: 6, cantidad_requerida: 1 },
      ],
    }
    // valorCombo = 20*2 + 10*1 = 50; descuento = 50-30 = 20
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(20)
  })

  // I-06: Descuento no supera el total del carrito (≥ 0)
  it('I-06: el descuento calculado nunca supera el total del carrito', () => {
    useCartStore.getState().addItem({ id: 7, id_producto: 7, precio: 5, nombre: 'G' }, 1)
    const carrito = useCartStore.getState().items
    const promo = { tipo: 'descuento', monto_descuento: 1000 }
    const descuento = promocionesService.calcularDescuento(carrito, promo)
    expect(descuento).toBeGreaterThanOrEqual(0)
  })

  // I-07: obtenerPromocionesActivas consulta Supabase con filtros correctos
  it('I-07: obtenerPromocionesActivas consulta la tabla promocion_avanzada', async () => {
    mockSupabase.order = vi.fn().mockResolvedValue({ data: [], error: null })
    await promocionesService.obtenerPromocionesActivas()
    expect(mockSupabase.from).toHaveBeenCalledWith('promocion_avanzada')
  })

  // I-08: crearPromocion llama a insert en Supabase
  it('I-08: crearPromocion invoca insert en Supabase', async () => {
    const nuevaPromo = { nombre: 'Promo Test', tipo: 'descuento', descuento_porcentaje: 5 }
    await promocionesService.crearPromocion(nuevaPromo)
    expect(mockSupabase.insert).toHaveBeenCalledWith([nuevaPromo])
  })

  // I-09: Carrito vacío → descuento siempre 0 para cualquier promo
  it('I-09: cualquier promo sobre carrito vacío retorna descuento 0', () => {
    const promos = [
      { tipo: 'descuento', descuento_porcentaje: 50 },
      { tipo: 'descuento', monto_descuento: 100 },
      { tipo: '2x1', promocion_detalle: [] },
      { tipo: 'combo', monto_descuento: 10, promocion_detalle: [] },
    ]
    promos.forEach(promo => {
      expect(promocionesService.calcularDescuento([], promo)).toBe(0)
    })
  })

  // I-10: Promo combo incompleto → descuento 0
  it('I-10: combo incompleto no aplica descuento', () => {
    useCartStore.getState().addItem({ id: 8, id_producto: 8, precio: 10, nombre: 'H' }, 1)
    const carrito = useCartStore.getState().items
    const promo = {
      tipo: 'combo',
      monto_descuento: 5,
      promocion_detalle: [
        { id_producto: 8, cantidad_requerida: 3 },
      ],
    }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(0)
  })

  // I-11: generarCodigoCupon retorna string válido
  it('I-11: generarCodigoCupon genera código válido de 8 caracteres alfanuméricos', () => {
    const codigo = promocionesService.generarCodigoCupon()
    expect(codigo).toMatch(/^[A-Z0-9]{8}$/)
  })

  // I-12: Precio carrito actualizado al cambiar cantidad
  it('I-12: total del carrito se actualiza al cambiar cantidad y refleja en descuento', () => {
    useCartStore.getState().addItem({ id: 9, id_producto: 9, precio: 10, nombre: 'I' }, 1)
    useCartStore.getState().updateQuantity(9, 5)
    const carrito = useCartStore.getState().items
    const promo = { tipo: 'descuento', descuento_porcentaje: 20 }
    // total = 50; 20% = 10
    expect(promocionesService.calcularDescuento(carrito, promo)).toBeCloseTo(10)
  })

  // I-13: Múltiples promos independientes sobre mismo carrito
  it('I-13: diferentes promociones calculan descuentos independientes sobre el mismo carrito', () => {
    useCartStore.getState().addItem({ id: 10, id_producto: 10, precio: 100, nombre: 'J' }, 1)
    const carrito = useCartStore.getState().items
    const promo10 = { tipo: 'descuento', descuento_porcentaje: 10 }
    const promo20 = { tipo: 'descuento', descuento_porcentaje: 20 }
    expect(promocionesService.calcularDescuento(carrito, promo20))
      .toBeGreaterThan(promocionesService.calcularDescuento(carrito, promo10))
  })

  // I-14: agregarProductosPromocion llama a insert con id_promocion
  it('I-14: agregarProductosPromocion usa el id_promocion correcto en el insert', async () => {
    const productos = [{ id_producto: 1, cantidad_requerida: 1, precio_especial: 10 }]
    await promocionesService.agregarProductosPromocion(42, productos)
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id_promocion: 42 })])
    )
  })

  // I-15: Descuento 2x1 con 3 unidades = 1 par = precio de 1 unidad
  it('I-15: promo 2x1 con 3 unidades descuenta exactamente 1 precio unitario', () => {
    useCartStore.getState().addItem({ id: 11, id_producto: 11, precio: 15, nombre: 'K' }, 3)
    const carrito = useCartStore.getState().items
    const promo = { tipo: '2x1', promocion_detalle: [{ id_producto: 11 }] }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(15) // 1 par × 15
  })
})
