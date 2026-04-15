export type WorkStatus =
  | "pendiente"
  | "aprobado"
  | "en_fabricacion"
  | "en_instalacion"
  | "terminado";

export type QuoteStatus = "enviado" | "aceptado" | "rechazado";

export type PaymentStatus = "pendiente" | "parcial" | "pagado";

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  notas: string;
  creadoEn: string; // ISO date string
}

export interface Trabajo {
  id: string;
  clienteId: string;
  descripcion: string;
  medidas: string;
  precio: number;
  fecha: string; // ISO date string
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
