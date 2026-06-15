import { supabase } from './supabase'

class NominaService {
  // Obtener configuración de nómina
  async obtenerConfiguracionNomina() {
    const { data, error } = await supabase
      .from('nomina_configuracion')
      .select('*')
      .eq('activo', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Crear o actualizar configuración de nómina
  async guardarConfiguracionNomina(configuracion) {
    const { data, error } = await supabase
      .from('nomina_configuracion')
      .upsert([configuracion])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener períodos de nómina
  async obtenerPeriodosNomina() {
    const { data, error } = await supabase
      .from('nomina_periodo')
      .select('*')
      .order('fecha_inicio', { ascending: false })

    if (error) throw error
    return data
  }

  // Crear nuevo período de nómina
  async crearPeriodoNomina(periodo) {
    const { data, error } = await supabase
      .from('nomina_periodo')
      .insert([periodo])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener detalles de nómina de un período
  async obtenerDetallesNomina(idPeriodo) {
    const { data, error } = await supabase
      .from('nomina_detalle')
      .select(`
        *,
        empleado:empleado(id_empleado, nombre, telefono, fecha_ingreso)
      `)
      .eq('id_periodo', idPeriodo)
      .order('empleado.nombre', { ascending: true })

    if (error) throw error
    return data
  }

  // Calcular nómina para un período
  async calcularNominaPeriodo(idPeriodo) {
    const periodo = await this.obtenerDetallePeriodo(idPeriodo)
    const configuracion = await this.obtenerConfiguracionNomina()
    
    if (!configuracion) {
      throw new Error('No hay configuración de nómina activa')
    }

    // Obtener empleados activos
    const { data: empleados, error: errorEmpleados } = await supabase
      .from('empleado')
      .select('*')
      .eq('rol', 'empleado')

    if (errorEmpleados) throw errorEmpleados

    const detallesNomina = []

    for (const empleado of empleados) {
      const detalle = await this.calcularNominaEmpleado(
        empleado, 
        periodo, 
        configuracion
      )
      detallesNomina.push(detalle)
    }

    // Guardar detalles en la base de datos
    const { data, error } = await supabase
      .from('nomina_detalle')
      .upsert(detallesNomina, {
        onConflict: 'id_periodo, id_empleado'
      })
      .select(`
        *,
        empleado:empleado(nombre)
      `)

    if (error) throw error

    // Actualizar total del período
    const totalNomina = detallesNomina.reduce((sum, d) => sum + d.total_neto, 0)
    await supabase
      .from('nomina_periodo')
      .update({ total_nomina: totalNomina })
      .eq('id_periodo', idPeriodo)

    return data
  }

  // Calcular nómina individual de un empleado
  async calcularNominaEmpleado(empleado, periodo, configuracion) {
    // Obtener asistencia del período
    const { data: asistencias, error: errorAsistencias } = await supabase
      .from('asistencia')
      .select('*')
      .eq('id_empleado', empleado.id_empleado)
      .gte('fecha', periodo.fecha_inicio)
      .lte('fecha', periodo.fecha_fin)

    if (errorAsistencias) throw errorAsistencias

    // Obtener turnos programados
    const { data: turnos, error: errorTurnos } = await supabase
      .from('turno_programacion')
      .select(`
        *,
        tipo_turno:turno_tipo(hora_inicio, hora_fin)
      `)
      .eq('id_empleado', empleado.id_empleado)
      .gte('fecha', periodo.fecha_inicio)
      .lte('fecha', periodo.fecha_fin)
      .eq('estado', 'cumplido')

    if (errorTurnos) throw errorTurnos

    // Calcular horas trabajadas
    let horasTrabajadas = 0
    let diasTrabajados = 0
    let tardanzas = 0
    let ausencias = 0

    // Calcular basado en turnos cumplidos
    turnos.forEach(turno => {
      const horaInicio = new Date(`2000-01-01 ${turno.tipo_turno.hora_inicio}`)
      const horaFin = new Date(`2000-01-01 ${turno.tipo_turno.hora_fin}`)
      const horasDia = (horaFin - horaInicio) / (1000 * 60 * 60)
      
      horasTrabajadas += horasDia
      diasTrabajados++

      // Verificar tardanza en asistencia
      const asistencia = asistencias.find(a => a.fecha === turno.fecha)
      if (asistencia && asistencia.hora_entrada) {
        const horaEntrada = new Date(asistencia.hora_entrada)
        if (horaEntrada > new Date(horaInicio.getTime() + 15 * 60 * 1000)) {
          tardanzas++
        }
      }
    })

    // Contar ausencias (turnos no cumplidos)
    const { data: turnosProgramados } = await supabase
      .from('turno_programacion')
      .select('*')
      .eq('id_empleado', empleado.id_empleado)
      .gte('fecha', periodo.fecha_inicio)
      .lte('fecha', periodo.fecha_fin)
      .eq('estado', 'programado')

    ausencias = turnosProgramados.length - diasTrabajados

    // Calcular salarios
    const salarioBase = configuracion.salario_base
    const salarioDiario = salarioBase / 30 // Salario diario base
    const salarioPorHora = salarioBase / (8 * 22) // 8 horas/día, 22 días/mes promedio

    // Cálculo de bonos
    let bonos = 0
    
    // Bono de asistencia (100% si no hay ausencias)
    if (ausencias === 0 && diasTrabajados > 0) {
      bonos += configuracion.bono_asistencia || 0
    }

    // Bono de puntualidad (100% si no hay tardanzas)
    if (tardanzas === 0 && diasTrabajados > 0) {
      bonos += configuracion.bono_puntualidad || 0
    }

    // Cálculo de descuentos
    let descuentos = 0
    
    // Descuento por tardanzas
    descuentos += tardanzas * (configuracion.descuento_tardanza || 0)
    
    // Descuento por ausencias
    descuentos += ausencias * (configuracion.descuento_ausencia || 0)

    // Obtener deducciones y bonos adicionales
    const deduccionesAdicionales = await this.obtenerDeduccionesActivas()
    const bonosAdicionales = await this.obtenerBonosActivos()

    // Aplicar deducciones adicionales
    deduccionesAdicionales.forEach(deduccion => {
      if (deduccion.tipo === 'fijo') {
        descuentos += deduccion.valor
      } else if (deduccion.tipo === 'porcentaje') {
        descuentos += salarioBase * (deduccion.valor / 100)
      }
    })

    // Aplicar bonos adicionales (ej: bono por productividad, antigüedad, etc.)
    bonosAdicionales.forEach(bono => {
      if (bono.tipo === 'fijo') {
        bonos += bono.valor
      } else if (bono.tipo === 'porcentaje') {
        bonos += salarioBase * (bono.valor / 100)
      } else if (bono.tipo === 'hora') {
        bonos += bono.valor * horasTrabajadas
      }
    })

    // Calcular total neto
    const salarioCalculado = salarioPorHora * horasTrabajadas
    const totalNeto = salarioCalculado + bonos - descuentos

    return {
      id_periodo: periodo.id_periodo,
      id_empleado: empleado.id_empleado,
      salario_base: salarioBase,
      horas_trabajadas: horasTrabajadas,
      dias_trabajados: diasTrabajados,
      bonos: bonos,
      descuentos: descuentos,
      total_neto: Math.max(0, totalNeto),
      observaciones: `Horas: ${horasTrabajadas.toFixed(1)}, Días: ${diasTrabajados}, Tardanzas: ${tardanzas}, Ausencias: ${ausencias}`
    }
  }

  // Obtener detalle de un período
  async obtenerDetallePeriodo(idPeriodo) {
    const { data, error } = await supabase
      .from('nomina_periodo')
      .select('*')
      .eq('id_periodo', idPeriodo)
      .single()

    if (error) throw error
    return data
  }

  // Procesar nómina (cerrar período)
  async procesarNomina(idPeriodo) {
    // Primero calcular la nómina
    await this.calcularNominaPeriodo(idPeriodo)

    // Actualizar estado del período
    const { data, error } = await supabase
      .from('nomina_periodo')
      .update({
        estado: 'cerrado',
        fecha_proceso: new Date().toISOString()
      })
      .eq('id_periodo', idPeriodo)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener deducciones activas
  async obtenerDeducciones() {
    const { data, error } = await supabase
      .from('deduccion')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return data
  }

  // Obtener solo deducciones activas
  async obtenerDeduccionesActivas() {
    const { data, error } = await supabase
      .from('deduccion')
      .select('*')
      .eq('activa', true)

    if (error) throw error
    return data
  }

  // Crear nueva deducción
  async crearDeduccion(deduccion) {
    const { data, error } = await supabase
      .from('deduccion')
      .insert([deduccion])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener bonos activos
  async obtenerBonos() {
    const { data, error } = await supabase
      .from('bono')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return data
  }

  // Obtener solo bonos activos
  async obtenerBonosActivos() {
    const { data, error } = await supabase
      .from('bono')
      .select('*')
      .eq('activa', true)

    if (error) throw error
    return data
  }

  // Crear nuevo bono
  async crearBono(bono) {
    const { data, error } = await supabase
      .from('bono')
      .insert([bono])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener reporte de nómina
  async obtenerReporteNomina(idPeriodo) {
    const detalles = await this.obtenerDetallesNomina(idPeriodo)
    const periodo = await this.obtenerDetallePeriodo(idPeriodo)

    // Calcular totales y estadísticas
    const totales = detalles.reduce((acc, detalle) => {
      acc.total_salarios += detalle.salario_base
      acc.total_horas += detalle.horas_trabajadas
      acc.total_bonos += detalle.bonos
      acc.total_descuentos += detalle.descuentos
      acc.total_neto += detalle.total_neto
      acc.total_empleados++
      return acc
    }, {
      total_salarios: 0,
      total_horas: 0,
      total_bonos: 0,
      total_descuentos: 0,
      total_neto: 0,
      total_empleados: 0
    })

    // Estadísticas adicionales
    const estadisticas = {
      promedio_salario: totales.total_salarios / totales.total_empleados,
      promedio_horas: totales.total_horas / totales.total_empleados,
      promedio_bonos: totales.total_bonos / totales.total_empleados,
      promedio_descuentos: totales.total_descuentos / totales.total_empleados,
      promedio_neto: totales.total_neto / totales.total_empleados,
      porcentaje_bonos: (totales.total_bonos / totales.total_salarios) * 100,
      porcentaje_descuentos: (totales.total_descuentos / totales.total_salarios) * 100
    }

    return {
      periodo,
      detalles,
      totales,
      estadisticas
    }
  }

  // Obtener historial de nómina de un empleado
  async obtenerHistorialNominaEmpleado(idEmpleado, limit = 12) {
    const { data, error } = await supabase
      .from('nomina_detalle')
      .select(`
        *,
        nomina_periodo:nomina_periodo(nombre, fecha_inicio, fecha_fin, estado)
      `)
      .eq('id_empleado', idEmpleado)
      .order('nomina_periodo.fecha_inicio', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // Generar reporte anual de nómina
  async generarReporteAnual(año) {
    const fechaInicio = `${año}-01-01`
    const fechaFin = `${año}-12-31`

    const { data: periodos, error } = await supabase
      .from('nomina_periodo')
      .select('*')
      .gte('fecha_inicio', fechaInicio)
      .lte('fecha_fin', fechaFin)
      .eq('estado', 'cerrado')
      .order('fecha_inicio', { ascending: true })

    if (error) throw error

    const reporteAnual = []

    for (const periodo of periodos) {
      const reportePeriodo = await this.obtenerReporteNomina(periodo.id_periodo)
      reporteAnual.push({
        ...reportePeriodo,
        periodo: periodo
      })
    }

    // Calcular totales anuales
    const totalesAnuales = reporteAnual.reduce((acc, reporte) => {
      acc.total_nomina += reporte.totales.total_neto
      acc.total_empleados += reporte.totales.total_empleados
      acc.total_horas += reporte.totales.total_horas
      acc.total_bonos += reporte.totales.total_bonos
      acc.total_descuentos += reporte.totales.total_descuentos
      return acc
    }, {
      total_nomina: 0,
      total_empleados: 0,
      total_horas: 0,
      total_bonos: 0,
      total_descuentos: 0
    })

    return {
      año,
      periodos: reporteAnual,
      totales_anuales: totalesAnuales,
      promedio_mensual_nomina: totalesAnuales.total_nomina / reporteAnual.length,
      promedio_anual_empleado: totalesAnuales.total_nomina / (totalesAnuales.total_empleados / reporteAnual.length)
    }
  }

  // Eliminar período de nómina (solo si está abierto)
  async eliminarPeriodoNomina(idPeriodo) {
    const periodo = await this.obtenerDetallePeriodo(idPeriodo)
    
    if (periodo.estado === 'cerrado') {
      throw new Error('No se puede eliminar un período de nómina cerrado')
    }

    // Eliminar detalles primero
    await supabase
      .from('nomina_detalle')
      .delete()
      .eq('id_periodo', idPeriodo)

    // Eliminar período
    const { data, error } = await supabase
      .from('nomina_periodo')
      .delete()
      .eq('id_periodo', idPeriodo)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Exportar nómina a formato Excel (preparación para frontend)
  async prepararExportacionNomina(idPeriodo) {
    const reporte = await this.obtenerReporteNomina(idPeriodo)
    
    const datosExportacion = reporte.detalles.map(detalle => ({
      'Empleado': detalle.empleado.nombre,
      'ID Empleado': detalle.id_empleado,
      'Salario Base': detalle.salario_base.toFixed(2),
      'Horas Trabajadas': detalle.horas_trabajadas.toFixed(1),
      'Días Trabajados': detalle.dias_trabajados,
      'Bonos': detalle.bonos.toFixed(2),
      'Descuentos': detalle.descuentos.toFixed(2),
      'Total Neto': detalle.total_neto.toFixed(2),
      'Observaciones': detalle.observaciones
    }))

    // Agregar totales
    datosExportacion.push({
      'Empleado': 'TOTALES',
      'Salario Base': reporte.totales.total_salarios.toFixed(2),
      'Horas Trabajadas': reporte.totales.total_horas.toFixed(1),
      'Días Trabajados': '-',
      'Bonos': reporte.totales.total_bonos.toFixed(2),
      'Descuentos': reporte.totales.total_descuentos.toFixed(2),
      'Total Neto': reporte.totales.total_neto.toFixed(2),
      'Observaciones': `${reporte.totales.total_empleados} empleados`
    })

    return {
      periodo: reporte.periodo,
      datos: datosExportacion,
      estadisticas: reporte.estadisticas
    }
  }
}

export const nominaService = new NominaService()
