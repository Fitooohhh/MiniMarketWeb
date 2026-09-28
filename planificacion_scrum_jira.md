# PLANIFICACIÓN SCRUM COMPLETA Y GUÍA DE CONFIGURACIÓN DE JIRA
## PROYECTO: SISTEMA WEB MINIMARKET (REACT + SUPABASE)

Este documento detalla la estructura completa de Scrum para un equipo de **4 personas**, definiendo roles, la configuración detallada de Sprints, el Product Backlog prioritario con puntos de historia (Fibonacci) y el diseño de la tabla para construir tu **Burndown Chart** (Gráfico de Trabajo Pendiente).

---

## 1. ROLES Y RESPONSABILIDADES (SCRUM GUIDE 2020)
Para un equipo de 4 desarrolladores, los roles se distribuyen de la siguiente manera para asegurar el auto-diseño y la multifuncionalidad:

*   **Integrante 1: Product Owner (PO) / Full-stack Developer** Fibio
    *   *Responsabilidad Scrum:* Maximizar el valor del producto, gestionar y priorizar el Product Backlog. Define los Criterios de Aceptación de las historias de usuario.
*   **Integrante 2: Scrum Master (SM) / Frontend Developer** Fito
    *   *Responsabilidad Scrum:* Fomentar la adopción de Scrum, guiar al equipo eliminando impedimentos, facilitar las ceremonias (Dailies, Planning, Retrospective) y monitorear el Burndown Chart.
*   **Integrante 3: Database & Backend Developer (Supabase Expert)** Gonti
    *   *Responsabilidad Scrum:* Garantizar la consistencia, integridad de los datos en PostgreSQL/Supabase, reglas de seguridad de datos (RLS) y API del backend.
*   **Integrante 4: Frontend Developer & QA Tester (Vitest / UI Expert)** Abdi
    *   *Responsabilidad Scrum:* Diseñar las interfaces responsivas (TailwindCSS) en React, implementar pruebas unitarias/de integración y asegurar la usabilidad.

---

## 2. PLANIFICACIÓN DE SPRINTS (4 SPRINTS DE 2 SEMANAS C/U)

### SPRINT 1: Cimientos de Datos & CRUD Base (Objetivo: Base de Datos y Login)
*   **Objetivo del Sprint:** Modelar la base de datos completa en Supabase y tener la interfaz de autenticación funcional junto con el CRUD básico de productos.
*   **Capacidad estimada:** 40 Story Points (10 SP por persona).

### SPRINT 2: Core Transaccional (Objetivo: Punto de Venta POS e Inventario)
*   **Objetivo del Sprint:** Implementar el carrito del cajero, generación de comprobantes con QR y alertas críticas de reabastecimiento.
*   **Capacidad estimada:** 36 Story Points.

### SPRINT 3: Recursos Humanos, Nómina y Fidelización (Objetivo: Asistencia, Sueldos y Puntos)
*   **Objetivo del Sprint:** Implementar el reloj marcador digital, turnos, liquidación de haberes y el programa de puntos de lealtad.
*   **Capacidad estimada:** 38 Story Points.

### SPRINT 4: Logística, Devoluciones y QA (Objetivo: Delivery, Devoluciones e Integración)
*   **Objetivo del Sprint:** Desarrollar el panel de repartos del delivery, módulo de reembolsos y ejecución de la suite de pruebas unitarias en Vitest.
*   **Capacidad estimada:** 32 Story Points.

---

## 3. PRODUCT BACKLOG PRIORIZADO (MÉTODO MoSCoW & STORY POINTS)

A continuación se detalla la lista de Historias de Usuario (US) listas para registrar en Jira:

| ID Jira | Historia de Usuario (US) / Tarea | Sprint | Prioridad (MoSCoW) | Estimación (SP) | Responsable Asignado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **MINI-01** | Como Administrador quiero poder loguearme con mi usuario y contraseña para acceder al panel seguro. | Sprint 1 | **Must** | 3 | Integrante 3 (Backend) | Redirección correcta según rol; error en credenciales inválidas. |
*   **MINI-02** | Como Desarrollador quiero diseñar el esquema físico de BD relacional en Supabase para persistir los datos de negocio. | Sprint 1 | **Must** | 8 | Integrante 3 (Backend) | DDL ejecutado con constraints, FKs de usuario, producto y venta. |
*   **MINI-03** | Como Empleado quiero registrar nuevos productos con su código, precio y stock inicial. | Sprint 1 | **Must** | 5 | Integrante 2 (Frontend) | Validación de campos numéricos obligatorios; guardado en la BD. |
*   **MINI-04** | Como Cliente quiero registrarme con mis datos personales para crear una cuenta en el sistema. | Sprint 1 | **Must** | 5 | Integrante 4 (UI/QA) | Formulario completo; encriptación segura y creación de registro en tabla `cliente`. |
*   **MINI-05** | Como Cajero quiero buscar productos por nombre o código para agregarlos ágilmente al carrito del POS. | Sprint 2 | **Must** | 5 | Integrante 2 (Frontend) | Búsqueda reactiva instantánea; actualización del subtotal al cambiar cantidad. |
*   **MINI-06** | Como Cajero quiero completar una venta cobrando y generando un ticket digital con código QR. | Sprint 2 | **Must** | 8 | Integrante 3 (Backend) | Descuento automático de stock; generación del QR con la URL del comprobante. |
*   **MINI-07** | Como Administrador quiero visualizar alertas visuales de stock bajo para reabastecer a tiempo. | Sprint 2 | **Should** | 3 | Integrante 4 (UI/QA) | Alerta visible si el stock es menor a 5 unidades; listado de alertas. |
*   **MINI-08** | Como Empleado quiero marcar digitalmente mi entrada y salida para registrar mis horas laboradas. | Sprint 3 | **Must** | 5 | Integrante 2 (Frontend) | Registro de hora exacta con fecha del servidor; validación de tardanzas en base al turno. |
*   **MINI-09** | Como Administrador quiero configurar los parámetros de nómina (AFP, IVA, Bonos) para liquidar salarios netos. | Sprint 3 | **Should** | 8 | Integrante 1 (PO/Full) | Persistencia de la tabla de configuración; cálculo automático dinámico de comisiones. |
*   **MINI-10** | Como Cliente quiero acumular puntos por el 10% de mis compras para canjearlos en el futuro. | Sprint 3 | **Should** | 5 | Integrante 3 (Backend) | Actualización de puntos del cliente en base al total transaccionado. |
*   **MINI-11** | Como Repartidor quiero ver mis repartos asignados y marcarlos como "Entregado" para cerrar el ciclo de envío. | Sprint 4 | **Must** | 5 | Integrante 4 (UI/QA) | Pantalla adaptada a móviles con detalles de dirección; cambio de estado a en ruta/entregado. |
*   **MINI-12** | Como Cliente quiero solicitar la devolución de un producto dañado subiendo un justificativo. | Sprint 4 | **Should** | 5 | Integrante 2 (Frontend) | Validación de días transcurridos contra la política; formulario de solicitud de devolución. |
*   **MINI-13** | Como Diseñador de QA quiero ejecutar la suite de pruebas unitarias para garantizar cero regresión en los módulos críticos. | Sprint 4 | **Must** | 5 | Integrante 4 (UI/QA) | Vitest reportando 100% de éxito en flujos de compra y login. |

