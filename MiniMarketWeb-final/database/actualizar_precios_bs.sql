-- Actualizar precios de productos a Bolivianos (Bs)
-- Factor de conversión: 1 USD = 7 Bs (aproximado)

-- Actualizar precios de productos existentes
UPDATE producto 
SET precio = ROUND(precio * 7, 2);

-- Actualizar totales de ventas existentes
UPDATE venta 
SET total = ROUND(total * 7, 2);

-- Actualizar precios unitarios en detalles de venta
UPDATE detalle_venta 
SET precio_unitario = ROUND(precio_unitario * 7, 2);

-- Actualizar montos en promociones
UPDATE promocion 
SET descuento = ROUND(descuento * 7, 2);

-- Actualizar montos en devoluciones
UPDATE devolucion_detalle 
SET monto_reembolso = ROUND(monto_reembolso * 7, 2);

-- Actualizar montos en promociones avanzadas
UPDATE promocion_avanzada 
SET 
    monto_descuento = ROUND(monto_descuento * 7, 2),
    minimo_compra = ROUND(minimo_compra * 7, 2);

-- Actualizar precios especiales en detalles de promociones
UPDATE promocion_detalle 
SET precio_especial = ROUND(precio_especial * 7, 2);

-- Actualizar montos en nomina
UPDATE nomina_detalle 
SET 
    sueldo_base = ROUND(sueldo_base * 7, 2),
    bonificaciones = ROUND(bonificaciones * 7, 2),
    deducciones = ROUND(deducciones * 7, 2),
    sueldo_neto = ROUND(sueldo_neto * 7, 2);

-- Actualizar montos en deducciones
UPDATE deduccion 
SET monto = ROUND(monto * 7, 2);

-- Actualizar montos en bonos
UPDATE bono 
SET monto = ROUND(monto * 7, 2);

-- Actualizar montos en recompensas
UPDATE recompensa 
SET puntos_requeridos = ROUND(puntos_requeridos * 7, 2);

-- Actualizar montos en canjes
UPDATE canje 
SET puntos_utilizados = ROUND(puntos_utilizados * 7, 2);

-- Actualizar montos en puntos de clientes
UPDATE puntos_cliente 
SET puntos_ganados = ROUND(puntos_ganados * 7, 2);

-- Actualizar créditos de clientes
UPDATE cliente 
SET credito = ROUND(credito * 7, 2);

-- Confirmar cambios
SELECT 'Precios actualizados a Bolivianos (Bs)' as mensaje;
