// Reglas de negocio sobre los roles del sistema.
// Se usa para validar y normalizar el rol en todo el alta/edicion de usuarios.

export const ROLES = {
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
  CAJERO: 'cajero',
  REPARTIDOR: 'repartidor',
  CLIENTE: 'cliente'
}

export const ROLES_VALIDOS = Object.values(ROLES)

// Roles que trabajan dentro del local (panel de empleado/caja)
export const ROLES_DE_EMPLEADO = [
  ROLES.ADMIN,
  ROLES.EMPLEADO,
  ROLES.CAJERO,
  ROLES.REPARTIDOR
]

// Etiqueta visible para cada rol
export const ETIQUETAS_DE_ROL = {
  admin: 'Administrador',
  empleado: 'Empleado',
  cajero: 'Cajero',
  repartidor: 'Repartidor',
  cliente: 'Cliente'
}

// Recorta, pasa a minusculas y valida. Si no es un rol conocido devuelve 'cliente'.
export function normalizarRol(rol) {
  if (typeof rol !== 'string') return ROLES.CLIENTE
  const limpio = rol.trim().toLowerCase()
  return ROLES_VALIDOS.includes(limpio) ? limpio : ROLES.CLIENTE
}

export function esRolValido(rol) {
  return typeof rol === 'string' && ROLES_VALIDOS.includes(rol.trim().toLowerCase())
}

export function esRolDeEmpleado(rol) {
  return ROLES_DE_EMPLEADO.includes(normalizarRol(rol))
}

// Solo el admin puede otorgar el rol admin. Un empleado administra el resto.
export function rolesAsignablesPara(rolActual) {
  if (normalizarRol(rolActual) === ROLES.ADMIN) return [...ROLES_VALIDOS]
  return ROLES_VALIDOS.filter((rol) => rol !== ROLES.ADMIN)
}

export function etiquetaDeRol(rol) {
  return ETIQUETAS_DE_ROL[normalizarRol(rol)] || ETIQUETAS_DE_ROL.cliente
}
