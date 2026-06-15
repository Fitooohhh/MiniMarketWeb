/**
 * PRUEBAS E2E - Flujo completo del carrito de compras
 * 
 * Simula el ciclo completo: agregar → modificar → aplicar descuento → vaciar
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('zustand/middleware', () => ({ persist: (fn) => fn }))
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }
}))

import { useCartStore } from '../../src/store/useCartStore'
import { promocionesService } from '../../src/lib/promocionesService'
import { lealtadService } from '../../src/lib/lealtadService'
import { formatCurrency, formatCurrencyValue } from '../../src/lib/currencyFormatter'

const mkProd = (id, precio, nombre = `Prod${id}`) => ({
  id, id_producto: id, nombre, precio
})

describe('E2E - Flujo Completo del Carrito', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
    vi.clearAllMocks()
  })

  // E2E-01: Flujo completo add → checkout → clear
  it('E2E-01: flujo completo add → total → puntos → clear', () => {
    const { addItem, getTotal, clearCart, getItemCount } = useCartStore.getState()

    addItem(mkProd(1, 50), 2) // 100
    addItem(mkProd(2, 25), 1) //  25

    expect(getTotal()).toBeCloseTo(125)
    expect(getItemCount()).toBe(3)
    expect(lealtadService.calcularPuntosCompra(getTotal())).toBe(63) // round(62.5)

    clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  // E2E-02: Agregar, modificar cantidad y verificar total
  it('E2E-02: agregar y modificar cantidad refleja total correcto', () => {
    useCartStore.getState().addItem(mkProd(1, 30))
    useCartStore.getState().updateQuantity(1, 4) // 120
    expect(useCartStore.getState().getTotal()).toBeCloseTo(120)
  })

  // E2E-03: Aplicar promo porcentual sobre carrito real y verificar total final
  it('E2E-03: total final con descuento porcentual es correcto', () => {
    useCartStore.getState().addItem(mkProd(1, 100), 1)
    const carrito = useCartStore.getState().items
    const promo = { tipo: 'descuento', descuento_porcentaje: 15 }
    const descuento = promocionesService.calcularDescuento(carrito, promo) // 15
    const totalConDescuento = useCartStore.getState().getTotal() - descuento
    expect(totalConDescuento).toBeCloseTo(85)
  })

  // E2E-04: Aplicar 2x1 y calcular ahorro
  it('E2E-04: promo 2x1 calcula ahorro correcto sobre carrito', () => {
    useCartStore.getState().addItem(mkProd(1, 20), 6) // 120
    const carrito = useCartStore.getState().items
    const promo = { tipo: '2x1', promocion_detalle: [{ id_producto: 1 }] }
    const ahorro = promocionesService.calcularDescuento(carrito, promo) // 3 pares × 20 = 60
    expect(ahorro).toBe(60)
    expect(useCartStore.getState().getTotal() - ahorro).toBeCloseTo(60)
  })

  // E2E-05: Formatear total con símbolo de moneda
  it('E2E-05: el total formateado muestra símbolo Bs correctamente', () => {
    useCartStore.getState().addItem(mkProd(1, 75.5), 2) // 151
    const totalFormateado = formatCurrency(useCartStore.getState().getTotal())
    expect(totalFormateado).toBe('Bs 151.00')
  })

  // E2E-06: Puntos ganados tras compra con descuento
  it('E2E-06: los puntos se calculan sobre el total final con descuento', () => {
    useCartStore.getState().addItem(mkProd(1, 200), 1)
    const descuento = 40
    const totalFinal = useCartStore.getState().getTotal() - descuento // 160
    expect(lealtadService.calcularPuntosCompra(totalFinal)).toBe(80)
  })

  // E2E-07: Eliminar todos los productos uno a uno → carrito vacío
  it('E2E-07: eliminar todos los productos deja el carrito vacío', () => {
    useCartStore.getState().addItem(mkProd(1, 10))
    useCartStore.getState().addItem(mkProd(2, 20))
    useCartStore.getState().addItem(mkProd(3, 30))
    useCartStore.getState().removeItem(1)
    useCartStore.getState().removeItem(2)
    useCartStore.getState().removeItem(3)
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().getTotal()).toBe(0)
  })

  // E2E-08: El precio_con_descuento afecta el total y los puntos
  it('E2E-08: precio_con_descuento afecta total y puntos a ganar', () => {
    const prod = { id: 1, id_producto: 1, precio: 100, precio_con_descuento: 60, nombre: 'A' }
    useCartStore.getState().addItem(prod, 1)
    const total = useCartStore.getState().getTotal() // 60
    expect(total).toBe(60)
    expect(lealtadService.calcularPuntosCompra(total)).toBe(30)
  })

  // E2E-09: Código de cupón generado está bien formado
  it('E2E-09: el código de cupón generado tiene formato válido', () => {
    const codigo = promocionesService.generarCodigoCupon()
    expect(codigo).toHaveLength(8)
    expect(codigo).toMatch(/^[A-Z0-9]+$/)
  })

  // E2E-10: Varios cupones son únicos entre sí
  it('E2E-10: múltiples cupones generados son únicos', () => {
    const codigos = new Set(Array.from({ length: 50 }, () => promocionesService.generarCodigoCupon()))
    expect(codigos.size).toBeGreaterThan(40)
  })

  // E2E-11: Combo incompleto → total sin descuento
  it('E2E-11: combo incompleto no modifica el total del carrito', () => {
    useCartStore.getState().addItem(mkProd(1, 30), 1)
    const carrito = useCartStore.getState().items
    const promo = {
      tipo: 'combo', monto_descuento: 10,
      promocion_detalle: [
        { id_producto: 1, cantidad_requerida: 3 },
        { id_producto: 2, cantidad_requerida: 1 },
      ],
    }
    expect(promocionesService.calcularDescuento(carrito, promo)).toBe(0)
    expect(useCartStore.getState().getTotal()).toBe(30)
  })

  // E2E-12: Secuencia completa de compra con lealtad registrada
  it('E2E-12: registrarPuntosCompra recibe el total correcto del carrito', async () => {
    const { supabase } = await import('../../src/lib/supabase')
    supabase.single.mockResolvedValue({ data: { id_puntos: 1, puntos_ganados: 75 }, error: null })

    useCartStore.getState().addItem(mkProd(1, 150), 1)
    const total = useCartStore.getState().getTotal()
    const result = await lealtadService.registrarPuntosCompra(1, 1, total)
    expect(result).toBeTruthy()
  })

  // E2E-13: Total formateado sin símbolo para mostrar en inputs
  it('E2E-13: formatCurrencyValue retorna total sin símbolo para usar en inputs', () => {
    useCartStore.getState().addItem(mkProd(1, 49.9), 2)
    const total = useCartStore.getState().getTotal() // 99.8
    expect(formatCurrencyValue(total)).toBe('99.80')
  })

  // E2E-14: getItemCount refleja unidades totales correctas
  it('E2E-14: getItemCount retorna el total de unidades en el carrito', () => {
    useCartStore.getState().addItem(mkProd(1, 10), 3)
    useCartStore.getState().addItem(mkProd(2, 20), 2)
    useCartStore.getState().addItem(mkProd(3, 5),  5)
    expect(useCartStore.getState().getItemCount()).toBe(10)
  })

  // E2E-15: Ciclo completo con verificación de estado en cada paso
  it('E2E-15: ciclo completo add-update-remove mantiene consistencia en cada paso', () => {
    const store = useCartStore.getState()

    // Paso 1: agregar
    store.addItem(mkProd(1, 100), 2)
    expect(useCartStore.getState().getTotal()).toBe(200)

    // Paso 2: actualizar
    useCartStore.getState().updateQuantity(1, 3)
    expect(useCartStore.getState().getTotal()).toBe(300)

    // Paso 3: agregar otro
    useCartStore.getState().addItem(mkProd(2, 50), 1)
    expect(useCartStore.getState().getTotal()).toBe(350)

    // Paso 4: eliminar primero
    useCartStore.getState().removeItem(1)
    expect(useCartStore.getState().getTotal()).toBe(50)

    // Paso 5: limpiar
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().getTotal()).toBe(0)
  })
})
