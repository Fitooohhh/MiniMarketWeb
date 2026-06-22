import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatCurrencyNoDecimals,
  formatCurrencyValue
} from '../../src/lib/currencyFormatter'

/**
 * ============================================================================
 * PRUEBAS UNITARIAS (TEMA 1)
 * ============================================================================
 * 
 * Permiten comprobar matemáticamente que los principios SRP y DRY funcionan:
 * 1. Garantiza que la única responsabilidad (SRP) del formateador retorne siempre
 *    los formatos correctos bajo cualquier escenario (monto nulo, decimales, negativos).
 * 2. Comprueba que el cambio en un solo lugar (DRY) no rompa ninguna otra
 *    parte dependiente del sistema.
 * ============================================================================
 */
describe('currencyFormatter - Pruebas Unitarias', () => {

  // CASO 1: Formatear monto positivo con símbolo
  it('U-01: formatCurrency formatea monto positivo con símbolo Bs', () => {
    expect(formatCurrency(100)).toBe('Bs 100.00')
  })

  // CASO 2: Formatear monto sin símbolo
  it('U-02: formatCurrency retorna solo el número cuando includeSymbol es false', () => {
    expect(formatCurrency(50, false)).toBe('50.00')
  })

  // CASO 3: Monto null retorna Bs 0.00
  it('U-03: formatCurrency retorna Bs 0.00 cuando el monto es null', () => {
    expect(formatCurrency(null)).toBe('Bs 0.00')
  })

  // CASO 4: Monto undefined retorna Bs 0.00
  it('U-04: formatCurrency retorna Bs 0.00 cuando el monto es undefined', () => {
    expect(formatCurrency(undefined)).toBe('Bs 0.00')
  })

  // CASO 5: Formatear monto decimal
  it('U-05: formatCurrency maneja decimales correctamente', () => {
    expect(formatCurrency(19.5)).toBe('Bs 19.50')
  })

  // CASO 6: Monto cero
  it('U-06: formatCurrency maneja monto cero', () => {
    expect(formatCurrency(0)).toBe('Bs 0.00')
  })

  // CASO 7: formatCurrencyNoDecimals redondea correctamente
  it('U-07: formatCurrencyNoDecimals redondea y elimina decimales', () => {
    expect(formatCurrencyNoDecimals(99.7)).toBe('Bs 100')
  })

  // CASO 8: formatCurrencyNoDecimals con null
  it('U-08: formatCurrencyNoDecimals retorna Bs 0 con null', () => {
    expect(formatCurrencyNoDecimals(null)).toBe('Bs 0')
  })

  // CASO 9: formatCurrencyValue retorna sin símbolo
  it('U-09: formatCurrencyValue retorna valor sin símbolo Bs', () => {
    expect(formatCurrencyValue(75.5)).toBe('75.50')
  })

  // CASO 10: Monto negativo
  it('U-10: formatCurrency maneja montos negativos', () => {
    expect(formatCurrency(-10)).toBe('Bs -10.00')
  })

  // CASO 11: Monto string numérico
  it('U-11: formatCurrency convierte string numérico correctamente', () => {
    expect(formatCurrency('25.99')).toBe('Bs 25.99')
  })

  // CASO 12: Monto muy grande
  it('U-12: formatCurrency maneja montos grandes', () => {
    expect(formatCurrency(1000000)).toBe('Bs 1000000.00')
  })

  // CASO 13: formatCurrencyNoDecimals redondea hacia abajo
  it('U-13: formatCurrencyNoDecimals redondea hacia abajo cuando decimal < 0.5', () => {
    expect(formatCurrencyNoDecimals(10.4)).toBe('Bs 10')
  })

  // CASO 14: formatCurrencyNoDecimals con undefined
  it('U-14: formatCurrencyNoDecimals retorna Bs 0 con undefined', () => {
    expect(formatCurrencyNoDecimals(undefined)).toBe('Bs 0')
  })

  // CASO 15: formatCurrency con dos decimales exactos
  it('U-15: formatCurrency muestra exactamente dos decimales', () => {
    expect(formatCurrency(10)).toBe('Bs 10.00')
    expect(formatCurrency(10.1)).toBe('Bs 10.10')
    expect(formatCurrency(10.12)).toBe('Bs 10.12')
  })
})
