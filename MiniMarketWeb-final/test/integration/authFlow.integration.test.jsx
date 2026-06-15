import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

vi.mock('zustand/middleware', () => ({ persist: (fn) => fn }))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}))

import { supabase } from '../../src/lib/supabase'
const mockSupabase = supabase

import { useAuthStore } from '../../src/store/useAuthStore'
import ProtectedRoute from '../../src/components/ProtectedRoute'
import LoadingScreen from '../../src/components/LoadingScreen'

// ── Helpers ───────────────────────────────────────────────────────────────────
const resetStore = () =>
  useAuthStore.setState({ user: null, profile: null, loading: false })

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Flujo de Autenticación - Pruebas de Integración', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  // I-01: ProtectedRoute redirige a /login sin sesión
  it('I-01: ProtectedRoute redirige a /login si no hay usuario', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/cliente']}>
        <ProtectedRoute><div>Contenido protegido</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(container.innerHTML).not.toContain('Contenido protegido')
  })

  // I-02: ProtectedRoute muestra contenido con usuario autenticado
  it('I-02: ProtectedRoute muestra contenido cuando hay sesión activa', () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'test', rol: 'cliente' },
      profile: { rol: 'cliente' },
    })
    render(
      <MemoryRouter>
        <ProtectedRoute><div>Área cliente</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Área cliente')).toBeTruthy()
  })

  // I-03: ProtectedRoute bloquea empleado sin permiso
  it('I-03: ProtectedRoute bloquea cliente que intenta acceder a área de empleado', () => {
    useAuthStore.setState({
      user: { id_usuario: 2, usuario: 'cliente1', rol: 'cliente' },
      profile: { rol: 'cliente' },
    })
    const { container } = render(
      <MemoryRouter initialEntries={['/empleado']}>
        <ProtectedRoute requireEmpleado><div>Panel empleado</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(container.innerHTML).not.toContain('Panel empleado')
  })

  // I-04: ProtectedRoute permite empleado en área de empleado
  it('I-04: ProtectedRoute permite acceso a empleado en área de empleado', () => {
    useAuthStore.setState({
      user: { id_usuario: 3, usuario: 'emp1', rol: 'empleado' },
      profile: { rol: 'empleado' },
    })
    render(
      <MemoryRouter>
        <ProtectedRoute requireEmpleado><div>Panel empleado</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Panel empleado')).toBeTruthy()
  })

  // I-05: Admin puede acceder a área de empleado
  it('I-05: ProtectedRoute permite acceso a admin en área de empleado', () => {
    useAuthStore.setState({
      user: { id_usuario: 4, usuario: 'admin1', rol: 'admin' },
      profile: { rol: 'admin' },
    })
    render(
      <MemoryRouter>
        <ProtectedRoute requireEmpleado><div>Panel admin</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Panel admin')).toBeTruthy()
  })

  // I-06: ProtectedRoute bloquea repartidor en área de cliente
  it('I-06: ProtectedRoute bloquea repartidor que intenta área de cliente', () => {
    useAuthStore.setState({
      user: { id_usuario: 5, usuario: 'rep1', rol: 'repartidor' },
      profile: { rol: 'repartidor' },
    })
    const { container } = render(
      <MemoryRouter initialEntries={['/cliente']}>
        <ProtectedRoute requireCliente><div>Área cliente</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(container.innerHTML).not.toContain('Área cliente')
  })

  // I-07: ProtectedRoute muestra LoadingScreen cuando loading=true
  it('I-07: ProtectedRoute muestra pantalla de carga cuando loading es true', () => {
    useAuthStore.setState({ loading: true })
    render(
      <MemoryRouter>
        <ProtectedRoute><div>Oculto</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.queryByText('Oculto')).toBeNull()
  })

  // I-08: signIn exitoso actualiza el estado del store
  it('I-08: signIn exitoso guarda usuario y perfil en el store', async () => {
    const fakeUser = { id_usuario: 10, usuario: 'test', rol: 'cliente' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id_cliente: 1, nombre: 'Test', ...fakeUser },
      error: null,
    })

    const result = await useAuthStore.getState().signIn('test', '1234')
    expect(result.success).toBe(true)
    expect(useAuthStore.getState().user).toBeTruthy()
  })

  // I-09: signIn fallido no actualiza el estado
  it('I-09: signIn fallido deja el estado sin usuario', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('No encontrado') })

    const result = await useAuthStore.getState().signIn('wrong', 'wrong')
    expect(result.success).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  // I-10: signOut limpia el store completamente
  it('I-10: signOut elimina usuario y perfil del store', async () => {
    useAuthStore.setState({ user: { id: 1 }, profile: { rol: 'cliente' } })
    await useAuthStore.getState().signOut()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().profile).toBeNull()
  })

  // I-11: Repartidor accede a su área correctamente
  it('I-11: ProtectedRoute permite repartidor en área de repartidor', () => {
    useAuthStore.setState({
      user: { id_usuario: 6, usuario: 'rep2', rol: 'repartidor' },
      profile: { rol: 'repartidor' },
    })
    render(
      <MemoryRouter>
        <ProtectedRoute requireRepartidor><div>Panel repartidor</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Panel repartidor')).toBeTruthy()
  })

  // I-12: ProtectedRoute bloquea cliente en área de repartidor
  it('I-12: ProtectedRoute bloquea cliente en área de repartidor', () => {
    useAuthStore.setState({
      user: { id_usuario: 7, usuario: 'cli1', rol: 'cliente' },
      profile: { rol: 'cliente' },
    })
    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute requireRepartidor><div>Panel repartidor</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(container.innerHTML).not.toContain('Panel repartidor')
  })

  // I-13: Estado loading pasa a false después de initialize
  it('I-13: initialize finaliza con loading=false', async () => {
    useAuthStore.setState({ loading: true })
    await useAuthStore.getState().initialize()
    expect(useAuthStore.getState().loading).toBe(false)
  })

  // I-14: Múltiples ProtectedRoutes en la misma sesión
  it('I-14: múltiples ProtectedRoutes respetan la misma sesión', () => {
    useAuthStore.setState({
      user: { id_usuario: 8, usuario: 'u1', rol: 'cliente' },
      profile: { rol: 'cliente' },
    })
    render(
      <MemoryRouter>
        <ProtectedRoute><div>A</div></ProtectedRoute>
        <ProtectedRoute><div>B</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('B')).toBeTruthy()
  })

  // I-15: signUp exitoso crea usuario en el store
  it('I-15: signUp exitoso guarda el nuevo usuario en el store', async () => {
    const fakeUser = { id_usuario: 99, usuario: 'nuevo', rol: 'cliente' }
    const fakeCliente = { id_cliente: 50, nombre: 'Nuevo', ...fakeUser }
    mockSupabase.single
      .mockResolvedValueOnce({ data: fakeUser, error: null })
      .mockResolvedValueOnce({ data: fakeCliente, error: null })

    const result = await useAuthStore
      .getState()
      .signUp('nuevo', 'pass123', 'Nuevo', '77777777', 'Calle X', '12345678')
    expect(result.success).toBe(true)
    expect(useAuthStore.getState().user).toBeTruthy()
  })
})
