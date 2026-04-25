-- ============================================================
-- LUCELUX - Datos de ejemplo + marcar admin
-- Ejecuta en: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
  v_user_id       uuid;
  v_cliente1_id   uuid;
  v_cliente2_id   uuid;
  v_cliente3_id   uuid;
  v_cliente4_id   uuid;
  v_presup1_id    uuid;
  v_presup2_id    uuid;
  v_presup3_id    uuid;
  v_presup4_id    uuid;
BEGIN

  -- Obtener el user_id del admin
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jonalucena48@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Comprueba que el email es correcto.';
  END IF;

  -- ── MARCAR COMO ADMIN ──────────────────────────────────────
  UPDATE public.perfiles
  SET es_admin = true
  WHERE id = v_user_id;

  RAISE NOTICE 'Admin activado para %', v_user_id;

  -- ── CLIENTES DE EJEMPLO ────────────────────────────────────

  v_cliente1_id := gen_random_uuid();
  INSERT INTO public.clientes (id, usuario_id, nombre, telefono, email, direccion, ciudad, codigo_postal, tipo, notas, recurrente)
  VALUES (
    v_cliente1_id, v_user_id,
    'Manuel García López', '654 123 456', 'mgarcia@gmail.com',
    'Calle Mayor 12, 2ºA', 'Madrid', '28001',
    'particular', 'Cliente habitual. Prefiere contacto por WhatsApp.', true
  );

  v_cliente2_id := gen_random_uuid();
  INSERT INTO public.clientes (id, usuario_id, nombre, telefono, email, direccion, ciudad, codigo_postal, tipo, dni_nif, notas, recurrente)
  VALUES (
    v_cliente2_id, v_user_id,
    'Construcciones Pérez S.L.', '912 345 678', 'info@construccionesperez.es',
    'Polígono Industrial Norte, Nave 7', 'Getafe', '28901',
    'empresa', 'B-12345678', 'Empresa constructora. Pagos a 30 días. Proyectos grandes de comunidades.', true
  );

  v_cliente3_id := gen_random_uuid();
  INSERT INTO public.clientes (id, usuario_id, nombre, telefono, email, direccion, ciudad, codigo_postal, tipo, notas)
  VALUES (
    v_cliente3_id, v_user_id,
    'Ana Martínez Ruiz', '666 789 012', 'ana.martinez@hotmail.com',
    'Av. de la Constitución 45, 3ºB', 'Alcorcón', '28922',
    'particular', 'Primera reforma. Cambio ventanas piso completo.'
  );

  v_cliente4_id := gen_random_uuid();
  INSERT INTO public.clientes (id, usuario_id, nombre, telefono, email, direccion, ciudad, codigo_postal, tipo, dni_nif, notas, problematico)
  VALUES (
    v_cliente4_id, v_user_id,
    'Inmobiliaria Horizonte S.A.', '911 222 333', 'proyectos@horizontesa.com',
    'Gran Vía 55, 8ª planta', 'Madrid', '28013',
    'empresa', 'A-98765432', 'Retrasos en pagos. Exigir señal antes de fabricar.', true
  );

  -- ── PRESUPUESTOS DE EJEMPLO ────────────────────────────────

  -- Presupuesto 1: Aceptado y firmado
  v_presup1_id := gen_random_uuid();
  INSERT INTO public.presupuestos (
    id, usuario_id, cliente_id, titulo, descripcion,
    lineas, fecha, fecha_vencimiento, estado,
    subtotal_lineas, descuento_global, subtotal_con_descuento,
    iva_global, total_iva, importe_total,
    url_firma, estado_firma, fecha_firma,
    porcentaje_adelanto, notas
  ) VALUES (
    v_presup1_id, v_user_id, v_cliente1_id,
    'Cambio ventanas salón y dormitorios',
    'Sustitución completa de ventanas antiguas por carpintería de aluminio RPT con doble acristalamiento',
    '[
      {"id":"l1","descripcion":"Ventana corredera 150x120 RPT","cantidad":2,"unidad":"ud","precioUnitario":850,"descuento":0,"subtotal":1700},
      {"id":"l2","descripcion":"Ventana abatible 80x100 RPT","cantidad":3,"unidad":"ud","precioUnitario":620,"descuento":0,"subtotal":1860},
      {"id":"l3","descripcion":"Mano de obra instalación","cantidad":8,"unidad":"h","precioUnitario":45,"descuento":0,"subtotal":360}
    ]'::jsonb,
    current_date - interval '30 days',
    current_date - interval '15 days',
    'aceptado',
    3920.00, 0, 3920.00, 21, 823.20, 4743.20,
    'token-ejemplo-manuel-garcia-001', 'aceptado',
    now() - interval '25 days',
    30, 'Cliente muy satisfecho. Recomendar a vecinos.'
  );

  -- Presupuesto 2: Enviado, pendiente respuesta
  v_presup2_id := gen_random_uuid();
  INSERT INTO public.presupuestos (
    id, usuario_id, cliente_id, titulo, descripcion,
    lineas, fecha, fecha_vencimiento, estado,
    subtotal_lineas, descuento_global, subtotal_con_descuento,
    iva_global, total_iva, importe_total,
    url_firma, estado_firma, porcentaje_adelanto, notas
  ) VALUES (
    v_presup2_id, v_user_id, v_cliente2_id,
    'Cerramiento terraza bloque residencial',
    'Cerramiento de terraza comunitaria con perfil Strugal S-55 y vidrio 6+6 laminar',
    '[
      {"id":"l1","descripcion":"Perfil Strugal S-55 color blanco","cantidad":45,"unidad":"m","precioUnitario":38,"descuento":5,"subtotal":1624.5},
      {"id":"l2","descripcion":"Vidrio 6+6 laminar claro","cantidad":18,"unidad":"m²","precioUnitario":95,"descuento":0,"subtotal":1710},
      {"id":"l3","descripcion":"Herrajes y accesorios","cantidad":1,"unidad":"ud","precioUnitario":380,"descuento":0,"subtotal":380},
      {"id":"l4","descripcion":"Mano de obra e instalación","cantidad":16,"unidad":"h","precioUnitario":45,"descuento":0,"subtotal":720}
    ]'::jsonb,
    current_date - interval '5 days',
    current_date + interval '25 days',
    'enviado',
    4434.50, 0, 4434.50, 21, 931.25, 5365.75,
    'token-ejemplo-construcciones-perez-002', 'pendiente',
    40, 'Esperando respuesta del administrador de fincas.'
  );

  -- Presupuesto 3: Borrador en proceso
  v_presup3_id := gen_random_uuid();
  INSERT INTO public.presupuestos (
    id, usuario_id, cliente_id, titulo, descripcion,
    lineas, fecha, fecha_vencimiento, estado,
    subtotal_lineas, descuento_global, subtotal_con_descuento,
    iva_global, total_iva, importe_total,
    estado_firma, porcentaje_adelanto, notas
  ) VALUES (
    v_presup3_id, v_user_id, v_cliente3_id,
    'Reforma integral ventanas piso completo',
    'Cambio de todas las ventanas del piso con rotura de puente térmico',
    '[
      {"id":"l1","descripcion":"Ventana corredera 2 hojas 150x120 RPT","cantidad":4,"unidad":"ud","precioUnitario":920,"descuento":10,"subtotal":3312},
      {"id":"l2","descripcion":"Ventana fija 60x80 RPT","cantidad":2,"unidad":"ud","precioUnitario":480,"descuento":10,"subtotal":864},
      {"id":"l3","descripcion":"Puerta balconera 90x210 RPT","cantidad":1,"unidad":"ud","precioUnitario":1100,"descuento":10,"subtotal":990},
      {"id":"l4","descripcion":"Persiana motorizada","cantidad":3,"unidad":"ud","precioUnitario":250,"descuento":0,"subtotal":750},
      {"id":"l5","descripcion":"Mano de obra e instalación","cantidad":20,"unidad":"h","precioUnitario":45,"descuento":0,"subtotal":900}
    ]'::jsonb,
    current_date,
    current_date + interval '30 days',
    'borrador',
    6816.00, 0, 6816.00, 21, 1431.36, 8247.36,
    'pendiente', 30, 'Pendiente de confirmar color RAL con la cliente.'
  );

  -- Presupuesto 4: Rechazado
  v_presup4_id := gen_random_uuid();
  INSERT INTO public.presupuestos (
    id, usuario_id, cliente_id, titulo, descripcion,
    lineas, fecha, fecha_vencimiento, estado,
    subtotal_lineas, descuento_global, subtotal_con_descuento,
    iva_global, total_iva, importe_total,
    url_firma, estado_firma, porcentaje_adelanto, notas
  ) VALUES (
    v_presup4_id, v_user_id, v_cliente4_id,
    'Fachada edificio oficinas 8 plantas',
    'Sistema de fachada ventilada con carpintería de aluminio para edificio de oficinas',
    '[
      {"id":"l1","descripcion":"Sistema fachada Schüco FW 50+","cantidad":320,"unidad":"m²","precioUnitario":280,"descuento":0,"subtotal":89600},
      {"id":"l2","descripcion":"Vidrio bajo emisivo 4+16+4","cantidad":320,"unidad":"m²","precioUnitario":65,"descuento":0,"subtotal":20800},
      {"id":"l3","descripcion":"Mano de obra e instalación","cantidad":200,"unidad":"h","precioUnitario":50,"descuento":0,"subtotal":10000}
    ]'::jsonb,
    current_date - interval '60 days',
    current_date - interval '30 days',
    'rechazado',
    120400.00, 0, 120400.00, 21, 25284.00, 145684.00,
    'token-ejemplo-horizonte-004', 'rechazado',
    50, 'Rechazado por precio. Fueron con empresa de Valladolid.'
  );

  -- ── TRABAJOS DE EJEMPLO ────────────────────────────────────

  -- Trabajo 1: Terminado y pagado (del presupuesto 1)
  INSERT INTO public.trabajos (
    usuario_id, cliente_id, presupuesto_id, descripcion, medidas,
    precio, adelanto, fecha_adelanto, metodo_pago_adelanto,
    fecha, hora_inicio, hora_fin,
    estado, estado_cobro, notas, notas_instalacion
  ) VALUES (
    v_user_id, v_cliente1_id, v_presup1_id,
    'Instalación ventanas salón y dormitorios - García López',
    '2x (150x120) corredera, 3x (80x100) abatible',
    4743.20, 1422.96, current_date - interval '22 days', 'transferencia',
    current_date - interval '20 days', '08:00', '16:00',
    'terminado', 'pagado',
    'Obra completada sin incidencias.',
    'Sellado perimetral con silicona neutra. Cliente conforme con el resultado.'
  );

  -- Trabajo 2: En instalación (del presupuesto 2, si se acepta)
  INSERT INTO public.trabajos (
    usuario_id, cliente_id, presupuesto_id, descripcion, medidas,
    precio, adelanto, fecha_adelanto, metodo_pago_adelanto,
    fecha, hora_inicio, hora_fin,
    estado, estado_cobro, notas
  ) VALUES (
    v_user_id, v_cliente2_id, v_presup2_id,
    'Cerramiento terraza - Construcciones Pérez',
    'Terraza 8x4m, altura libre 2.40m',
    5365.75, 2146.30, current_date - interval '3 days', 'bizum',
    current_date + interval '7 days', '07:30', '15:30',
    'en_fabricacion', 'adelanto_recibido',
    'Fabricación en curso. Entrega prevista en 5 días laborables.'
  );

  -- Trabajo 3: Pendiente
  INSERT INTO public.trabajos (
    usuario_id, cliente_id, descripcion, medidas,
    precio, fecha, hora_inicio, hora_fin,
    estado, estado_cobro, notas
  ) VALUES (
    v_user_id, v_cliente3_id,
    'Revisión y ajuste ventanas antiguas - Martínez Ruiz',
    'Revisión general 6 ventanas existentes',
    180.00,
    current_date + interval '3 days', '09:00', '12:00',
    'pendiente', 'sin_adelanto',
    'Revisión previa a la firma del presupuesto principal.'
  );

  RAISE NOTICE '✅ Datos de ejemplo insertados correctamente.';
  RAISE NOTICE '✅ Admin activado para jonalucena48@gmail.com';
  RAISE NOTICE '   - 4 clientes creados';
  RAISE NOTICE '   - 4 presupuestos creados';
  RAISE NOTICE '   - 3 trabajos creados';

END $$;
