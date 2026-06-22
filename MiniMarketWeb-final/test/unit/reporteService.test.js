import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  }
}))

import { supabase } from '../../src/lib/supabase'
import { reporteService } from '../../src/lib/reporteService'

describe('reporteService - Pruebas Unitarias de Lógica de Negocio (Reportes)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('R-01: obtenerDatosProductos calcula correctamente el estado Vencido o No de los productos', async () => {
    const mockProductos = [
      { id_producto: 1, codigo: 'A1', nombre: 'Leche Vencida', precio: 5, stock: 10, fecha_vencimiento: '2025-01-01' },
      { id_producto: 2, codigo: 'A2', nombre: 'Yogurt Válido', precio: 8, stock: 50, fecha_vencimiento: '2030-12-31' },
      { id_producto: 3, codigo: 'A3', nombre: 'Pan Sin Vencimiento', precio: 2, stock: 20, fecha_vencimiento: null }
    ]

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProductos, error: null })
    })

    const { data, error } = await reporteService.obtenerDatosProductos()

    expect(error).toBeNull()
    expect(data).toHaveLength(3)

    // Leche vencida (2025-01-01)
    expect(data[0].vencido).toBe('Sí (Vencido)')
    // Yogurt válido (2030-12-31)
    expect(data[1].vencido).toBe('No')
    // Pan sin vencimiento
    expect(data[2].vencido).toBe('No')
    expect(data[2].fecha_vencimiento).toBe('Sin fecha')
  })

  it('R-02: obtenerDatosVentasYRepartos filtra correctamente las ventas por la fecha del día actual', async () => {
    const hoyStr = new Date().toISOString().split('T')[0]
    
    const mockVentas = [
      { id_venta: 101, fecha: `${hoyStr}T10:00:00Z`, total: 100, tipo_entrega: 'domicilio', direccion_envio: 'Av Principal 123' },
      { id_venta: 102, fecha: '2025-01-01T14:30:00Z', total: 45, tipo_entrega: 'tienda' } // Venta del año pasado
    ]

    vi.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'venta') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockVentas, error: null })
        }
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      }
    })

    const { data, error } = await reporteService.obtenerDatosVentasYRepartos()

    expect(error).toBeNull()
    // Solo debe clasificar la venta del día de hoy
    expect(data).toHaveLength(1)
    expect(data[0].id_venta).toBe(101)
  })
})
