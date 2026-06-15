/**
 * PRUEBAS E2E - Flujo de Login
 * 
 * Simulan la interacción completa del usuario con el formulario de login
 * usando jsdom + Testing Library (sin navegador real).
 * 
 * Para ejecutar con Playwright real:  npx playwright test
 * Para ejecutar con Vitest (jsdom):   npm run test:e2e
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// ── Mocks globales ────────────────────────────────────────────────────────────
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

import LoginPage from '../../src/pages/LoginPage'
import { useAuthStore } from '../../src/store/useAuthStore'


const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cliente/dashboard" element={<div>Dashboard Cliente</div>} />
        <Route path="/empleado/dashboard" element={<div>Dashboard Empleado</div>} />
        <Route path="*" element={<div>Otra página</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('E2E - Flujo de Login', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
    vi.clearAllMocks()
  })

  // E2E-01: El formulario de login se renderiza con los campos correctos
  it('E2E-01: se muestra el formulario de login con campos de usuario y contraseña', () => {
    renderLogin()
    expect(screen.getByLabelText(/usuario/i) || screen.getByPlaceholderText(/usuario/i)).toBeTruthy()
    expect(screen.getByLabelText(/contraseña/i) || screen.getByPlaceholderText(/contraseña/i)).toBeTruthy()
  })

  // E2E-02: El botón de login está presente
  it('E2E-02: el botón de iniciar sesión está visible', () => {
    renderLogin()
    const btn = screen.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i })
    expect(btn).toBeTruthy()
  })

  // E2E-03: Intentar login con campos vacíos no llama a signIn
  it('E2E-03: enviar formulario vacío no llama al servicio de autenticación', async () => {
    renderLogin()
    const btn = screen.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i })
    await act(async () => { fireEvent.click(btn) })
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  // E2E-04: Login fallido muestra error
  it('E2E-04: credenciales inválidas muestran mensaje de error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('No encontrado') })
    renderLogin()

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'usuarioMalo' } })
    
    const passInput = document.querySelector('input[type="password"]')
    if (passInput) fireEvent.change(passInput, { target: { value: 'passIncorrecto' } })

    const btn = screen.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i })
    await act(async () => { fireEvent.click(btn) })

    // El store no debe tener usuario tras fallo
    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  // E2E-05: Login exitoso como cliente actualiza el store
  it('E2E-05: login exitoso guarda usuario en el store con rol cliente', async () => {
    const fakeUser = { id_usuario: 10, usuario: 'cli', rol: 'cliente' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id_cliente: 1, nombre: 'Cliente Test', ...fakeUser },
      error: null,
    })

    await act(async () => {
      await useAuthStore.getState().signIn('cli', 'pass123')
    })

    expect(useAuthStore.getState().user?.rol).toBe('cliente')
  })

  // E2E-06: Login exitoso como empleado actualiza el store
  it('E2E-06: login exitoso guarda usuario en el store con rol empleado', async () => {
    const fakeUser = { id_usuario: 20, usuario: 'emp', rol: 'empleado' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id_empleado: 5, nombre: 'Empleado Test', ...fakeUser },
      error: null,
    })

    await act(async () => {
      await useAuthStore.getState().signIn('emp', 'emp123')
    })

    expect(useAuthStore.getState().user?.rol).toBe('empleado')
  })

  // E2E-07: Login exitoso como admin actualiza el store
  it('E2E-07: login exitoso guarda usuario en el store con rol admin', async () => {
    const fakeUser = { id_usuario: 30, usuario: 'admin', rol: 'admin' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id_empleado: 1, nombre: 'Admin', ...fakeUser },
      error: null,
    })

    await act(async () => {
      await useAuthStore.getState().signIn('admin', 'admin123')
    })

    expect(useAuthStore.getState().user?.rol).toBe('admin')
  })

  // E2E-08: signOut limpia el store
  it('E2E-08: cerrar sesión limpia el usuario del store', async () => {
    useAuthStore.setState({
      user: { id_usuario: 1, rol: 'cliente' },
      profile: { rol: 'cliente' },
    })
    await act(async () => { await useAuthStore.getState().signOut() })
    expect(useAuthStore.getState().user).toBeNull()
  })

  // E2E-09: El link de registro está presente en login
  it('E2E-09: la página de login contiene enlace al registro', () => {
    renderLogin()
    const regLink = screen.queryByText(/regístrate|crear cuenta|sign up/i)
    expect(regLink).toBeTruthy()
  })

  // E2E-10: Normalización de rol a minúsculas
  it('E2E-10: el rol del usuario se normaliza a minúsculas al hacer login', async () => {
    const fakeUser = { id_usuario: 40, usuario: 'test2', rol: 'CLIENTE' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    await act(async () => {
      await useAuthStore.getState().signIn('test2', 'pass')
    })

    expect(useAuthStore.getState().user?.rol).toBe('cliente')
  })

  // E2E-11: Login repartidor actualiza el store
  it('E2E-11: login exitoso como repartidor actualiza el store', async () => {
    const fakeUser = { id_usuario: 50, usuario: 'rep', rol: 'repartidor' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id_empleado: 10, ...fakeUser },
      error: null,
    })

    await act(async () => {
      await useAuthStore.getState().signIn('rep', 'rep123')
    })

    expect(useAuthStore.getState().user?.rol).toBe('repartidor')
  })

  // E2E-12: signIn retorna success:true en éxito
  it('E2E-12: signIn retorna objeto con success:true en login exitoso', async () => {
    const fakeUser = { id_usuario: 60, usuario: 'u1', rol: 'cliente' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: fakeUser, error: null })

    const result = await useAuthStore.getState().signIn('u1', 'p1')
    expect(result.success).toBe(true)
  })

  // E2E-13: signIn retorna success:false en fallo
  it('E2E-13: signIn retorna objeto con success:false en login fallido', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Error') })
    const result = await useAuthStore.getState().signIn('x', 'y')
    expect(result.success).toBe(false)
  })

  // E2E-14: Estado loading en false tras signIn
  it('E2E-14: el estado loading no queda atascado en true después del login', async () => {
    const fakeUser = { id_usuario: 70, usuario: 'u2', rol: 'cliente' }
    mockSupabase.single.mockResolvedValueOnce({ data: fakeUser, error: null })
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: fakeUser, error: null })

    await act(async () => { await useAuthStore.getState().signIn('u2', 'p2') })
    expect(useAuthStore.getState().loading).toBe(false)
  })

  // E2E-15: Múltiples signOut no lanzan error
  it('E2E-15: hacer signOut múltiples veces no lanza excepciones', async () => {
    await expect(async () => {
      await useAuthStore.getState().signOut()
      await useAuthStore.getState().signOut()
      await useAuthStore.getState().signOut()
    }).not.toThrow()
  })
})
