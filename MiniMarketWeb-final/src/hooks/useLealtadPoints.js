import { useCallback } from 'react'
import { lealtadService } from '../lib/lealtadService'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

export const useLealtadPoints = () => {
  const { profile } = useAuthStore()

  // Registrar puntos automáticamente al completar una compra
  const registrarPuntosCompra = useCallback(async (idVenta, totalCompra) => {
    if (!profile?.id_cliente) {
      console.warn('No hay cliente autenticado para registrar puntos')
      return
    }

    try {
      const puntosGanados = lealtadService.calcularPuntosCompra(totalCompra)
      
      // Registrar los puntos en la base de datos
      await lealtadService.registrarPuntosCompra(
        profile.id_cliente,
        idVenta,
        totalCompra
      )

      // Mostrar notificación al cliente
      toast.success(`¡Felicidades! Has ganado ${puntosGanados} puntos por tu compra`, {
        duration: 5000,
        icon: '⭐'
      })

      return puntosGanados
    } catch (error) {
      console.error('Error al registrar puntos de lealtad:', error)
      toast.error('No se pudieron registrar los puntos de lealtad')
      throw error
    }
  }, [profile?.id_cliente])

  // Calcular puntos que se ganarán por una compra
  const calcularPuntosFuturos = useCallback((totalCompra) => {
    return lealtadService.calcularPuntosCompra(totalCompra)
  }, [])

  return {
    registrarPuntosCompra,
    calcularPuntosFuturos
  }
}
