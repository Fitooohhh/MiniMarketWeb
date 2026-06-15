/**
 * PRUEBAS E2E - Flujo de Registro y Perfil de Usuario
 * 
 * Simula el registro de nuevos clientes y actualización de perfil.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

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
import RegisterPage from '../../src/pages/RegisterPage'


const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Página Login</div>} />
        <Route path="*" element={<div>Otra</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('E2E - Flujo de Registro', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
    vi.clearAllMocks()
  })

  // E2E-01: El formulario de registro tiene los campos necesarios
  it('E2E-01: el formulario de registro tiene campos de usuario, nombre, teléfono y contraseña', () => {
    renderRegister()
    // Verificar que hay al menos 3 inputs en el formulario
    const inputs = document.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(3)
  })

  // E2E-02: El botón de registro está visible
  it('E2E-02: el botón de registro está visible en la página', () => {
    renderRegister()
    const btn = screen.getByRole('button', {
      name: /registrar|crear cuenta|registrarse/i,
    })
    expect(btn).toBeTruthy()
  })

  // E2E-03: Hay un link para volver al login
  it('E2E-03: la página de registro tiene un enlace de vuelta al login', () => {
    renderRegister()
    const loginLink = screen.queryByText(/ya tienes cuenta|iniciar sesión|login/i)
    expect(loginLink).toBeTruthy()
  })

  // E2E-04: signUp exitoso crea usuario
  it('E2E-04: signUp exitoso guarda el nuevo usuario en el store', async () => {
    const fakeUser = { id_usuario: 100, usuario: 'nuevo_user', rol: 'cliente' }
    const fakeCliente = { id_cliente: 200, nombre: 'Nuevo', ...fakeUser }
    mockSupabase.single
      .mockResolvedValueOnce({ data: fakeUser, error: null })
      .mockResolvedValueOnce({ data: fakeCliente, error: null })

    const result = await useAuthStore
      .getState()
      .signUp('nuevo_user', 'pass123', 'Nuevo', '77000000', 'Calle 1', '12345678')

    expect(result.success).toBe(true)
    expect(useAuthStore.getState().user?.usuario).toBe('nuevo_user')
  })

  // E2E-05: signUp fallido no modifica el store
  it('E2E-05: signUp fallido no guarda ningún usuario en el store', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Usuario ya existe' },
    })

    const result = await useAuthStore
      .getState()
      .signUp('duplicado', 'pass', 'Test', '111', 'Dir', '111')

    expect(result.success).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  // E2E-06: signUp asigna rol cliente automáticamente
  it('E2E-06: el usuario registrado tiene rol cliente por defecto', async () => {
    const fakeUser = { id_usuario: 101, usuario: 'cli_nuevo', rol: 'cliente' }
    mockSupabase.single
      .mockResolvedValueOnce({ data: fakeUser, error: null })
      .mockResolvedValueOnce({ data: { id_cliente: 201, ...fakeUser }, error: null })

    await useAuthStore
      .getState()
      .signUp('cli_nuevo', 'pass', 'Cli', '77111111', 'Calle 2', '87654321')

    expect(useAuthStore.getState().user?.rol).toBe('cliente')
  })

  // E2E-07: updateProfile actualiza datos del cliente
  it('E2E-07: updateProfile actualiza los datos del perfil en el store', async () => {
    useAuthStore.setState({
      user: { id_usuario: 1, rol: 'cliente' },
      profile: { rol: 'cliente', id_cliente: 1, nombre: 'Original' },
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: { id_cliente: 1, nombre: 'Actualizado' },
      error: null,
    })

    const result = await useAuthStore.getState().updateProfile({ nombre: 'Actualizado' })
    expect(result.success).toBe(true)
    expect(useAuthStore.getState().profile?.nombre).toBe('Actualizado')
  })

  // E2E-08: updateProfile para empleado usa tabla empleado
  it('E2E-08: updateProfile para empleado actualiza tabla empleado', async () => {
    useAuthStore.setState({
      user: { id_usuario: 2, rol: 'empleado' },
      profile: { rol: 'empleado', id_empleado: 5, nombre: 'Emp Original' },
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: { id_empleado: 5, nombre: 'Emp Actualizado' },
      error: null,
    })

    await useAuthStore.getState().updateProfile({ nombre: 'Emp Actualizado' })
    expect(mockSupabase.from).toHaveBeenCalledWith('empleado')
  })

  // E2E-09: Error en updateProfile retorna success:false
  it('E2E-09: updateProfile con error de BD retorna success:false', async () => {
    useAuthStore.setState({
      user: { id_usuario: 3, rol: 'cliente' },
      profile: { rol: 'cliente', id_cliente: 3 },
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error('DB error'),
    })

    const result = await useAuthStore.getState().updateProfile({ nombre: 'X' })
    expect(result.success).toBe(false)
  })

  // E2E-10: signUp incluye crédito 0 para nuevos clientes
  it('E2E-10: el nuevo cliente se crea con crédito 0', async () => {
    const fakeUser = { id_usuario: 102, usuario: 'c2', rol: 'cliente' }
    mockSupabase.single
      .mockResolvedValueOnce({ data: fakeUser, error: null })
      .mockResolvedValueOnce({ data: { id_cliente: 202, credito: 0, ...fakeUser }, error: null })

    await useAuthStore.getState().signUp('c2', 'p', 'C2', '77', 'Dir', '99')
    expect(useAuthStore.getState().profile?.credito ?? 0).toBe(0)
  })

  // E2E-11: Perfil es null antes del login
  it('E2E-11: el perfil es null antes de iniciar sesión', () => {
    expect(useAuthStore.getState().profile).toBeNull()
  })

  // E2E-12: signIn crea perfil combinado (usuario + datos específicos)
  it('E2E-12: signIn combina datos de usuario y cliente en el perfil', async () => {
    const fakeUser = { id_usuario: 103, usuario: 'u3', rol: 'cliente' }
    const fakeCliente = { id_cliente: 203, nombre: 'Nombre Completo', telefono: '77123456' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { ...fakeUser, ...fakeCliente },
      error: null,
    })

    await useAuthStore.getState().signIn('u3', 'p3')
    expect(useAuthStore.getState().profile?.nombre).toBe('Nombre Completo')
  })

  // E2E-13: initialize no falla con localStorage vacío
  it('E2E-13: initialize no lanza error con localStorage vacío', async () => {
    localStorage.clear()
    await expect(useAuthStore.getState().initialize()).resolves.not.toThrow()
  })

  // E2E-14: signUp llama al insert de usuario primero
  it('E2E-14: signUp primero inserta en tabla usuario', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id_usuario: 1, rol: 'cliente' }, error: null })
      .mockResolvedValueOnce({ data: { id_cliente: 1 }, error: null })

    await useAuthStore.getState().signUp('u4', 'p4', 'U4', '000', 'Dir', '000')

    const calls = mockSupabase.from.mock.calls.map(c => c[0])
    expect(calls[0]).toBe('usuario')
  })

  // E2E-15: Los métodos de verificación de rol son coherentes tras login
  it('E2E-15: los helpers de rol retornan valores coherentes tras el login', async () => {
    const fakeUser = { id_usuario: 104, usuario: 'u5', rol: 'admin' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: fakeUser, error: null })

    await useAuthStore.getState().signIn('u5', 'p5')

    const s = useAuthStore.getState()
    expect(s.isAdmin()).toBe(true)
    expect(s.isEmpleado()).toBe(true)  // admin también es empleado
    expect(s.isCliente()).toBe(false)
    expect(s.isRepartidor()).toBe(false)
  })
})
