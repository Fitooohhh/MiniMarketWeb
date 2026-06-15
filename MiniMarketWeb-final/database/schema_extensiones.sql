-- Extensiones de BD para nuevas funcionalidades

-- Crear secuencias explícitamente
CREATE SEQUENCE IF NOT EXISTS promocion_avanzada_id_promocion_seq;
CREATE SEQUENCE IF NOT EXISTS promocion_detalle_id_detalle_seq;
CREATE SEQUENCE IF NOT EXISTS cupon_id_cupon_seq;
CREATE SEQUENCE IF NOT EXISTS programa_lealtad_id_programa_seq;
CREATE SEQUENCE IF NOT EXISTS nivel_cliente_id_nivel_seq;
CREATE SEQUENCE IF NOT EXISTS puntos_cliente_id_puntos_seq;
CREATE SEQUENCE IF NOT EXISTS recompensa_id_recompensa_seq;
CREATE SEQUENCE IF NOT EXISTS canje_id_canje_seq;
CREATE SEQUENCE IF NOT EXISTS politica_devolucion_id_politica_seq;
CREATE SEQUENCE IF NOT EXISTS devolucion_detalle_id_devolucion_detalle_seq;
CREATE SEQUENCE IF NOT EXISTS turno_tipo_id_turno_tipo_seq;
CREATE SEQUENCE IF NOT EXISTS turno_programacion_id_turno_seq;
CREATE SEQUENCE IF NOT EXISTS intercambio_turno_id_intercambio_seq;
CREATE SEQUENCE IF NOT EXISTS nomina_configuracion_id_config_seq;
CREATE SEQUENCE IF NOT EXISTS nomina_periodo_id_periodo_seq;
CREATE SEQUENCE IF NOT EXISTS nomina_detalle_id_detalle_seq;
CREATE SEQUENCE IF NOT EXISTS deduccion_id_deduccion_seq;
CREATE SEQUENCE IF NOT EXISTS bono_id_bono_seq;

-- Gestión de Promociones Avanzada
CREATE TABLE promocion_avanzada (
    id_promocion integer PRIMARY KEY DEFAULT nextval('promocion_avanzada_id_promocion_seq'),
    nombre text NOT NULL,
    tipo text NOT NULL CHECK (tipo IN ('descuento', '2x1', 'combo', 'cupon')),
    descripcion text,
    condiciones text,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    activa boolean DEFAULT true,
    limite_usos integer,
    usos_actuales integer DEFAULT 0,
    descuento_porcentaje numeric CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    monto_descuento numeric CHECK (monto_descuento >= 0),
    minimo_compra numeric DEFAULT 0,
    creado_por integer REFERENCES usuario(id_usuario),
    fecha_creacion timestamp DEFAULT now()
);

-- Detalles de promociones (productos específicos)
CREATE TABLE promocion_detalle (
    id_detalle integer PRIMARY KEY DEFAULT nextval('promocion_detalle_id_detalle_seq'),
    id_promocion integer REFERENCES promocion_avanzada(id_promocion) ON DELETE CASCADE,
    id_producto integer REFERENCES producto(id_producto),
    cantidad_requerida integer DEFAULT 1,
    cantidad_regalo integer DEFAULT 0,
    precio_especial numeric,
    obligatorio boolean DEFAULT true
);

-- Cupones generados
CREATE TABLE cupon (
    id_cupon integer PRIMARY KEY DEFAULT nextval('cupon_id_cupon_seq'),
    id_promocion integer REFERENCES promocion_avanzada(id_promocion),
    codigo text UNIQUE NOT NULL,
    id_cliente integer REFERENCES cliente(id_cliente),
    usado boolean DEFAULT false,
    fecha_uso timestamp,
    fecha_vencimiento date,
    limite_usos integer DEFAULT 1,
    usos_actuales integer DEFAULT 0
);

-- Programa de Lealtad
CREATE TABLE programa_lealtad (
    id_programa integer PRIMARY KEY DEFAULT nextval('programa_lealtad_id_programa_seq'),
    nombre text NOT NULL,
    puntos_por_dolar numeric DEFAULT 1,
    puntos_minimos_canje integer DEFAULT 100,
    activo boolean DEFAULT true,
    fecha_creacion timestamp DEFAULT now()
);

