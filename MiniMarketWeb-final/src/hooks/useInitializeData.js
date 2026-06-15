import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import * as dataService from '../lib/dataService'

/**
 * Hook para inicializar y precargar datos críticos de la aplicación
 * Se ejecuta cuando el usuario inicia sesión
 */
export const useInitializeData = () => {
  const { profile } = useAuthStore()

  const initializeAppData = useCallback(async () => {
    if (!profile) return

    try {
      // Precargar datos según el rol del usuario
      if (profile.rol === 'cliente') {
        // Precargar datos del cliente
        await Promise.all([
          dataService.loadProductos(),
          dataService.loadPromociones({ activas: true }),
          dataService.loadVentas({ id_cliente: profile.id_cliente }),
        ])
      } else if (profile.rol === 'empleado' || profile.rol === 'admin') {
        // Precargar datos del empleado
        await Promise.all([
          dataService.loadVentas({ id_empleado: profile.id_empleado }),
          dataService.loadRepartos({ id_empleado: profile.id_empleado }),
          dataService.loadEmpleados(),
          dataService.loadProductos(),
        ])

        // Si es admin, precargar más datos
        if (profile.rol === 'admin') {
          await Promise.all([
            dataService.loadClientes(),
            dataService.loadUsuarios(),
            dataService.loadOrdenesCompra(),
            dataService.loadProveedores(),
          ])
        }
      } else if (profile.rol === 'repartidor') {
        // Precargar datos del repartidor
        await Promise.all([
          dataService.loadRepartos({ id_empleado: profile.id_empleado }),
        ])
      }
    } catch (error) {
      console.error('Error initializing app data:', error)
    }
  }, [profile])

  useEffect(() => {
    initializeAppData()
  }, [initializeAppData])

  return { initializeAppData }
}
