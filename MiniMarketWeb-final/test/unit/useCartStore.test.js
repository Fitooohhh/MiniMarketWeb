import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() }
}))

// Mock zustand persist
vi.mock('zustand/middleware', () => ({
  persist: (fn) => fn
}))

import { useCartStore } from '../../src/store/useCartStore'

const producto1 = { id: 1, nombre: 'Leche', precio: 10.0, imagen_url: null }
const producto2 = { id: 2, nombre: 'Pan', precio: 5.5, imagen_url: null }
const productoConDescuento = { id: 3, nombre: 'Yogurt', precio: 12.0, precio_con_descuento: 9.0 }

describe('useCartStore - Pruebas Unitarias', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
  })

  // CASO 1: Agregar producto nuevo al carrito
  it('U-01: addItem agrega un producto nuevo correctamente', () => {
    useCartStore.getState().addItem(producto1)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe(1)
    expect(items[0].cantidad).toBe(1)
  })

  // CASO 2: Agregar producto existente incrementa cantidad
  it('U-02: addItem incrementa la cantidad si el producto ya existe', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().addItem(producto1)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].cantidad).toBe(2)
  })

  // CASO 3: Agregar con cantidad personalizada
  it('U-03: addItem agrega con cantidad personalizada', () => {
    useCartStore.getState().addItem(producto1, 3)
    expect(useCartStore.getState().items[0].cantidad).toBe(3)
  })

  // CASO 4: Eliminar producto del carrito
  it('U-04: removeItem elimina el producto del carrito', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().removeItem(1)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  // CASO 5: Limpiar carrito
  it('U-05: clearCart vacía el carrito completamente', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().addItem(producto2)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  // CASO 6: Actualizar cantidad
  it('U-06: updateQuantity actualiza la cantidad del producto', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().updateQuantity(1, 5)
    expect(useCartStore.getState().items[0].cantidad).toBe(5)
  })

  // CASO 7: updateQuantity con 0 elimina el producto
  it('U-07: updateQuantity con 0 elimina el producto', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().updateQuantity(1, 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  // CASO 8: getTotal calcula el total correctamente
  it('U-08: getTotal suma los precios por cantidad', () => {
    useCartStore.getState().addItem(producto1, 2)  // 10 * 2 = 20
    useCartStore.getState().addItem(producto2, 1)  // 5.5 * 1 = 5.5
    expect(useCartStore.getState().getTotal()).toBeCloseTo(25.5)
  })

  // CASO 9: getTotal usa precio_con_descuento si existe
  it('U-09: getTotal usa precio_con_descuento si está disponible', () => {
    useCartStore.getState().addItem(productoConDescuento, 2)
    expect(useCartStore.getState().getTotal()).toBeCloseTo(18.0)
  })

  // CASO 10: getTotal con carrito vacío retorna 0
  it('U-10: getTotal retorna 0 con carrito vacío', () => {
    expect(useCartStore.getState().getTotal()).toBe(0)
  })

  // CASO 11: getItemCount retorna total de unidades
  it('U-11: getItemCount retorna la suma de cantidades', () => {
    useCartStore.getState().addItem(producto1, 3)
    useCartStore.getState().addItem(producto2, 2)
    expect(useCartStore.getState().getItemCount()).toBe(5)
  })

  // CASO 12: getItemCount con carrito vacío retorna 0
  it('U-12: getItemCount retorna 0 con carrito vacío', () => {
    expect(useCartStore.getState().getItemCount()).toBe(0)
  })

  // CASO 13: Agregar múltiples productos distintos
  it('U-13: addItem mantiene productos distintos separados', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().addItem(producto2)
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  // CASO 14: removeItem no afecta otros productos
  it('U-14: removeItem solo elimina el producto especificado', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().addItem(producto2)
    useCartStore.getState().removeItem(1)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe(2)
  })

  // CASO 15: updateQuantity con cantidad negativa elimina el producto
  it('U-15: updateQuantity con cantidad negativa elimina el producto', () => {
    useCartStore.getState().addItem(producto1)
    useCartStore.getState().updateQuantity(1, -1)
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