-- Niveles de cliente
CREATE TABLE nivel_cliente (
    id_nivel integer PRIMARY KEY DEFAULT nextval('nivel_cliente_id_nivel_seq'),
    nombre text NOT NULL,
    puntos_minimos integer NOT NULL,
    beneficios text,
    multiplicador_puntos numeric DEFAULT 1,
    descuento_especial numeric DEFAULT 0
);

-- Puntos de cliente
CREATE TABLE puntos_cliente (
    id_puntos integer PRIMARY KEY DEFAULT nextval('puntos_cliente_id_puntos_seq'),
    id_cliente integer REFERENCES cliente(id_cliente),
    id_venta integer REFERENCES venta(id_venta),
    puntos_ganados integer NOT NULL,
    puntos_usados integer DEFAULT 0,
    saldo_anterior integer DEFAULT 0,
    saldo_actual integer NOT NULL,
    fecha timestamp DEFAULT now(),
    concepto text
);

-- Recompensas canjeables
CREATE TABLE recompensa (
    id_recompensa integer PRIMARY KEY DEFAULT nextval('recompensa_id_recompensa_seq'),
    nombre text NOT NULL,
    descripcion text,
    puntos_requeridos integer NOT NULL,
    tipo text NOT NULL CHECK (tipo IN ('descuento', 'producto', 'servicio')),
    valor numeric,
    id_producto_relacionado integer REFERENCES producto(id_producto),
    activa boolean DEFAULT true,
    stock_ilimitado boolean DEFAULT true,
    stock_disponible integer DEFAULT 0
);

-- Canjes realizados
CREATE TABLE canje (
    id_canje integer PRIMARY KEY DEFAULT nextval('canje_id_canje_seq'),
    id_cliente integer REFERENCES cliente(id_cliente),
    id_recompensa integer REFERENCES recompensa(id_recompensa),
    puntos_utilizados integer NOT NULL,
    fecha_canje timestamp DEFAULT now(),
    estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'usado', 'expirado')),
    fecha_vencimiento date
);

-- Gestión de Devoluciones Avanzada
CREATE TABLE politica_devolucion (
    id_politica integer PRIMARY KEY DEFAULT nextval('politica_devolucion_id_politica_seq'),
    nombre text NOT NULL,
    dias_maximos integer NOT NULL,
    condicion_producto text,
    requiere_factura boolean DEFAULT true,
    porcentaje_reembolso numeric DEFAULT 100,
    credito_tienda boolean DEFAULT false,
    activa boolean DEFAULT true
);

CREATE TABLE devolucion_detalle (
    id_devolucion_detalle integer PRIMARY KEY DEFAULT nextval('devolucion_detalle_id_devolucion_detalle_seq'),
    id_devolucion integer REFERENCES devolucion(id_devolucion) ON DELETE CASCADE,
    id_detalle_venta integer REFERENCES detalle_venta(id_detalle_venta),
    cantidad_devuelta integer NOT NULL,
    motivo text NOT NULL,
    estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'procesada')),
    id_empleado_autoriza integer REFERENCES empleado(id_empleado),
    fecha_autorizacion timestamp,
    tipo_reembolso text CHECK (tipo_reembolso IN ('efectivo', 'credito_tienda', 'transferencia')),
    monto_reembolso numeric
);

-- Gestión de Turnos Avanzada
CREATE TABLE turno_tipo (
    id_turno_tipo integer PRIMARY KEY DEFAULT nextval('turno_tipo_id_turno_tipo_seq'),
    nombre text NOT NULL,
    hora_inicio time NOT NULL,
    hora_fin time NOT NULL,
    descripcion text,
    color text DEFAULT '#6366f1'
);

CREATE TABLE turno_programacion (
    id_turno integer PRIMARY KEY DEFAULT nextval('turno_programacion_id_turno_seq'),
    id_empleado integer REFERENCES empleado(id_empleado),
    id_turno_tipo integer REFERENCES turno_tipo(id_turno_tipo),
    fecha date NOT NULL,
    estado text DEFAULT 'programado' CHECK (estado IN ('programado', 'confirmado', 'cumplido', 'ausente', 'cancelado')),
    notas text,
    creado_por integer REFERENCES usuario(id_usuario),
    fecha_creacion timestamp DEFAULT now(),
    UNIQUE(id_empleado, fecha, id_turno_tipo)
);

