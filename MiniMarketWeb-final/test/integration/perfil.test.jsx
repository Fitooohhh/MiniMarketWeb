/**
 * PRUEBAS DE INTEGRACIÓN - P2M-16 | US-04 Gestión del Perfil
 *
 * Cubre el perfil unificado (PerfilGeneral) para los distintos roles.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

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
  },
}))

import { supabase } from '../../src/lib/supabase'
const mockSupabase = supabase

import { useAuthStore } from '../../src/store/useAuthStore'
import ProtectedRoute from '../../src/components/ProtectedRoute'
import PerfilGeneral from '../../src/pages/PerfilGeneral'

// ── Helpers ──────────────────────────────────────────────────────────────────
const resetStore = () =>
  useAuthStore.setState({ user: null, profile: null, loading: false })

const renderPerfil = () =>
  render(
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilGeneral />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Página de Login</div>} />
      </Routes>
    </MemoryRouter>
  )

const profileCliente = {
  id_usuario: 1,
  id_cliente: 10,
  usuario: 'cliente1',
  rol: 'cliente',
  nombre: 'Juan Perez',
  telefono: '12345678',
  direccion: 'Calle Principal #123',
  ci_ruc: '12345678',
  tipo: 'Regular',
}

const profileEmpleado = {
  id_usuario: 2,
  id_empleado: 20,
  usuario: 'empleado1',
  rol: 'empleado',
  nombre: 'Maria Lopez',
  telefono: '87654321',
  direccion: 'Av. Siempre Viva 742',
  legajo: 'EMP-001',
  fecha_ingreso: '2024-01-15',
}

// ── P-01: Renderizado de datos ───────────────────────────────────────────────
describe('P-01 - PerfilGeneral renderiza los datos del usuario logueado', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('P-01: muestra nombre, usuario y rol del cliente', () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'cliente1', rol: 'cliente' },
      profile: profileCliente,
    })

    renderPerfil()

    // El nombre aparece en el header del Layout y en la tarjeta de perfil
    expect(screen.getAllByText('Juan Perez').length).toBeGreaterThan(0)
    expect(screen.getAllByText('cliente1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cliente').length).toBeGreaterThan(0)
  })

  it('P-01: muestra teléfono y dirección del cliente', () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'cliente1', rol: 'cliente' },
      profile: profileCliente,
    })

    renderPerfil()

    // El teléfono aparece en el resumen y en el input deshabilitado
    expect(screen.getAllByDisplayValue('12345678').length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue('Calle Principal #123')).toBeTruthy()
  })

  it('P-01: muestra los datos de un empleado con su rol', () => {
    useAuthStore.setState({
      user: { id_usuario: 2, usuario: 'empleado1', rol: 'empleado' },
      profile: profileEmpleado,
    })

    renderPerfil()

    expect(screen.getAllByText('Maria Lopez').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Empleado').length).toBeGreaterThan(0)
    expect(screen.getByText('EMP-001')).toBeTruthy()
  })

  it('P-01: un cliente no ve los datos exclusive de empleado (legajo)', () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'cliente1', rol: 'cliente' },
      profile: profileCliente,
    })

    renderPerfil()

    expect(screen.queryByText('Legajo')).toBeNull()
    expect(screen.queryByText('Fecha de ingreso')).toBeNull()
    // Pero sí ve los datos propios del cliente
    expect(screen.getByText('CI / RUC')).toBeTruthy()
  })

  it('P-01: un empleado no ve los datos exclusive de cliente (CI / RUC)', () => {
    useAuthStore.setState({
      user: { id_usuario: 2, usuario: 'empleado1', rol: 'empleado' },
      profile: profileEmpleado,
    })

    renderPerfil()

    expect(screen.queryByText('CI / RUC')).toBeNull()
    expect(screen.queryByText('Tipo de cliente')).toBeNull()
  })
})

// ── P-02: Protección de ruta ─────────────────────────────────────────────────
describe('P-02 - PerfilGeneral protegido sin sesión', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('P-02: redirige a /login si no hay usuario ni perfil', () => {
    renderPerfil()

    expect(screen.getByText('Página de Login')).toBeTruthy()
    expect(screen.queryByText('Mi Perfil')).toBeNull()
  })

  it('P-02: redirige a /login si el usuario no tiene perfil', () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'sin-perfil', rol: 'cliente' },
      profile: null,
    })

    renderPerfil()

    expect(screen.getByText('Página de Login')).toBeTruthy()
  })
})

// ── P-03: Actualización del store ────────────────────────────────────────────
describe('P-03 - PerfilGeneral actualiza el estado del store', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('P-03: el formulario guarda los cambios y actualiza el store', async () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'cliente1', rol: 'cliente' },
      profile: profileCliente,
    })

    const actualizado = {
      ...profileCliente,
      nombre: 'Juan Carlos Perez',
      telefono: '99988877',
    }
    mockSupabase.single.mockResolvedValueOnce({ data: actualizado, error: null })

    renderPerfil()

    // Habilitar edición
    fireEvent.click(screen.getByText('Editar'))

    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'Juan Carlos Perez' },
    })
    fireEvent.change(screen.getByLabelText('Teléfono'), {
      target: { value: '99988877' },
    })

    fireEvent.click(screen.getByText('Guardar Cambios'))

    await waitFor(() => {
      expect(useAuthStore.getState().profile.nombre).toBe('Juan Carlos Perez')
    })

    expect(useAuthStore.getState().profile.telefono).toBe('99988877')
    // La dirección no modificada se conserva
    expect(useAuthStore.getState().profile.direccion).toBe('Calle Principal #123')
  })

  it('P-03: la vista refleja el nombre actualizado tras guardar', async () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'cliente1', rol: 'cliente' },
      profile: profileCliente,
    })

    const actualizado = { ...profileCliente, nombre: 'Ana Gomez' }
    mockSupabase.single.mockResolvedValueOnce({ data: actualizado, error: null })

    renderPerfil()

    fireEvent.click(screen.getByText('Editar'))
    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'Ana Gomez' },
    })
    fireEvent.click(screen.getByText('Guardar Cambios'))

    await waitFor(() => {
      expect(screen.getAllByText('Ana Gomez').length).toBeGreaterThan(0)
    })
  })

  it('P-03: un empleado actualiza contra la tabla empleado', async () => {
    useAuthStore.setState({
      user: { id_usuario: 2, usuario: 'empleado1', rol: 'empleado' },
      profile: profileEmpleado,
    })

    const actualizado = { ...profileEmpleado, telefono: '11223344' }
    mockSupabase.single.mockResolvedValueOnce({ data: actualizado, error: null })

    renderPerfil()

    fireEvent.click(screen.getByText('Editar'))
    fireEvent.change(screen.getByLabelText('Teléfono'), {
      target: { value: '11223344' },
    })
    fireEvent.click(screen.getByText('Guardar Cambios'))

    await waitFor(() => {
      expect(useAuthStore.getState().profile.telefono).toBe('11223344')
    })

    // updateProfile debe haber consultado la tabla empleado por su id
    expect(mockSupabase.from).toHaveBeenCalledWith('empleado')
    expect(mockSupabase.eq).toHaveBeenCalledWith('id_empleado', 20)
  })

  it('P-03: si la actualización falla, el store no cambia', async () => {
    useAuthStore.setState({
      user: { id_usuario: 1, usuario: 'cliente1', rol: 'cliente' },
      profile: profileCliente,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error('Error de red'),
    })

    renderPerfil()

    fireEvent.click(screen.getByText('Editar'))
    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'No Should Persist' },
    })
    fireEvent.click(screen.getByText('Guardar Cambios'))

    await waitFor(() => {
      expect(useAuthStore.getState().profile.nombre).toBe('Juan Perez')
    })
  })
})
