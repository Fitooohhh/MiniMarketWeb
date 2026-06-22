// src/lib/geofencing.js

/**
 * ============================================================================
 * PRINCIPIOS DE PROGRAMACIÓN Y ARQUITECTURA - TEMA 1
 * ============================================================================
 * 
 * 1. ARQUITECTURA EN CAPAS (Layered Architecture):
 *    Este archivo representa la CAPA DE LÓGICA DE NEGOCIO (Services). No manipula 
 *    directamente elementos visuales de la interfaz (Capa de Presentación) ni
 *    ejecuta queries crudos SQL (Capa de Acceso a Datos), sino que encapsula las 
 *    reglas del dominio de geolocalización (Haversine y límites del negocio).
 * 
 * 2. SRP (Single Responsibility Principle - Principio de Responsabilidad Única):
 *    Este módulo tiene la única responsabilidad de gestionar la lógica de validación
 *    de perímetros geográficos (Geo-fencing) y cálculo de distancias terrestres.
 * 
 * 3. DRY (Don't Repeat Yourself - No te repitas):
 *    Centraliza el cálculo matemático de Haversine y decodificación de configuraciones,
 *    eliminando la duplicación de código en múltiples componentes del sistema como
 *    Cajero.jsx, Asistencia.jsx y AsistenciaTab.jsx.
 * 
 * 4. YAGNI (You Aren't Gonna Need It - No lo vas a necesitar):
 *    Se emplea una validación directa usando la API estándar de Geolocalización y
 *    almacenamiento en LocalStorage, sin crear complejos servicios de geolocalización en 
 *    tiempo real ni dependencias de mapas pagadas que excedan el alcance actual.
 * ============================================================================
 */

/**
 * Calcula la distancia en metros entre dos puntos geográficos usando la fórmula de Haversine.
 * @param {number} lat1 - Latitud del primer punto.
 * @param {number} lon1 - Longitud del primer punto.
 * @param {number} lat2 - Latitud del segundo punto.
 * @param {number} lon2 - Longitud del segundo punto.
 * @returns {number} Distancia en metros.
 */
export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Radio de la Tierra en metros
  const phi1 = lat1 * Math.PI / 180
  const phi2 = lat2 * Math.PI / 180
  const deltaPhi = (lat2 - lat1) * Math.PI / 180
  const deltaLambda = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distancia en metros
}

/**
 * Valida si las coordenadas dadas están dentro del radio configurado en localStorage.
 * @param {number} latitud - Latitud actual.
 * @param {number} longitud - Longitud actual.
 * @returns {boolean} true si está en rango, de lo contrario arroja un error.
 */
export function verificarGeofencing(latitud, longitud) {
  const saved = localStorage.getItem('minimarket_geofencing_config')
  if (!saved) return true
  
  try {
    const config = JSON.parse(saved)
    if (!config.latitud || !config.longitud) return true
    
    const distancia = calcularDistancia(config.latitud, config.longitud, latitud, longitud)

    if (distancia > config.radio) {
      throw new Error(`Fuera de rango: estás a ${distancia.toFixed(1)}m. Límite: ${config.radio}m.`)
    }
    return true
  } catch (e) {
    if (e.message.startsWith('Fuera de rango')) {
      throw e
    }
    console.error('Error al validar geofencing:', e)
    return true
  }
}
