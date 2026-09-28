import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() }
}))

vi.mock('zustand/middleware', () => ({
  persist: (fn, _opts) => fn
}))

import { supabase } from '../../src/lib/supabase'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../src/store/useAuthStore'

describe('useAuthStore - Pruebas Unitarias (roles y estado)', () => {

  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  // CASO 1: Estado inicial sin usuario
  it('U-01: estado inicial no tiene usuario ni perfil', () => {
    const { user, profile } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(profile).toBeNull()
  })

  // CASO 2: isEmpleado retorna false sin sesión
  it('U-02: isEmpleado retorna false sin sesión activa', () => {
    expect(useAuthStore.getState().isEmpleado()).toBe(false)
  })

  // CASO 3: isCliente retorna false sin sesión
  it('U-03: isCliente retorna false sin sesión activa', () => {
    expect(useAuthStore.getState().isCliente()).toBe(false)
  })

  // CASO 4: isAdmin retorna false sin sesión
  it('U-04: isAdmin retorna false sin sesión activa', () => {
    expect(useAuthStore.getState().isAdmin()).toBe(false)
  })

  // CASO 5: isRepartidor retorna false sin sesión
  it('U-05: isRepartidor retorna false sin sesión activa', () => {
    expect(useAuthStore.getState().isRepartidor()).toBe(false)
  })

  // CASO 6: isCliente retorna true con perfil cliente
  it('U-06: isCliente retorna true cuando el perfil es cliente', () => {
    useAuthStore.setState({ profile: { rol: 'cliente' } })
    expect(useAuthStore.getState().isCliente()).toBe(true)
  })

  // CASO 7: isEmpleado retorna true con perfil empleado
  it('U-07: isEmpleado retorna true cuando el perfil es empleado', () => {
    useAuthStore.setState({ profile: { rol: 'empleado' } })
    expect(useAuthStore.getState().isEmpleado()).toBe(true)
  })

  // CASO 8: isAdmin retorna true con perfil admin
  it('U-08: isAdmin retorna true cuando el perfil es admin', () => {
    useAuthStore.setState({ profile: { rol: 'admin' } })
    expect(useAuthStore.getState().isAdmin()).toBe(true)
  })

  // CASO 9: isEmpleado también es true para admin
  it('U-09: isEmpleado retorna true para perfil admin', () => {
    useAuthStore.setState({ profile: { rol: 'admin' } })
    expect(useAuthStore.getState().isEmpleado()).toBe(true)
  })

  // CASO 10: isRepartidor retorna true con perfil repartidor
  it('U-10: isRepartidor retorna true cuando el perfil es repartidor', () => {
    useAuthStore.setState({ profile: { rol: 'repartidor' } })
    expect(useAuthStore.getState().isRepartidor()).toBe(true)
  })

  // CASO 11: signOut limpia usuario y perfil
  it('U-11: signOut limpia el estado de usuario y perfil', async () => {
    useAuthStore.setState({ user: { id: 1 }, profile: { rol: 'cliente' } })
    await useAuthStore.getState().signOut()
    const { user, profile } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(profile).toBeNull()
  })

  // CASO 12: loading empieza en false
  it('U-12: loading inicia en false', () => {
    expect(useAuthStore.getState().loading).toBe(false)
  })

  // CASO 13: isCliente retorna false para perfil empleado
  it('U-13: isCliente retorna false para perfil empleado', () => {
    useAuthStore.setState({ profile: { rol: 'empleado' } })
    expect(useAuthStore.getState().isCliente()).toBe(false)
  })

  // CASO 14: isAdmin retorna false para perfil cliente
  it('U-14: isAdmin retorna false para perfil cliente', () => {
    useAuthStore.setState({ profile: { rol: 'cliente' } })
    expect(useAuthStore.getState().isAdmin()).toBe(false)
  })

  // CASO 15: isRepartidor retorna false para perfil cliente
  it('U-15: isRepartidor retorna false para perfil cliente', () => {
    useAuthStore.setState({ profile: { rol: 'cliente' } })
    expect(useAuthStore.getState().isRepartidor()).toBe(false)
  })
})


describe('P2M-12 | US-01 Inicio de Sesion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.single.mockReset().mockResolvedValue({ data: null, error: null })
    supabase.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  it('S-01: campos vacíos no consultan Supabase', async () => {
    supabase.single.mockResolvedValueOnce({ data: { usuario: 'unused' }, error: null })

    const result = await useAuthStore.getState().signIn('', '')

    expect(result.success).toBe(false)
    expect(supabase.from).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Ingresá tu usuario y contraseña')
  })

  it('S-02: credenciales inválidas mantienen user y profile en null y muestran error', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'invalid credentials' } })

    const result = await useAuthStore.getState().signIn('usuario', 'incorrecta')
    const { user, profile } = useAuthStore.getState()

    expect(result.success).toBe(false)
    expect(user).toBeNull()
    expect(profile).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })

  it('S-03: aplica trim antes de consultar las credenciales', async () => {
    supabase.single.mockResolvedValueOnce({
      data: { id_usuario: 1, usuario: 'usuario', rol: 'cliente' },
      error: null
    })

    await useAuthStore.getState().signIn(' usuario ', ' admin ')

    expect(supabase.eq).toHaveBeenNthCalledWith(1, 'usuario', 'usuario')
    expect(supabase.eq).toHaveBeenNthCalledWith(2, 'contrasena', 'admin')
  })

  it('S-04: login OK guarda user y profile con rol en minúsculas', async () => {
    supabase.single.mockResolvedValueOnce({
      data: { id_usuario: 2, usuario: 'admin', rol: 'ADMIN' },
      error: null
    })

    const result = await useAuthStore.getState().signIn('admin', 'clave')
    const { user, profile } = useAuthStore.getState()

    expect(result.success).toBe(true)
    expect(user.rol).toBe('admin')
    expect(profile.rol).toBe('admin')
  })

  it('S-05: rol null usa cliente y no rompe el login', async () => {
    supabase.single.mockResolvedValueOnce({
      data: { id_usuario: 3, usuario: 'cliente', rol: null },
      error: null
    })

    const result = await useAuthStore.getState().signIn('cliente', 'clave')

    expect(result.success).toBe(true)
    expect(useAuthStore.getState().user.rol).toBe('cliente')
    expect(useAuthStore.getState().profile.rol).toBe('cliente')
  })

  it('S-06: login no llama a console.log', async () => {
    supabase.single.mockResolvedValueOnce({
      data: { id_usuario: 4, usuario: 'cliente', rol: 'cliente' },
      error: null
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await useAuthStore.getState().signIn('cliente', 'clave')

    expect(logSpy).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })
})
