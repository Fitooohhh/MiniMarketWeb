import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calcularDistancia, verificarGeofencing } from '../../src/lib/geofencing'

/**
 * ============================================================================
 * PRUEBAS UNITARIAS DE GEOFENCING (TEMA 1)
 * ============================================================================
 * 
 * Permiten comprobar matemáticamente que los principios SRP y DRY funcionan:
 * 1. SRP: El módulo tiene la única responsabilidad de calcular distancias y
 *    validar si un usuario se encuentra dentro del rango geográfico permitido.
 * 2. DRY: Evita duplicar la compleja fórmula de Haversine y la lógica de validación
 *    en múltiples componentes (como Asistencia.jsx, AsistenciaTab.jsx, Cajero.jsx).
 * ============================================================================
 */
describe('geofencing - Pruebas Unitarias', () => {
  
  beforeEach(() => {
    // Limpiar localStorage antes de cada prueba
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // CASO 1: Calcular distancia entre dos puntos idénticos
  it('U-16: calcularDistancia retorna 0 para el mismo punto', () => {
    const lat = -16.5000
    const lon = -68.1500
    const dist = calcularDistancia(lat, lon, lat, lon)
    expect(dist).toBeCloseTo(0, 1)
  })

  // CASO 2: Calcular distancia conocida
  it('U-17: calcularDistancia calcula correctamente la distancia de Haversine', () => {
    // Coordenadas aproximadas en La Paz, Bolivia
    const lat1 = -16.5000
    const lon1 = -68.1500
    // Punto a ~111 metros al norte
    const lat2 = -16.4990
    const lon2 = -68.1500
    
    const dist = calcularDistancia(lat1, lon1, lat2, lon2)
    // 0.001 grados de latitud es aproximadamente 111 metros
    expect(dist).toBeGreaterThan(110)
    expect(dist).toBeLessThan(112)
  })

  // CASO 3: verificarGeofencing sin configuración en localStorage
  it('U-18: verificarGeofencing retorna true si no hay configuración guardada', () => {
    vi.spyOn(localStorage, 'getItem').mockReturnValue(null)
    const result = verificarGeofencing(-16.5000, -68.1500)
    expect(result).toBe(true)
  })

  // CASO 4: verificarGeofencing dentro del rango
  it('U-19: verificarGeofencing retorna true si está dentro del radio permitido', () => {
    const configMock = JSON.stringify({
      latitud: -16.5000,
      longitud: -68.1500,
      radio: 200 // 200 metros
    })
    vi.spyOn(localStorage, 'getItem').mockReturnValue(configMock)
    
    // Punto a ~111 metros, dentro del rango de 200m
    const result = verificarGeofencing(-16.4990, -68.1500)
    expect(result).toBe(true)
  })

  // CASO 5: verificarGeofencing fuera del rango arroja error
  it('U-20: verificarGeofencing lanza un error explicativo si está fuera del radio permitido', () => {
    const configMock = JSON.stringify({
      latitud: -16.5000,
      longitud: -68.1500,
      radio: 50 // 50 metros
    })
    vi.spyOn(localStorage, 'getItem').mockReturnValue(configMock)
    
    // Punto a ~111 metros, fuera del rango de 50m
    expect(() => verificarGeofencing(-16.4990, -68.1500)).toThrow(/Fuera de rango/)
  })
})
