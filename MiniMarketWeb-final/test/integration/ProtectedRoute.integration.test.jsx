import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
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

const RutaActual = () => {
  const location = useLocation()
  return <div data-testid="ruta-actual">{location.pathname}</div>
}

const renderEnRuta = (ruta, ui) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <RutaActual />
      {ui}
    </MemoryRouter>
  )

describe('P2M-15 | US-03 Control de acceso', () => {
  beforeEach(() => {
    mockState.loading = false
    mockState.user = null
    mockState.profile = null
  })

  it('A-01: sin sesion, una ruta protegida lleva a /login', () => {
    renderEnRuta(
      '/empleado/productos',
      <ProtectedRoute requireEmpleado>
        <Contenido />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('ruta-actual').textContent).toBe('/login')
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })

  it('A-02: un cliente sin permiso vuelve a SU dashboard y no al login', () => {
    mockState.user = { id_usuario: 2 }
    mockState.profile = { rol: 'cliente' }

    renderEnRuta(
      '/empleado/usuarios',
      <ProtectedRoute requireEmpleado>
        <Contenido />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('ruta-actual').textContent).toBe('/cliente')
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })

  it('A-03: un admin si ve una ruta de empleado', () => {
    mockState.user = { id_usuario: 3 }
    mockState.profile = { rol: 'admin' }

    renderEnRuta(
      '/empleado/usuarios',
      <ProtectedRoute requireEmpleado>
        <Contenido />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('contenido-protegido')).toBeTruthy()
    expect(screen.getByTestId('ruta-actual').textContent).toBe('/empleado/usuarios')
  })

  it('A-04: un repartidor sin permiso vuelve a /repartidor', () => {
    mockState.user = { id_usuario: 4 }
    mockState.profile = { rol: 'repartidor' }

    renderEnRuta(
      '/cajero',
      <ProtectedRoute requireCajero>
        <Contenido />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('ruta-actual').textContent).toBe('/repartidor')
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })

  it('A-05: un admin no entra a una ruta de repartidor, vuelve a /empleado', () => {
    mockState.user = { id_usuario: 5 }
    mockState.profile = { rol: 'admin' }

    renderEnRuta(
      '/repartidor',
      <ProtectedRoute requireRepartidor>
        <Contenido />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('ruta-actual').textContent).toBe('/empleado')
    expect(screen.queryByTestId('contenido-protegido')).toBeNull()
  })

  it('A-06: requireRoles admite mas de un rol en la misma ruta', () => {
    mockState.user = { id_usuario: 6 }
    mockState.profile = { rol: 'cajero' }

    renderEnRuta(
      '/empleado/productos',
      <ProtectedRoute requireRoles={['empleado', 'cajero']}>
        <Contenido />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('contenido-protegido')).toBeTruthy()
    expect(screen.getByTestId('ruta-actual').textContent).toBe('/empleado/productos')
  })

  it('A-07: un rol desconocido cae en el dashboard por defecto de cliente', () => {
    mockState.user = { id_usuario: 7 }
    mockState.profile = { rol: null }

    renderEnRuta(
      '/empleado',
      <ProtectedRoute requireEmpleado>
        <Contenido />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('ruta-actual').textContent).toBe('/cliente')
  })
})
