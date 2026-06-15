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
