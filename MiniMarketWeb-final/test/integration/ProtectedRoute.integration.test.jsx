import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mock del store de autenticación
const mockState = {
  user: null,
  profile: null,
  loading: false
}

vi.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: (selector) => selector(mockState)
}))

// Mock de LoadingScreen
vi.mock('../../src/components/LoadingScreen', () => ({
  default: () => <div data-testid="loading-screen">Cargando...</div>
}))

import ProtectedRoute from '../../src/components/ProtectedRoute'

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

const Contenido = () => <div data-testid="contenido-protegido">Contenido</div>

describe('ProtectedRoute - sin autenticación', () => {
  beforeEach(() => {
    mockState.user = null
    mockState.profile = null
    mockState.loading = false
  })

  it('redirige a /login si no hay usuario', () => {
    renderWithRouter(
      <ProtectedRoute>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })
})

describe('ProtectedRoute - cargando', () => {
  beforeEach(() => {
    mockState.user = null
    mockState.profile = null
    mockState.loading = true
  })

  it('muestra LoadingScreen mientras carga', () => {
    renderWithRouter(
      <ProtectedRoute>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.getByTestId('loading-screen')).toBeTruthy()
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })
})

describe('ProtectedRoute - usuario autenticado', () => {
  beforeEach(() => {
    mockState.user = { id_usuario: 1 }
    mockState.loading = false
  })

  it('muestra el contenido si el rol coincide con requireCliente', () => {
    mockState.profile = { rol: 'cliente' }
    renderWithRouter(
      <ProtectedRoute requireCliente>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.getByTestId('contenido-protegido')).toBeTruthy()
  })

  it('redirige si requireCliente y el usuario es empleado', () => {
    mockState.profile = { rol: 'empleado' }
    renderWithRouter(
      <ProtectedRoute requireCliente>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })

  it('muestra el contenido si requireEmpleado y el usuario es empleado', () => {
    mockState.profile = { rol: 'empleado' }
    renderWithRouter(
      <ProtectedRoute requireEmpleado>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.getByTestId('contenido-protegido')).toBeTruthy()
  })

  it('muestra el contenido si requireEmpleado y el usuario es admin', () => {
    mockState.profile = { rol: 'admin' }
    renderWithRouter(
      <ProtectedRoute requireEmpleado>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.getByTestId('contenido-protegido')).toBeTruthy()
  })

  it('redirige si requireEmpleado y el usuario es cliente', () => {
    mockState.profile = { rol: 'cliente' }
    renderWithRouter(
      <ProtectedRoute requireEmpleado>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })

  it('muestra el contenido si requireRepartidor y el usuario es repartidor', () => {
    mockState.profile = { rol: 'repartidor' }
    renderWithRouter(
      <ProtectedRoute requireRepartidor>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.getByTestId('contenido-protegido')).toBeTruthy()
  })

  it('redirige si requireRepartidor y el usuario es cliente', () => {
    mockState.profile = { rol: 'cliente' }
    renderWithRouter(
      <ProtectedRoute requireRepartidor>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })

  it('muestra el contenido sin restricciones si hay usuario autenticado', () => {
    mockState.profile = { rol: 'cliente' }
    renderWithRouter(
      <ProtectedRoute>
        <Contenido />
      </ProtectedRoute>
    )
    expect(screen.getByTestId('contenido-protegido')).toBeTruthy()
  })
})
