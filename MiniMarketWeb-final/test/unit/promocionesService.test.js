import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }
}))

import { promocionesService } from '../../src/lib/promocionesService'

describe('PromocionesService.calcularDescuento - Pruebas Unitarias', () => {

  const carrito = [
    { id_producto: 1, nombre: 'Leche', precio: 10, cantidad: 2 },
    { id_producto: 2, nombre: 'Pan',   precio: 5,  cantidad: 3 },
  ]

  // CASO 1: Descuento por porcentaje
  it('U-01: calcularDescuento aplica porcentaje sobre total del carrito', () => {
    const promo = { tipo: 'descuento', descuento_porcentaje: 10 }
    // Total = 10*2 + 5*3 = 35; 10% de 35 = 3.5
    const descuento = promocionesService.calcularDescuento(carrito, promo)
    expect(descuento).toBeCloseTo(3.5)
  })

  // CASO 2: Descuento por monto fijo
  it('U-02: calcularDescuento aplica monto fijo de descuento', () => {
    const promo = { tipo: 'descuento', monto_descuento: 5 }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(5)
  })

  // CASO 3: Descuento 2x1 con producto en carrito
  it('U-03: calcularDescuento 2x1 descuenta el precio de la mitad de las unidades', () => {
    const carritoConPromo = [{ id_producto: 1, precio: 10, cantidad: 4 }]
    const promo = {
      tipo: '2x1',
      promocion_detalle: [{ id_producto: 1, cantidad_requerida: 1 }]
    }
    // 4 unidades / 2 pares = 2 pares => descuento = 2 * 10 = 20
    expect(promocionesService.calcularDescuento(carritoConPromo, promo)).toBe(20)
  })

  // CASO 4: Descuento 2x1 con 1 unidad (sin par)
  it('U-04: calcularDescuento 2x1 no aplica descuento con menos de 2 unidades', () => {
    const carritoUno = [{ id_producto: 1, precio: 10, cantidad: 1 }]
    const promo = {
      tipo: '2x1',
      promocion_detalle: [{ id_producto: 1, cantidad_requerida: 1 }]
    }
    expect(promocionesService.calcularDescuento(carritoUno, promo)).toBe(0)
  })

  // CASO 5: Descuento combo completo
  it('U-05: calcularDescuento combo aplica descuento cuando combo está completo', () => {
    const carritoCombo = [
      { id_producto: 1, precio: 10, cantidad: 2 },
      { id_producto: 2, precio: 5,  cantidad: 1 },
    ]
    const promo = {
      tipo: 'combo',
      monto_descuento: 10,
      promocion_detalle: [
        { id_producto: 1, cantidad_requerida: 2 },
        { id_producto: 2, cantidad_requerida: 1 },
      ]
    }
    // valorCombo = 10*2 + 5*1 = 25; descuento = 25 - 10 = 15
    expect(promocionesService.calcularDescuento(carritoCombo, promo)).toBe(15)
  })

  // CASO 6: Combo incompleto no aplica descuento
  it('U-06: calcularDescuento combo no aplica si faltan productos', () => {
    const carritoIncompleto = [{ id_producto: 1, precio: 10, cantidad: 1 }]
    const promo = {
      tipo: 'combo',
      monto_descuento: 5,
      promocion_detalle: [
        { id_producto: 1, cantidad_requerida: 2 },
        { id_producto: 2, cantidad_requerida: 1 },
      ]
    }
    expect(promocionesService.calcularDescuento(carritoIncompleto, promo)).toBe(0)
  })

  // CASO 7: Descuento no puede ser negativo
  it('U-07: calcularDescuento retorna 0 si el descuento calculado es negativo', () => {
    const promo = { tipo: 'descuento', monto_descuento: -100 }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(0)
  })

  // CASO 8: Tipo de promoción desconocido retorna 0
  it('U-08: calcularDescuento retorna 0 para tipo desconocido', () => {
    const promo = { tipo: 'regalo_misterioso' }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(0)
  })

  // CASO 9: Carrito vacío con descuento porcentual
  it('U-09: calcularDescuento retorna 0 con carrito vacío y descuento porcentual', () => {
    const promo = { tipo: 'descuento', descuento_porcentaje: 20 }
    expect(promocionesService.calcularDescuento([], promo)).toBe(0)
  })

  // CASO 10: 2x1 con producto no en carrito
  it('U-10: calcularDescuento 2x1 no aplica si el producto no está en el carrito', () => {
    const promo = {
      tipo: '2x1',
      promocion_detalle: [{ id_producto: 99 }]
    }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(0)
  })

  // CASO 11: generarCodigoCupon retorna string de 8 caracteres
  it('U-11: generarCodigoCupon genera código de exactamente 8 caracteres', () => {
    const codigo = promocionesService.generarCodigoCupon()
    expect(codigo).toHaveLength(8)
  })

  // CASO 12: generarCodigoCupon usa solo mayúsculas y números
  it('U-12: generarCodigoCupon usa solo letras mayúsculas y números', () => {
    const codigo = promocionesService.generarCodigoCupon()
    expect(codigo).toMatch(/^[A-Z0-9]{8}$/)
  })

  // CASO 13: generarCodigoCupon genera códigos distintos cada vez
  it('U-13: generarCodigoCupon genera códigos únicos en sucesivas llamadas', () => {
    const codigos = new Set(Array.from({ length: 20 }, () => promocionesService.generarCodigoCupon()))
    expect(codigos.size).toBeGreaterThan(15)
  })

  // CASO 14: Descuento porcentaje 0 retorna 0
  it('U-14: calcularDescuento con porcentaje 0 retorna 0', () => {
    const promo = { tipo: 'descuento', descuento_porcentaje: 0 }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(0)
  })

  // CASO 15: Descuento porcentaje 100 retorna el total completo
  it('U-15: calcularDescuento con porcentaje 100 retorna el total del carrito', () => {
    const promo = { tipo: 'descuento', descuento_porcentaje: 100 }
    const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0) // 35
    expect(promocionesService.calcularDescuento(carrito, promo)).toBeCloseTo(totalCarrito)
  })
})