---

## 4. PLANTILLA PARA TU BURNDOWN CHART
Para cumplir con la actividad práctica de diseñar tu **Burndown Chart** basado en la complejidad estimada del backlog, utiliza los siguientes datos de ejemplo para tu gráfico del Sprint 1 (Total Story Points = 40 SP en 10 días de desarrollo):

### Tabla de Datos (Sprint 1 - 40 SP)

| Día del Sprint | Esfuerzo Ideal Restante (SP) | Esfuerzo Real Restante (SP) | Tareas Completadas del Backlog |
| :---: | :---: | :---: | :--- |
| **Día 0** (Inicio) | 40.0 | 40.0 | Ninguna (Sprint Planning completada) |
| **Día 1** | 36.0 | 40.0 | Desarrollo de mockup inicial de UI |
| **Día 2** | 32.0 | 37.0 | Registro de MINI-01 (Login admin maquetado) |
| **Día 3** | 28.0 | 32.0 | Completado MINI-01 (Backend e integración listos - 3 SP) |
| **Día 4** | 24.0 | 32.0 | Ajustes de servidor Supabase local |
| **Día 5** (Mitad) | 20.0 | 24.0 | Completado MINI-02 (BD completa migrada - 8 SP) |
| **Día 6** | 16.0 | 19.0 | Completado MINI-03 (CRUD de productos funcional - 5 SP) |
| **Día 7** | 12.0 | 14.0 | En desarrollo formulario de clientes |
| **Día 8** | 8.0 | 9.0 | Completado MINI-04 (Registro de clientes funcional - 5 SP) |
| **Día 9** | 4.0 | 3.0 | Pruebas integradas de Sprint 1 |
| **Día 10** (Fin) | 0.0 | 0.0 | Cierre de Sprint 1 y preparación de Sprint Review |

### Cómo graficarlo:
1.  Abre un archivo de Excel o la plantilla de Teams.
2.  Crea tres columnas: **Día**, **Línea Ideal (Ideal)** y **Línea Real (Actual)**.
3.  Inserta un **Gráfico de Líneas** para ver la clásica "X" de Scrum, donde la línea ideal desciende uniformemente de 40 a 0 y la línea real muestra el progreso diario real.

---

## 5. GUÍA PRÁCTICA PARA CONFIGURAR JIRA EN 5 MINUTOS

1.  **Crear el proyecto:** Ingresa a Jira, presiona "Crear proyecto", selecciona la plantilla **Scrum** y elige el tipo de proyecto "Administrado por el equipo".
2.  **Configurar los Sprints:**
    *   Ve a la vista **Backlog**.
    *   Haz clic en "Crear sprint" (crea 4 Sprints).
    *   Nombra cada sprint como `Sprint 1: Cimientos`, `Sprint 2: POS`, etc.
3.  **Cargar el Backlog:**
    *   Presiona el botón `+ Crear incidencia` (o Create Issue) dentro del Backlog.
    *   Registra las historias de usuario usando el título (ej. `Como Cajero quiero buscar productos por nombre o código...`).
    *   En la descripción, copia y pega los **Criterios de Aceptación**.
4.  **Estimar y Asignar:**
    *   Haz doble clic sobre cada incidencia para abrir sus detalles.
    *   En el campo **Estimación del esfuerzo** (Story Points / Puntos de Historia), ingresa la puntuación asignada (3, 5, 8).
    *   En el campo **Responsable**, asígnale el correo de uno de los 4 integrantes según la tabla.
5.  **Iniciar Sprint:**
    *   Arrastra las historias MINI-01 a MINI-04 dentro de la caja de `Sprint 1`.
    *   Haz clic en el botón superior derecho **Iniciar Sprint** (Start Sprint), define la duración (2 semanas) y ¡listo! Tu tablero Kanban Scrum estará activo para arrastrar tarjetas de *Por Hacer* a *En Progreso* y *Listo*.
