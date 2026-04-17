import type { Presupuesto, Pago, Factura } from "@/lib/types";

/**
 * Calcula el importe del adelanto (ej: 30% del total)
 */
export function calcularImporteAdelanto(importeTotal: number, porcentaje: number = 30): number {
  return importeTotal * (porcentaje / 100);
}

/**
 * Calcula el saldo pendiente después de pagos
 */
export function calcularSaldoPendiente(
  importeTotal: number,
  pagosProcesados: Pago[]
): number {
  const pagado = pagosProcesados
    .filter((p) => p.estado === "completado")
    .reduce((sum, p) => sum + p.importe, 0);

  return Math.max(0, importeTotal - pagado);
}

/**
 * Valida si un presupuesto puede pasar a siguiente etapa de pago
 */
export function puedeAceptarPresupuesto(presupuesto: Presupuesto): boolean {
  return presupuesto.estado === "enviado" && presupuesto.estadoFirma !== "aceptado";
}

/**
 * Genera número de factura único
 */
export function generarNumeroFactura(numeroActual: number, año: number = 2026): string {
  return `FAC-${año}-${String(numeroActual).padStart(4, "0")}`;
}

/**
 * Calcula días de mora
 */
export function calcularDiasMora(fechaVencimiento: string): number {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diffMs = hoy.getTime() - vencimiento.getTime();
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, dias);
}

/**
 * Genera resumen de pagos para dashboard
 */
export function resumenPagos(presupuestos: Presupuesto[], pagos: Pago[]) {
  const totalFacturado = presupuestos.reduce((sum, p) => sum + p.importeTotal, 0);
  const totalCobrado = pagos
    .filter((p) => p.estado === "completado")
    .reduce((sum, p) => sum + p.importe, 0);
  const totalPendiente = totalFacturado - totalCobrado;

  return {
    totalFacturado,
    totalCobrado,
    totalPendiente,
    porcentajeCobro: (totalCobrado / totalFacturado) * 100 || 0,
  };
}

/**
 * Envía email de confirmación de pago (mock para ahora)
 */
export async function enviarConfirmacionPago(
  emailCliente: string,
  nombreCliente: string,
  presupuesto: Presupuesto,
  importe: number
): Promise<boolean> {
  try {
    console.log(`📧 Email enviado a ${emailCliente}`);
    console.log(`   Asunto: Pago recibido - ${presupuesto.titulo}`);
    console.log(
      `   Importe: ${importe.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
      })}`
    );
    return true;
  } catch (error) {
    console.error("Error al enviar email:", error);
    return false;
  }
}

/**
 * Envía recordatorio de vencimiento
 */
export async function enviarRecordatorioVencimiento(
  emailCliente: string,
  nombreCliente: string,
  presupuesto: Presupuesto,
  diasRestantes: number
): Promise<boolean> {
  try {
    console.log(`📧 Recordatorio enviado a ${emailCliente}`);
    console.log(`   Vence en ${diasRestantes} días`);
    return true;
  } catch (error) {
    console.error("Error al enviar recordatorio:", error);
    return false;
  }
}
