import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // Agregar producto al carrito
      addItem: (producto, cantidad = 1) => {
        const items = get().items
        const existingItem = items.find(item => item.id === producto.id)
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === producto.id
                ? { ...item, cantidad: item.cantidad + cantidad }
                : item
            )
          })
          toast.success('Cantidad actualizada en el carrito')
        } else {
          set({
            items: [...items, { ...producto, cantidad }]
          })
          toast.success('Producto agregado al carrito')
        }
      },
      
      // Actualizar cantidad
      updateQuantity: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId)
          return
        }
        
        set({
          items: get().items.map(item =>
            item.id === productoId
              ? { ...item, cantidad }
              : item
          )
        })
      },
      
      // Eliminar producto
      removeItem: (productoId) => {
        set({
          items: get().items.filter(item => item.id !== productoId)
        })
        toast.success('Producto eliminado del carrito')
      },
      
      // Limpiar carrito
      clearCart: () => {
        set({ items: [] })
      },
      
      // Obtener total
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const precio = item.precio_con_descuento || item.precio
          return total + (precio * item.cantidad)
        }, 0)
      },
      
      // Obtener cantidad de items
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.cantidad, 0)
      }
    }),
    {
      name: 'cart-storage'
    }
  )
)
