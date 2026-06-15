import { describe, it, expect, vi, beforeEach } from 'vitest'

// NOTA: vi.mock se alza al tope del archivo, no puede referenciar variables externas.
// Usamos un objeto mutable compartido mediante closure.
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockOrder = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockUpdate = vi.fn()

const chain = { select: mockSelect, insert: mockInsert, update: mockUpdate, eq: mockEq, order: mockOrder, single: mockSingle, maybeSingle: mockMaybeSingle }

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: vi.fn(() => chain) }
}))

// Importar DESPUÉS del mock
import { supabase } from '../../src/lib/supabase'
import { lealtadService } from '../../src/lib/lealtadService'

const resetChain = () => {
  Object.values(chain).forEach(fn => { fn.mockReset(); fn.mockReturnValue(chain) })
  supabase.from.mockReturnValue(chain)
}

describe('LealtadService (integración) - calcularPuntosCompra', () => {
  it('calcula la mitad del total redondeada (100 → 50)', () => {
    expect(lealtadService.calcularPuntosCompra(100)).toBe(50)
  })
  it('redondea hacia arriba para impares (101 → 51)', () => {
    expect(lealtadService.calcularPuntosCompra(101)).toBe(51)
  })
  it('devuelve 0 para compra de 0', () => {
    expect(lealtadService.calcularPuntosCompra(0)).toBe(0)
  })
  it('maneja montos grandes (1000 → 500)', () => {
    expect(lealtadService.calcularPuntosCompra(1000)).toBe(500)
  })
})

describe('LealtadService (integración) - obtenerProgramaLealtad', () => {
  beforeEach(resetChain)

  it('devuelve el programa activo cuando Supabase responde OK', async () => {
    const programa = { id_programa: 1, nombre: 'Programa VIP', activo: true }
    mockMaybeSingle.mockResolvedValueOnce({ data: programa, error: null })
    const result = await lealtadService.obtenerProgramaLealtad()
    expect(result).toMatchObject({ nombre: 'Programa VIP' })
    expect(supabase.from).toHaveBeenCalledWith('programa_lealtad')
  })

  it('crea un programa por defecto si no hay programa activo', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockSingle.mockResolvedValueOnce({ data: { nombre: 'Programa General de Lealtad', activo: true }, error: null })
    const result = await lealtadService.obtenerProgramaLealtad()
    expect(result).toMatchObject({ nombre: 'Programa General de Lealtad' })
  })

  it('devuelve fallback si Supabase falla con otros códigos', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'Permission denied' } })
    const result = await lealtadService.obtenerProgramaLealtad()
    expect(result).toMatchObject({ nombre: 'Programa General de Lealtad (Fallback)' })
  })
})

describe('LealtadService (integración) - obtenerNivelesCliente', () => {
  beforeEach(resetChain)

  it('devuelve los niveles cuando Supabase responde OK', async () => {
    const niveles = [
      { id_nivel: 1, nombre: 'Bronce', puntos_minimos: 0 },
      { id_nivel: 2, nombre: 'Plata', puntos_minimos: 500 },
      { id_nivel: 3, nombre: 'Oro', puntos_minimos: 1000 }
    ]
    mockOrder.mockResolvedValueOnce({ data: niveles, error: null })
    const result = await lealtadService.obtenerNivelesCliente()
    expect(result).toHaveLength(3)
    expect(result[0].nombre).toBe('Bronce')
  })

  it('lanza error si Supabase falla', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'Connection error' } })
    await expect(lealtadService.obtenerNivelesCliente()).rejects.toBeTruthy()
  })
})

describe('LealtadService (integración) - registrarPuntosCompra', () => {
  beforeEach(resetChain)

  it('falla correctamente si Supabase devuelve error al insertar', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id_programa: 1, puntos_por_dolar: 1 }, error: null })
    mockSingle
      .mockResolvedValueOnce({ data: { id_cliente: 42, puntos_acumulados: 100 }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'DB constraint violation' } })
    await expect(lealtadService.registrarPuntosCompra(42, 100, 150)).rejects.toBeTruthy()
  })

  it('llama a supabase.from("puntos_cliente") al registrar puntos', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id_programa: 1, puntos_por_dolar: 1 }, error: null })
    mockSingle
      .mockResolvedValueOnce({ data: { id_cliente: 42, puntos_acumulados: 100 }, error: null })
      .mockResolvedValueOnce({ data: { id_puntos: 1, puntos_ganados: 75, id_cliente: 42 }, error: null })
    mockOrder.mockResolvedValueOnce({ data: [], error: null })
    await lealtadService.registrarPuntosCompra(42, 100, 150)
    expect(supabase.from).toHaveBeenCalledWith('puntos_cliente')
  })
})
