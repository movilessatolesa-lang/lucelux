import type { LineaPresupuesto, Presupuesto } from "@/lib/types";

/**
 * Calcula el total de una línea de presupuesto
 * Fórmula: (cantidad × costeUnitario) × (1 + margenPorcentaje/100) - descuentoLinea
 */
export function calcularTotalLinea(linea: LineaPresupuesto): number {
  const subtotalCoste = linea.cantidad * linea.costeUnitario;
  const conMargen = subtotalCoste * (1 + linea.margenPorcentaje / 100);
  const total = conMargen - linea.descuentoLinea;
  return Math.max(0, total);
}

/**
 * Calcula el subtotal de coste (sin margen ni descuento)
 */
export function calcularSubtotalCoste(linea: LineaPresupuesto): number {
  return linea.cantidad * linea.costeUnitario;
}

/**
 * Calcula el margen en euros de una línea
 */
export function calcularMargenLinea(linea: LineaPresupuesto): number {
  const subtotalCoste = calcularSubtotalCoste(linea);
  return subtotalCoste * (linea.margenPorcentaje / 100);
}

/**
 * Calcula todos los totales del presupuesto
 */
export function calcularTotalesPresupuesto(
  presupuesto: Presupuesto
): Pick<
  Presupuesto,
  | "subtotalLineas"
  | "subtotalConDescuento"
  | "totalIva"
  | "importeTotal"
> {
  // Suma de todas las líneas
  const subtotalLineas = presupuesto.lineas.reduce(
    (sum, linea) => sum + calcularTotalLinea(linea),
    0
  );

  // Aplicar descuento global (€ fijo)
  const subtotalConDescuento = Math.max(0, subtotalLineas - presupuesto.descuentoGlobal);

  // Calcular IVA
  const totalIva = subtotalConDescuento * (presupuesto.ivaGlobal / 100);

  // Total final
  const importeTotal = subtotalConDescuento + totalIva;

  return {
    subtotalLineas,
    subtotalConDescuento,
    totalIva,
    importeTotal,
  };
}

/**
 * Recalcula y actualiza los totales del presupuesto
 */
export function recalcularPresupuesto(
  presupuesto: Presupuesto
): Presupuesto {
  const totales = calcularTotalesPresupuesto(presupuesto);
  return {
    ...presupuesto,
    ...totales,
    modificadoEn: new Date().toISOString(),
  };
}

/**
 * Valida un presupuesto antes de guardarlo
 * Retorna array de errores (vacío si es válido)
 */
export function validarPresupuesto(presupuesto: Presupuesto): string[] {
  const errores: string[] = [];

  if (!presupuesto.clienteId || presupuesto.clienteId.trim() === "") {
    errores.push("Debe seleccionar un cliente");
  }

  if (!presupuesto.titulo || presupuesto.titulo.trim() === "") {
    errores.push("El título del presupuesto es obligatorio");
  }

  if (presupuesto.lineas.length === 0) {
    errores.push("Debe añadir al menos una línea al presupuesto");
  }

  // Validar cada línea
  presupuesto.lineas.forEach((linea, idx) => {
    if (!linea.nombre || linea.nombre.trim() === "") {
      errores.push(`Línea ${idx + 1}: El nombre es obligatorio`);
    }
    if (linea.cantidad <= 0) {
      errores.push(`Línea ${idx + 1}: La cantidad debe ser mayor a 0`);
    }
    if (linea.costeUnitario < 0) {
      errores.push(`Línea ${idx + 1}: El coste unitario no puede ser negativo`);
    }
    if (linea.margenPorcentaje < 0 || linea.margenPorcentaje > 999) {
      errores.push(`Línea ${idx + 1}: El margen debe estar entre 0% y 999%`);
    }
  });

  if (presupuesto.importeTotal <= 0) {
    errores.push("El importe total debe ser mayor a 0€");
  }

  if (!presupuesto.fecha) {
    errores.push("La fecha es obligatoria");
  }

  if (!presupuesto.fechaVencimiento) {
    errores.push("La fecha de vencimiento es obligatoria");
  }

  // Validar que vencimiento > fecha
  if (new Date(presupuesto.fechaVencimiento) <= new Date(presupuesto.fecha)) {
    errores.push("La fecha de vencimiento debe ser posterior a la fecha del presupuesto");
  }

  return errores;
}

/**
 * Genera un token único para el enlace de firma
 */
export function generarTokenFirma(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Formatea un número como moneda (€)
 */
export function formatearMoneda(valor: number, decimales = 2): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

/**
 * Formatea una fecha en formato legible
 */
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Calcula los días hasta vencimiento
 */
export function diasHastaVencimiento(fechaVencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);
  const diffMs = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene el estado visual del presupuesto (ej: "Vencido", "Vence en 3 días")
 */
export function getEstatusVencimiento(
  fechaVencimiento: string
): "vencido" | "proxima" | "valida" {
  const dias = diasHastaVencimiento(fechaVencimiento);
  if (dias < 0) return "vencido";
  if (dias <= 7) return "proxima";
  return "valida";
}
