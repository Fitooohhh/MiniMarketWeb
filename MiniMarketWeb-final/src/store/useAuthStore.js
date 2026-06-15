import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: false,
      
      // Inicializar sesión
      initialize: async () => {
        set({ loading: true })
        try {
          // Verificar si hay sesión guardada en localStorage
          const savedUser = localStorage.getItem('auth-storage')
          if (savedUser) {
            const { state } = JSON.parse(savedUser)
            if (state?.user && state?.profile) {
              set({ user: state.user, profile: state.profile, loading: false })
              return
            }
          }
          set({ user: null, profile: null, loading: false })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ loading: false })
        }
      },
      
      // Login
      signIn: async (usuario, password) => {
        try {
          // Verificar credenciales en la tabla usuario
          const { data: userData, error: userError } = await supabase
            .from('usuario')
            .select('*')
            .eq('usuario', usuario)
            .eq('contrasena', password)
            .single()
          
          if (userError || !userData) {
            throw new Error('Usuario o contraseña incorrectos')
          }
          
          // Normalizar el rol a minúsculas
          userData.rol = userData.rol.toLowerCase()
          
          // Obtener datos adicionales según el rol usando id_usuario
          let profile = { ...userData }
          
          if (userData.rol === 'empleado' || userData.rol === 'admin' || userData.rol === 'repartidor') {
            // Buscar empleado por id_usuario
            const { data: empleadoData } = await supabase
              .from('empleado')
              .select('*')
              .eq('id_usuario', userData.id_usuario)
              .maybeSingle()
            
            if (empleadoData) {
              // Mantener el rol del usuario, agregar datos del empleado
              profile = { ...empleadoData, ...userData }
            }
          } else if (userData.rol === 'cliente') {
            // Buscar cliente por id_usuario
            const { data: clienteData } = await supabase
              .from('cliente')
              .select('*')
              .eq('id_usuario', userData.id_usuario)
              .maybeSingle()
            
            if (clienteData) {
              // Mantener el rol del usuario, agregar datos del cliente
              profile = { ...clienteData, ...userData }
            }
          }
          
          console.log('SignIn - userData:', userData)
          console.log('SignIn - profile final:', profile)
          
          set({ user: userData, profile })
          toast.success(`¡Bienvenido ${userData.usuario}!`)
          return { success: true, profile }
        } catch (error) {
          console.error('Error en signIn:', error)
          toast.error(error.message || 'Error al iniciar sesión')
          return { success: false, error: error.message }
        }
      },
      
      // Registro de cliente
      signUp: async (usuario, password, nombre, telefono, direccion, ci_ruc) => {
        try {
          // Crear usuario en tabla usuario
          const { data: userData, error: userError } = await supabase
            .from('usuario')
            .insert([
              {
                usuario,
                contrasena: password,
                rol: 'cliente'
              }
            ])
            .select()
            .single()
          
          if (userError) throw userError
          
          // Crear cliente en tabla cliente con la relación id_usuario
          const { data: clienteData, error: clienteError } = await supabase
            .from('cliente')
            .insert([
              {
                nombre,
                tipo: 'Regular',
                ci_ruc: ci_ruc || '9999999999',
                direccion,
                telefono,
                credito: 0,
                id_usuario: userData.id_usuario
              }
            ])
            .select()
            .single()
          
          if (clienteError) throw clienteError
          
          const profile = { ...clienteData, ...userData }
          set({ user: userData, profile })
          toast.success('¡Cuenta creada exitosamente!')
          return { success: true }
        } catch (error) {
          toast.error(error.message)
          return { success: false, error: error.message }
        }
      },
      
      // Logout
      signOut: async () => {
        try {
          set({ user: null, profile: null })
          toast.success('Sesión cerrada')
        } catch (error) {
          toast.error(error.message)
        }
      },
      
      // Actualizar perfil
      updateProfile: async (updates) => {
        try {
          const profile = get().profile
          
          if (profile.rol === 'cliente') {
            const { data, error } = await supabase
              .from('cliente')
              .update(updates)
              .eq('id_cliente', profile.id_cliente)
              .select()
              .single()
            
            if (error) throw error
            set({ profile: { ...profile, ...data } })
          } else {
            const { data, error } = await supabase
              .from('empleado')
              .update(updates)
              .eq('id_empleado', profile.id_empleado)
              .select()
              .single()
            
            if (error) throw error
            set({ profile: { ...profile, ...data } })
          }
          
          toast.success('Perfil actualizado')
          return { success: true }
        } catch (error) {
          toast.error(error.message)
          return { success: false, error: error.message }
        }
      },
      
      // Verificar si es empleado
      isEmpleado: () => {
        const profile = get().profile
        return profile?.rol === 'empleado' || profile?.rol === 'admin'
      },
      
      // Verificar si es cliente
      isCliente: () => {
        const profile = get().profile
        return profile?.rol === 'cliente'
      },
      
      // Verificar si es admin
      isAdmin: () => {
        const profile = get().profile
        return profile?.rol === 'admin'
      },
      
      // Verificar si es repartidor
      isRepartidor: () => {
        const profile = get().profile
        return profile?.rol === 'repartidor'
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        profile: state.profile 
      })
    }
  )
)
