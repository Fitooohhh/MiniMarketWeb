import { describe, it, expect } from 'vitest'
import {
  ROLES,
  ROLES_VALIDOS,
  normalizarRol,
  esRolValido,
  esRolDeEmpleado,
  rolesAsignablesPara,
  etiquetaDeRol
} from '../../src/lib/roles'

describe('P2M-14 | US-02 Gestion de roles', () => {

  // R-01: catálogo de roles
  it('R-01: define los 5 roles del sistema', () => {
    expect(ROLES_VALIDOS).toHaveLength(5)
    expect(ROLES_VALIDOS).toEqual(
      expect.arrayContaining(['admin', 'empleado', 'cajero', 'repartidor', 'cliente'])
    )
  })

  // R-02: normalización de mayúsculas y espacios
  it('R-02: normalizarRol recorta espacios y pasa a minusculas', () => {
    expect(normalizarRol('  ADMIN  ')).toBe('admin')
    expect(normalizarRol('Cliente')).toBe('cliente')
  })

  // R-03: rol desconocido cae en cliente
  it('R-03: normalizarRol devuelve cliente ante un rol desconocido', () => {
    expect(normalizarRol('superuser')).toBe('cliente')
    expect(normalizarRol('')).toBe('cliente')
  })

  // R-04: tipos no string no rompen
  it('R-04: normalizarRol tolera valores que no son string', () => {
    expect(normalizarRol(null)).toBe('cliente')
    expect(normalizarRol(undefined)).toBe('cliente')
    expect(normalizarRol(42)).toBe('cliente')
  })

  // R-05: validación previa al alta de usuario
  it('R-05: esRolValido acepta roles conocidos y rechaza el resto', () => {
    expect(esRolValido('admin')).toBe(true)
    expect(esRolValido(' CAJERO ')).toBe(true)
    expect(esRolValido('root')).toBe(false)
    expect(esRolValido(null)).toBe(false)
  })

  // R-06: quiénes acceden al panel del local
  it('R-06: esRolDeEmpleado es true para admin, empleado, cajero y repartidor', () => {
    expect(esRolDeEmpleado('admin')).toBe(true)
    expect(esRolDeEmpleado('empleado')).toBe(true)
    expect(esRolDeEmpleado('cajero')).toBe(true)
    expect(esRolDeEmpleado('repartidor')).toBe(true)
    expect(esRolDeEmpleado('cliente')).toBe(false)
  })

  // R-07: solo el admin puede otorgar el rol admin
  it('R-07: un admin puede asignar los 5 roles', () => {
    expect(rolesAsignablesPara('admin')).toHaveLength(5)
    expect(rolesAsignablesPara('admin')).toContain('admin')
  })

  // R-08: los demás no pueden ascenderse a admin
  it('R-08: un rol que no es admin no puede asignar el rol admin', () => {
    expect(rolesAsignablesPara('empleado')).not.toContain('admin')
    expect(rolesAsignablesPara('empleado')).toHaveLength(4)
    expect(rolesAsignablesPara('cliente')).not.toContain('admin')
    expect(rolesAsignablesPara(null)).not.toContain('admin')
  })

  // R-09: etiqueta visible para la tabla de usuarios
  it('R-09: etiquetaDeRol traduce el rol a texto visible', () => {
    expect(etiquetaDeRol('admin')).toBe('Administrador')
    expect(etiquetaDeRol('ADMIN')).toBe('Administrador')
    expect(etiquetaDeRol('repartidor')).toBe('Repartidor')
    expect(etiquetaDeRol('desconocido')).toBe('Cliente')
  })
})
