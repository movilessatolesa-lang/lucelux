"use client";

import type { Presupuesto, Cliente, Pago } from "@/lib/types";
import { formatearMoneda, formatearFecha, diasHastaVencimiento } from "@/lib/presupuesto-utils";
import { calcularSaldoPendiente } from "@/lib/pagos-utils";

interface PresupuestoVistaClienteProps {
  presupuesto: Presupuesto;
  cliente: Cliente;
  pagos?: Pago[];
  onAceptar: () => void;
  onRechazar: () => void;
  onPagar: () => void;
  onDescargarPDF: () => void;
}

export function PresupuestoVistaCliente({
  presupuesto,
  cliente,
  pagos = [],
  onAceptar,
  onRechazar,
  onPagar,
  onDescargarPDF,
}: PresupuestoVistaClienteProps) {
  const diasVencimiento = diasHastaVencimiento(presupuesto.fechaVencimiento);
  const saldoPendiente = calcularSaldoPendiente(presupuesto.importeTotal, pagos);
  const pagado = presupuesto.importeTotal - saldoPendiente;

  const statusTimeline = [
    {
      paso: "Enviado",
      completado: presupuesto.estado !== "borrador",
      fecha: presupuesto.fecha,
    },
    {
      paso: "Aceptado",
      completado: presupuesto.estadoFirma === "aceptado",
      fecha: presupuesto.fechaFirma,
    },
    {
      paso: "Adelanto pagado",
      completado: pagos.some((p) => p.estado === "completado" && p.porcentaje < 100),
      fecha: pagos.find((p) => p.estado === "completado")?.fechaPago,
    },
    {
      paso: "Completado",
      completado: pagos.some((p) => p.estado === "completado" && p.porcentaje === 100),
      fecha: pagos.find((p) => p.porcentaje === 100)?.fechaPago,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Timeline de progreso */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Estado del proceso</h3>
        <div className="space-y-3">
          {statusTimeline.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${
                  item.completado
                    ? "bg-green-600 text-white"
                    : idx === 0 || statusTimeline[idx - 1].completado
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {item.completado ? "✓" : idx + 1}
              </div>
              <div>
                <p className="font-medium text-slate-900">{item.paso}</p>
                {item.fecha && (
                  <p className="text-sm text-slate-500">{formatearFecha(item.fecha)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Resumen financiero</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Importe total</span>
            <span className="font-bold text-lg">{formatearMoneda(presupuesto.importeTotal)}</span>
          </div>
          {pagado > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-green-600">Pagado</span>
              <span className="font-bold text-green-600">{formatearMoneda(pagado)}</span>
            </div>
          )}
          {saldoPendiente > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-red-600">Pendiente</span>
              <span className="font-bold text-red-600">{formatearMoneda(saldoPendiente)}</span>
            </div>
          )}
          {saldoPendiente === 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span>✓ Completamente pagado</span>
              <span className="font-bold">✓</span>
            </div>
          )}
        </div>
        {saldoPendiente > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Adelanto requerido (30%):</p>
            <p className="font-bold text-lg text-amber-600">
              {formatearMoneda(presupuesto.importeTotal * 0.3)}
            </p>
          </div>
        )}
      </div>

      {/* Estado de vencimiento */}
      {diasVencimiento < 30 && (
        <div
          className={`rounded-2xl p-4 ${
            diasVencimiento < 0
              ? "bg-red-50 border border-red-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <p
            className={`font-semibold ${
              diasVencimiento < 0 ? "text-red-900" : "text-amber-900"
            }`}
          >
            {diasVencimiento < 0
              ? `⏰ Presupuesto vencido hace ${Math.abs(diasVencimiento)} días`
              : `⚠️ Presupuesto vence en ${diasVencimiento} días`}
          </p>
        </div>
      )}

      {/* Acciones */}
      {presupuesto.estado === "enviado" && presupuesto.estadoFirma !== "aceptado" && (
        <div className="flex gap-3">
          <button
            onClick={onAceptar}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            ✓ Aceptar presupuesto
          </button>
          <button
            onClick={onRechazar}
            className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-lg transition-colors"
          >
            ✗ Rechazar
          </button>
        </div>
      )}

      {presupuesto.estadoFirma === "aceptado" && saldoPendiente > 0 && (
        <button
          onClick={onPagar}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          💳 Realizar pago
        </button>
      )}

      <button
        onClick={onDescargarPDF}
        className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-3 rounded-lg transition-colors"
      >
        📄 Descargar presupuesto
      </button>
    </div>
  );
}
