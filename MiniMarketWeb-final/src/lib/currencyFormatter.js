/**
 * Utilidades para formatear moneda en Bolivianos (Bs)
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
