import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockGte = vi.fn()

const chain = { select: mockSelect, insert: mockInsert, update: mockUpdate, eq: mockEq, order: mockOrder, gte: mockGte, single: mockSingle }

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: vi.fn(() => chain) }
}))

import { supabase } from '../../src/lib/supabase'
import { devolucionesService } from '../../src/lib/devolucionesService'

const resetChain = () => {
  Object.values(chain).forEach(fn => { fn.mockReset(); fn.mockReturnValue(chain) })
  supabase.from.mockReturnValue(chain)
}

describe('DevolucionesService (integración) - obtenerPoliticasDevolucion', () => {
  beforeEach(resetChain)

  it('devuelve políticas activas cuando Supabase responde OK', async () => {
    const politicas = [
      { id_politica: 1, nombre: 'Estándar', dias_maximos: 7, activa: true },
      { id_politica: 2, nombre: 'Premium', dias_maximos: 30, activa: true }
    ]
    mockOrder.mockResolvedValueOnce({ data: politicas, error: null })
    const result = await devolucionesService.obtenerPoliticasDevolucion()
    expect(result).toHaveLength(2)
    expect(result[0].nombre).toBe('Estándar')
    expect(supabase.from).toHaveBeenCalledWith('politica_devolucion')
  })

  it('lanza error si Supabase falla', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } })
    await expect(devolucionesService.obtenerPoliticasDevolucion()).rejects.toBeTruthy()
  })
})

describe('DevolucionesService (integración) - crearPoliticaDevolucion', () => {
  beforeEach(resetChain)

  it('crea una política y devuelve el registro insertado', async () => {
    const nueva = { nombre: 'Express', dias_maximos: 3, activa: true }
    const insertado = { id_politica: 10, ...nueva }
    mockSingle.mockResolvedValueOnce({ data: insertado, error: null })
    const result = await devolucionesService.crearPoliticaDevolucion(nueva)
    expect(result).toMatchObject({ id_politica: 10, nombre: 'Express' })
  })

  it('lanza error si la inserción falla', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Violación de restricción única' } })
    await expect(
      devolucionesService.crearPoliticaDevolucion({ nombre: 'Duplicado', dias_maximos: 7 })
    ).rejects.toBeTruthy()
  })
})

describe('DevolucionesService (integración) - crearSolicitudDevolucion (flujo de error)', () => {
  beforeEach(resetChain)

  it('lanza error si el detalle de venta no existe en Supabase', async () => {
    // Simular que no se encontró el detalle de venta
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
    await expect(
      devolucionesService.crearSolicitudDevolucion({
        id_detalle_venta: 999,
        cantidad_devuelta: 1,
        motivo: 'Producto dañado',
        id_cliente: 5
      })
    ).rejects.toThrow('Detalle de venta no encontrado')
  })

  it('lanza error si la venta no pertenece al cliente', async () => {
    // Simular que el detalle encontrado pertenece a otro cliente
    const detalleOtroCliente = {
      id_detalle_venta: 1,
      cantidad: 2,
      precio_unitario: 50,
      venta: { id_venta: 20, id_cliente: 99, fecha: new Date().toISOString() },
      producto: { nombre: 'Leche' }
    }
    mockSingle.mockResolvedValueOnce({ data: detalleOtroCliente, error: null })
    await expect(
      devolucionesService.crearSolicitudDevolucion({
        id_detalle_venta: 1,
        cantidad_devuelta: 1,
        motivo: 'Producto dañado',
        id_cliente: 5 // distinto al id_cliente: 99 de la venta
      })
    ).rejects.toThrow('Esta venta no pertenece al cliente')
  })

  it('lanza error si el período de devolución ha expirado', async () => {
    const fechaAntigua = new Date()
    fechaAntigua.setDate(fechaAntigua.getDate() - 60) // 60 días atrás

    const detalle = {
      id_detalle_venta: 1,
      cantidad: 2,
      precio_unitario: 50,
      venta: { id_venta: 20, id_cliente: 5, fecha: fechaAntigua.toISOString() },
      producto: { nombre: 'Arroz' }
    }
    // Primer single: detalle de venta
    mockSingle.mockResolvedValueOnce({ data: detalle, error: null })
    // obtenerPoliticasDevolucion usa .order()
    mockOrder.mockResolvedValueOnce({
      data: [{ id_politica: 1, nombre: 'Estándar', dias_maximos: 7, activa: true }],
      error: null
    })

    await expect(
      devolucionesService.crearSolicitudDevolucion({
        id_detalle_venta: 1,
        cantidad_devuelta: 1,
        motivo: 'Arrepentimiento',
        id_cliente: 5
      })
    ).rejects.toThrow('período de devolución ha expirado')
  })
})
