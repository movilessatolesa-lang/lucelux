export type WorkStatus =
  | "pendiente"
  | "aprobado"
  | "en_fabricacion"
  | "en_instalacion"
  | "terminado";

export type QuoteStatus = "borrador" | "enviado" | "aceptado" | "rechazado";

export type PaymentStatus =
  | "sin_adelanto"
  | "adelanto_recibido"
  | "parcial"
  | "pagado";

export type MetodoPago =
  | "efectivo"
  | "transferencia"
  | "tarjeta"
  | "bizum"
  | "cheque"
  | "otro";

export type TipoCliente = "particular" | "empresa";

export interface Cliente {
  id: string;
  usuarioId: string; // Aislar datos por usuario
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  tipo: TipoCliente;
  dniNif: string;
  notas: string;
  tags: string[];
  recurrente: boolean;
  problematico: boolean;
  creadoEn: string;
}

export interface Trabajo {
  id: string;
  usuarioId: string; // Aislar datos por usuario
  clienteId: string;
  presupuestoId?: string;
  descripcion: string;
  medidas: string;
  precio: number;
  adelanto: number;
  fechaAdelanto: string;
  metodoPagoAdelanto: MetodoPago | "";
  fecha: string;
  notas: string;
  estado: WorkStatus;
  estadoCobro: PaymentStatus;
  horaInicio?: string;          // "09:00" — hora de inicio de instalación
  horaFin?: string;             // "14:00" — hora de fin de instalación
  notasInstalacion?: string;    // materiales a llevar, acceso, etc.
  creadoEn: string;
}

// ── Catálogo de materiales ──────────────────────────────────────────────────

export interface Material {
  id: string;
  nombre: string;
  categoria: "marcos" | "vidrio" | "accesorios" | "mano_de_obra" | "otro";
  costeUnitario: number;
  unidad: "ud" | "m" | "m²" | "m³" | "h";
}

// ── Línea de presupuesto ─────────────────────────────────────────────────────

export interface LineaPresupuesto {
  id: string;
  materialId?: string; // null si es custom
  nombre: string;
  descripcion?: string;
  cantidad: number;
  unidad: string; // "ud", "m", "m²", etc.
  medidas?: string; // "200cm × 150cm"
  costeUnitario: number;
  margenPorcentaje: number; // ej: 30
  descuentoLinea: number; // en € (cantidad fija)
  ivaLinea: number; // % aplicada a esta línea (por si acaso)
}

// ── Seguimiento de obra ──────────────────────────────────────────────────────

export type EstadoSeguimiento =
  | "aceptado"
  | "pendiente_material"
  | "material_disponible"
  | "en_fabricacion"
  | "fabricacion_lista"
  | "pendiente_cita"
  | "cita_confirmada"
  | "en_instalacion"
  | "finalizado"
  | "entregado";

export interface HitoSeguimiento {
  id: string;
  estado: EstadoSeguimiento;
  descripcion: string;
  fecha?: string;
  completado: boolean;
  notas?: string;
}

// ── Presupuesto expandido ────────────────────────────────────────────────────

export interface Presupuesto {
  id: string;
  usuarioId: string; // Aislar datos por usuario
  clienteId: string;
  titulo: string;
  descripcion: string;
  lineas: LineaPresupuesto[];
  fecha: string;
  fechaVencimiento: string;
  estado: QuoteStatus;
  
  // Cálculos
  subtotalLineas: number;
  descuentoGlobal: number; // en €
  subtotalConDescuento: number;
  ivaGlobal: number; // % (ej: 21)
  totalIva: number;
  importeTotal: number;
  
  // Firma/aprobación
  urlFirma?: string; // token único
  estadoFirma: "pendiente" | "aceptado" | "rechazado";
  fechaFirma?: string;

  // Pago anticipado
  porcentajeAdelanto: number; // % a cobrar al aceptar (ej: 50)
  
  // Seguimiento de obra
  seguimiento?: HitoSeguimiento[];
  
  // Auditoría
  notas: string;
  creadoEn: string;
  modificadoEn?: string;
}

// ── Plantilla de presupuesto ────────────────────────────────────────────────

export interface PlantillaPresupuesto {
  id: string;
  nombre: string;
  descripcion: string;
  lineas: LineaPresupuesto[];
  margenPorcentajoPredeterminado: number;
  ivaGlobalPredeterminado: number;
  creadoEn: string;
}

// ── Usuario / Autenticación ─────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  empresa?: string;
  telefonoEmpresa?: string;
  passwordHash: string; // bcrypt en producción
  activo: boolean;
  esAdmin?: boolean; // Rol de administrador
  creadoEn: string;
}

export type TipoHistorial = "cliente" | "trabajo" | "presupuesto" | "plantilla";

export interface HistorialEntrada {
  id: string;
  usuarioId: string;
  tipo: TipoHistorial;
  entidadId: string;
  entidadNombre: string;
  accion: "crear" | "actualizar" | "eliminar";
  cambios?: Record<string, { anterior: unknown; nuevo: unknown }>;
  creadoEn: string;
}

// ── Pagos y Facturas ────────────────────────────────────────────────────────

export type PaymentMethod = "tarjeta" | "transferencia" | "bizum" | "efectivo" | "cheque";
export type PaymentStatusType = "pendiente" | "procesando" | "completado" | "fallido" | "reembolsado";
export type InvoiceStatus = "borrador" | "emitida" | "pagada" | "vencida" | "anulada";

export interface Pago {
  id: string;
  usuarioId: string;
  presupuestoId: string;
  trabajoId?: string;
  clienteId: string;
  importe: number;
  porcentaje: number;
  metodo: PaymentMethod;
  estado: PaymentStatusType;
  stripePaymentIntentId?: string;
  fechaCreacion: string;
  fechaPago?: string;
  notas?: string;
  creadoEn: string;
}

export interface Factura {
  id: string;
  usuarioId: string;
  numero: string;
  presupuestoId: string;
  trabajoId: string;
  clienteId: string;
  lineas: LineaPresupuesto[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  estado: InvoiceStatus;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaPago?: string;
  creadoEn: string;
  modificadoEn?: string;
}

export interface ConfiguracionEmpresa {
  id: string;
  usuarioId: string;
  nombreEmpresa: string;
  dniNif: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  iban?: string;
  ccc?: string;
  numeroFacturaActual: number;
  porcentajeAdelanto: number;
  diasVencimientoPresupuesto: number;
  diasVencimientoFactura: number;
  stripeApiKey?: string;
  sendgridApiKey?: string;
  creadoEn: string;
  modificadoEn?: string;
}