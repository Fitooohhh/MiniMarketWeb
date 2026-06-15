import { useState, useCallback } from 'react'
import * as dataService from '../lib/dataService'

/**
 * Hook personalizado para cargar datos de forma consistente
 * Maneja loading, error y data automáticamente
 */
export const useDataLoader = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadData = useCallback(async (loaderFunction, ...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await loaderFunction(...args)
      
      if (result.error) {
        setError(result.error)
        return { data: result.data, error: result.error }
      }
      
      return { data: result.data, error: null }
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar datos'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    loadData,
    clearError,
    // Métodos directos para cada tipo de dato
    loadProductos: (filtros) => loadData(dataService.loadProductos, filtros),
    loadPromociones: (filtros) => loadData(dataService.loadPromociones, filtros),
    loadVentas: (filtros) => loadData(dataService.loadVentas, filtros),
    loadVentaById: (id) => loadData(dataService.loadVentaById, id),
    loadDetallesVenta: (id_venta) => loadData(dataService.loadDetallesVenta, id_venta),
    loadRepartos: (filtros) => loadData(dataService.loadRepartos, filtros),
    loadEmpleados: (filtros) => loadData(dataService.loadEmpleados, filtros),
    loadClientes: (filtros) => loadData(dataService.loadClientes, filtros),
    loadAsistencias: (filtros) => loadData(dataService.loadAsistencias, filtros),
    loadInventario: (filtros) => loadData(dataService.loadInventario, filtros),
    loadOrdenesCompra: (filtros) => loadData(dataService.loadOrdenesCompra, filtros),
    loadProveedores: () => loadData(dataService.loadProveedores),
    loadNotificaciones: (filtros) => loadData(dataService.loadNotificaciones, filtros),
    loadDevoluciones: (filtros) => loadData(dataService.loadDevoluciones, filtros),
    loadHorarios: (filtros) => loadData(dataService.loadHorarios, filtros),
    loadUsuarios: () => loadData(dataService.loadUsuarios),
    loadEstadisticas: () => loadData(dataService.loadEstadisticas),
  }
}
