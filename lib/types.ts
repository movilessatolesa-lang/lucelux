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
  clienteId: string;
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
  creadoEn: string;
}

export interface Presupuesto {
  id: string;
  clienteId: string;
  descripcion: string;
  importe: number;
  fecha: string;
  notas: string;
  estado: QuoteStatus;
  creadoEn: string;
}
