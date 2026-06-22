/**
 * ============================================================================
 * PRINCIPIOS DE PROGRAMACIÓN - TEMA 1
 * ============================================================================
 * 
 * 1. SRP (Single Responsibility Principle - Principio de Responsabilidad Única):
 *    Esta utilidad tiene la única y exclusiva responsabilidad de formatear valores
 *    numéricos a la representación de moneda nacional (Bolivianos - Bs). Si las reglas
 *    de presentación de moneda cambian, esta es la única clase/módulo que debe ser modificado.
 * 
 * 2. DRY (Don't Repeat Yourself - No te repitas):
 *    Centraliza el formato visual de los precios en todo el sistema. Evita duplicar 
 *    operaciones matemáticas de redondeo y concatenación de cadenas de texto en los 
 *    distintos componentes de la interfaz de usuario (como el Catálogo de Clientes, etc.).
 * ============================================================================
 */


/**
 * Formatea un número como moneda en Bolivianos
 * @param {number} amount - Cantidad a formatear
 * @param {boolean} includeSymbol - Incluir símbolo "Bs" (default: true)
 * @returns {string} Cantidad formateada
 */
export const formatCurrency = (amount, includeSymbol = true) => {
  if (amount === null || amount === undefined) {
    return includeSymbol ? 'Bs 0.00' : '0.00'
  }

  const formatted = parseFloat(amount).toFixed(2)
  return includeSymbol ? `Bs ${formatted}` : formatted
}

/**
 * Formatea un número como moneda sin decimales
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada
 */
export const formatCurrencyNoDecimals = (amount) => {
  if (amount === null || amount === undefined) {
    return 'Bs 0'
  }

  const formatted = Math.round(parseFloat(amount))
  return `Bs ${formatted}`
}

/**
 * Obtiene solo el valor numérico formateado
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada sin símbolo
 */
export const formatCurrencyValue = (amount) => {
  return formatCurrency(amount, false)
}