CREATE TABLE intercambio_turno (
    id_intercambio integer PRIMARY KEY DEFAULT nextval('intercambio_turno_id_intercambio_seq'),
    id_turno_original integer REFERENCES turno_programacion(id_turno),
    id_empleado_solicita integer REFERENCES empleado(id_empleado),
    id_empleado_destino integer REFERENCES empleado(id_empleado),
    fecha_intercambio date NOT NULL,
    estado text DEFAULT 'solicitado' CHECK (estado IN ('solicitado', 'aceptado', 'rechazado', 'cancelado')),
    motivo text,
    fecha_respuesta timestamp
);

-- Nómina y Sueldos
CREATE TABLE nomina_configuracion (
    id_config integer PRIMARY KEY DEFAULT nextval('nomina_configuracion_id_config_seq'),
    nombre text NOT NULL,
    salario_base numeric NOT NULL,
    hora_entrada time DEFAULT '08:00:00',
    hora_salida time DEFAULT '17:00:00',
    dias_laborales integer DEFAULT 5,
    bono_puntualidad numeric DEFAULT 0,
    bono_asistencia numeric DEFAULT 0,
    descuento_tardanza numeric DEFAULT 0,
    descuento_ausencia numeric DEFAULT 0,
    activo boolean DEFAULT true
);

CREATE TABLE nomina_periodo (
    id_periodo integer PRIMARY KEY DEFAULT nextval('nomina_periodo_id_periodo_seq'),
    nombre text NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    estado text DEFAULT 'abierto' CHECK (estado IN ('abierto', 'procesando', 'cerrado')),
    fecha_proceso timestamp,
    total_nomina numeric DEFAULT 0
);

CREATE TABLE nomina_detalle (
    id_detalle integer PRIMARY KEY DEFAULT nextval('nomina_detalle_id_detalle_seq'),
    id_periodo integer REFERENCES nomina_periodo(id_periodo),
    id_empleado integer REFERENCES empleado(id_empleado),
    salario_base numeric NOT NULL,
    horas_trabajadas numeric DEFAULT 0,
    bonos numeric DEFAULT 0,
    descuentos numeric DEFAULT 0,
    total_neto numeric NOT NULL,
    fecha_calculo timestamp DEFAULT now(),
    observaciones text
);

CREATE TABLE deduccion (
    id_deduccion integer PRIMARY KEY DEFAULT nextval('deduccion_id_deduccion_seq'),
    nombre text NOT NULL,
    tipo text CHECK (tipo IN ('fijo', 'porcentaje')),
    valor numeric NOT NULL,
    descripcion text,
    activo boolean DEFAULT true
);

CREATE TABLE bono (
    id_bono integer PRIMARY KEY DEFAULT nextval('bono_id_bono_seq'),
    nombre text NOT NULL,
    tipo text CHECK (tipo IN ('fijo', 'porcentaje', 'hora')),
    valor numeric NOT NULL,
    condiciones text,
    activo boolean DEFAULT true
);

-- Actualizar tabla cliente para incluir nivel de lealtad
ALTER TABLE cliente ADD COLUMN id_nivel_actual integer REFERENCES nivel_cliente(id_nivel);
ALTER TABLE cliente ADD COLUMN puntos_acumulados integer DEFAULT 0;
ALTER TABLE cliente ADD COLUMN fecha_ultimo_canje date;

-- Actualizar tabla promocion existente para compatibilidad
ALTER TABLE promocion ADD COLUMN tipo_promocion text CHECK (tipo_promocion IN ('simple', 'avanzada'));
UPDATE promocion SET tipo_promocion = 'simple' WHERE tipo_promocion IS NULL;
ALTER TABLE promocion ALTER COLUMN tipo_promocion SET NOT NULL;

-- Índices para mejor rendimiento
CREATE INDEX idx_promocion_avanzada_activa ON promocion_avanzada(activa, fecha_inicio, fecha_fin);
CREATE INDEX idx_cupon_codigo ON cupon(codigo);
CREATE INDEX idx_puntos_cliente_fecha ON puntos_cliente(id_cliente, fecha);
CREATE INDEX idx_devolucion_detalle_estado ON devolucion_detalle(estado);
CREATE INDEX idx_turno_programacion_fecha ON turno_programacion(fecha, estado);
CREATE INDEX idx_nomina_detalle_periodo ON nomina_detalle(id_periodo, id_empleado);
