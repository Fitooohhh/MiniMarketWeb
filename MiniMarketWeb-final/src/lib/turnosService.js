import { supabase } from './supabase'

class TurnosService {
  // Obtener tipos de turnos
  async obtenerTiposTurnos() {
    const { data, error } = await supabase
      .from('turno_tipo')
      .select('*')
      .order('hora_inicio', { ascending: true })

    if (error) throw error
    return data
  }

  // Crear nuevo tipo de turno
  async crearTipoTurno(tipoTurno) {
    const { data, error } = await supabase
      .from('turno_tipo')
      .insert([tipoTurno])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener programación de turnos
  async obtenerProgramacionTurnos(fechaInicio, fechaFin, idEmpleado = null) {
    let query = supabase
      .from('turno_programacion')
      .select(`
        *,
        empleado:empleado(id_empleado, nombre, telefono),
        tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin, color)
      `)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

    if (idEmpleado) {
      query = query.eq('id_empleado', idEmpleado)
    }

    const { data, error } = await query
    if (error) throw error

    if (data && Array.isArray(data)) {
      data.sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
        const startA = a.tipo_turno?.hora_inicio || ''
        const startB = b.tipo_turno?.hora_inicio || ''
        return startA.localeCompare(startB)
      })
    }

    return data
  }

  // Crear programación de turnos
  async crearProgramacionTurnos(turnos) {
    const { data, error } = await supabase
      .from('turno_programacion')
      .insert(turnos)
      .select(`
        *,
        empleado:empleado(nombre),
        tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin)
      `)

    if (error) throw error
    return data
  }

  // Generar turnos automáticamente para un período
  async generarTurnosPeriodo(fechaInicio, fechaFin, empleados, tiposTurnos) {
    const turnosGenerados = []
    const startDate = new Date(fechaInicio)
    const endDate = new Date(fechaFin)

    // Para cada día del período
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const diaSemana = date.getDay()
      const fechaStr = date.toISOString().split('T')[0]

      // Para cada tipo de turno
      for (const tipoTurno of tiposTurnos) {
        // Asignar a empleados rotativos (implementar lógica de rotación)
        const empleadoAsignado = this.asignarEmpleadoRotativo(empleados, diaSemana, tipoTurno.id_turno_tipo)
        
        if (empleadoAsignado) {
          turnosGenerados.push({
            id_empleado: empleadoAsignado.id_empleado,
            id_turno_tipo: tipoTurno.id_turno_tipo,
            fecha: fechaStr,
            estado: 'programado',
            creado_por: 1 // ID del usuario que crea (debería venir del contexto)
          })
        }
      }
    }

    if (turnosGenerados.length > 0) {
      return await this.crearProgramacionTurnos(turnosGenerados)
    }

    return []
  }

  // Lógica simple de asignación rotativa (puede mejorarse)
  asignarEmpleadoRotativo(empleados, diaSemana, idTipoTurno) {
    // Implementar lógica más compleja según necesidades
    // Por ahora, asignar al primer empleado disponible
    return empleados.length > 0 ? empleados[0] : null
  }

  // Obtener turnos de un empleado
  async obtenerTurnosEmpleado(idEmpleado, fechaInicio, fechaFin) {
    const { data, error } = await supabase
      .from('turno_programacion')
      .select(`
        *,
        tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin, color, descripcion)
      `)
      .eq('id_empleado', idEmpleado)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

    if (error) throw error
    return data
  }

  // Solicitar intercambio de turno
  async solicitarIntercambioTurno(idTurnoOriginal, idEmpleadoDestino, motivo) {
    const turnoOriginal = await this.obtenerDetalleTurno(idTurnoOriginal)
    
    if (!turnoOriginal) {
      throw new Error('Turno no encontrado')
    }

    const { data, error } = await supabase
      .from('intercambio_turno')
      .insert([{
        id_turno_original: idTurnoOriginal,
        id_empleado_solicita: turnoOriginal.id_empleado,
        id_empleado_destino: idEmpleadoDestino,
        fecha_intercambio: turnoOriginal.fecha,
        motivo
      }])
      .select(`
        *,
        empleado_solicita:empleado(nombre),
        empleado_destino:empleado(nombre),
        turno_original:turno_programacion (
          *,
          tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin)
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  // Obtener solicitudes de intercambio
  async obtenerSolicitudesIntercambio(idEmpleado = null, estado = null) {
    let query = supabase
      .from('intercambio_turno')
      .select(`
        *,
        empleado_solicita:empleado(id_empleado, nombre, telefono),
        empleado_destino:empleado(id_empleado, nombre, telefono),
        turno_original:turno_programacion (
          *,
          tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin)
        )
      `)
      .order('fecha_intercambio', { ascending: false })

    if (idEmpleado) {
      query = query.or(`id_empleado_solicita.eq.${idEmpleado},id_empleado_destino.eq.${idEmpleado}`)
    }

    if (estado) {
      query = query.eq('estado', estado)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  // Aceptar intercambio de turno
  async aceptarIntercambio(idIntercambio) {
    const intercambio = await this.obtenerDetalleIntercambio(idIntercambio)
    
    if (!intercambio || intercambio.estado !== 'solicitado') {
      throw new Error('Solicitud de intercambio no válida')
    }

    // Realizar el intercambio
    await supabase
      .from('turno_programacion')
      .update({ id_empleado: intercambio.id_empleado_destino })
      .eq('id_turno', intercambio.id_turno_original)

    // Crear nuevo turno para el empleado solicita si es un intercambio real
    // (Esta lógica puede variar según las reglas del negocio)

    // Actualizar estado del intercambio
    const { data, error } = await supabase
      .from('intercambio_turno')
      .update({
        estado: 'aceptado',
        fecha_respuesta: new Date().toISOString()
      })
      .eq('id_intercambio', idIntercambio)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Rechazar intercambio de turno
  async rechazarIntercambio(idIntercambio, motivoRechazo) {
    const { data, error } = await supabase
      .from('intercambio_turno')
      .update({
        estado: 'rechazado',
        fecha_respuesta: new Date().toISOString(),
        motivo: motivoRechazo
      })
      .eq('id_intercambio', idIntercambio)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Marcar turno como cumplido o ausente
  async actualizarEstadoTurno(idTurno, estado, notas = '') {
    const { data, error } = await supabase
      .from('turno_programacion')
      .update({ estado, notas })
      .eq('id_turno', idTurno)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Eliminar programación de turno
  async eliminarTurno(idTurno) {
    // Primero verificar si hay solicitudes de intercambio asociadas
    await supabase
      .from('intercambio_turno')
      .update({ estado: 'cancelado' })
      .eq('id_turno_original', idTurno)

    const { data, error } = await supabase
      .from('turno_programacion')
      .delete()
      .eq('id_turno', idTurno)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener detalle de un turno
  async obtenerDetalleTurno(idTurno) {
    const { data, error } = await supabase
      .from('turno_programacion')
      .select(`
        *,
        empleado:empleado(id_empleado, nombre, telefono),
        tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin, color, descripcion)
      `)
      .eq('id_turno', idTurno)
      .single()

    if (error) throw error
    return data
  }

  // Obtener detalle de un intercambio
  async obtenerDetalleIntercambio(idIntercambio) {
    const { data, error } = await supabase
      .from('intercambio_turno')
      .select(`
        *,
        empleado_solicita:empleado(id_empleado, nombre, telefono),
        empleado_destino:empleado(id_empleado, nombre, telefono),
        turno_original:turno_programacion (
          *,
          tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin)
        )
      `)
      .eq('id_intercambio', idIntercambio)
      .single()

    if (error) throw error
    return data
  }

  // Obtener disponibilidad de empleados para una fecha
  async obtenerDisponibilidadEmpleados(fecha) {
    const { data: empleados, error: errorEmpleados } = await supabase
      .from('empleado')
      .select('id_empleado, nombre, telefono')
      .eq('rol', 'empleado')

    if (errorEmpleados) throw errorEmpleados

    const { data: turnosDia, error: errorTurnos } = await supabase
      .from('turno_programacion')
      .select(`
        id_empleado,
        tipo_turno:turno_tipo(hora_inicio, hora_fin)
      `)
      .eq('fecha', fecha)
      .eq('estado', 'programado')

    if (errorTurnos) throw errorTurnos

    // Calcular horas asignadas por empleado
    const empleadosConHoras = empleados.map(empleado => {
      const turnosEmpleado = turnosDia.filter(t => t.id_empleado === empleado.id_empleado)
      const horasAsignadas = turnosEmpleado.reduce((total, turno) => {
        const inicio = new Date(`2000-01-01 ${turno.tipo_turno.hora_inicio}`)
        const fin = new Date(`2000-01-01 ${turno.tipo_turno.hora_fin}`)
        return total + (fin - inicio) / (1000 * 60 * 60)
      }, 0)

      return {
        ...empleado,
        horas_asignadas: horasAsignadas,
        turnos_asignados: turnosEmpleado.length,
        disponible: horasAsignadas < 8 // Máximo 8 horas por día
      }
    })

    return empleadosConHoras
  }

  // Obtener reporte de asistencia vs turnos
  async obtenerReporteAsistenciaTurnos(fechaInicio, fechaFin) {
    const { data: turnos, error: errorTurnos } = await supabase
      .from('turno_programacion')
      .select(`
        *,
        empleado:empleado(id_empleado, nombre),
        tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin),
        asistencia:asistencia(hora_entrada, hora_salida)
      `)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

    if (errorTurnos) throw errorTurnos

    // Calcular estadísticas
    const reporte = turnos.map(turno => {
      const asistencia = turno.asistencia[0]
      let estadoAsistencia = 'ausente'
      
      if (asistencia) {
        const horaEntradaTurno = new Date(`2000-01-01 ${turno.tipo_turno.hora_inicio}`)
        const horaSalidaTurno = new Date(`2000-01-01 ${turno.tipo_turno.hora_fin}`)
        const horaEntradaEmpleado = new Date(asistencia.hora_entrada)
        
        if (horaEntradaEmpleado <= horaEntradaTurno) {
          estadoAsistencia = 'puntual'
        } else if (horaEntradaEmpleado <= new Date(horaEntradaTurno.getTime() + 15 * 60 * 1000)) {
          estadoAsistencia = 'tarde'
        }
      }

      return {
        ...turno,
        estado_asistencia: estadoAsistencia,
        asistio: !!asistencia
      }
    })

    // Estadísticas generales
    const estadisticas = {
      total_turnos: reporte.length,
      turnos_asistidos: reporte.filter(t => t.asistio).length,
      turnos_ausentes: reporte.filter(t => !t.asistio).length,
      puntualidad: {
        puntuales: reporte.filter(t => t.estado_asistencia === 'puntual').length,
        tardanzas: reporte.filter(t => t.estado_asistencia === 'tarde').length,
        ausentes: reporte.filter(t => t.estado_asistencia === 'ausente').length
      }
    }

    return { reporte, estadisticas }
  }

  // Obtener calendario de turnos para vista mensual
  async obtenerCalendarioTurnos(año, mes) {
    const primerDia = new Date(año, mes - 1, 1)
    const ultimoDia = new Date(año, mes, 0)
    
    const { data, error } = await supabase
      .from('turno_programacion')
      .select(`
        *,
        empleado:empleado(id_empleado, nombre),
        tipo_turno:turno_tipo(nombre, hora_inicio, hora_fin, color)
      `)
      .gte('fecha', primerDia.toISOString().split('T')[0])
      .lte('fecha', ultimoDia.toISOString().split('T')[0])
      .order('fecha', { ascending: true })
      .order('tipo_turno.hora_inicio', { ascending: true })

    if (error) throw error

    // Agrupar por día
    const calendario = data.reduce((acc, turno) => {
      const dia = turno.fecha
      if (!acc[dia]) {
        acc[dia] = []
      }
      acc[dia].push(turno)
      return acc
    }, {})

    return calendario
  }
}

export const turnosService = new TurnosService()
