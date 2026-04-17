"use client";

import type { Cliente } from "@/lib/types";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";

interface Step5ResumenProps {
  titulo: string;
  descripcion: string;
  cliente: Cliente | null;
  fecha: string;
  fechaVencimiento: string;
  lineasCount: number;
  subtotalLineas: number;
  descuentoGlobal: number;
  ivaGlobal: number;
  importeTotal: number;
  onUpdateTitulo: (titulo: string) => void;
  onUpdateDescripcion: (desc: string) => void;
  onUpdateFecha: (fecha: string) => void;
  onUpdateFechaVencimiento: (fecha: string) => void;
}

export function Step5Resumen({
  titulo,
  descripcion,
  cliente,
  fecha,
  fechaVencimiento,
  lineasCount,
  subtotalLineas,
  descuentoGlobal,
  ivaGlobal,
  importeTotal,
  onUpdateTitulo,
  onUpdateDescripcion,
  onUpdateFecha,
  onUpdateFechaVencimiento,
}: Step5ResumenProps) {
  const subtotalConDesc = subtotalLineas - descuentoGlobal;
  const totalIva = subtotalConDesc * (ivaGlobal / 100);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Paso 5: Resumen & Guardar</h3>

      {!cliente && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          ⚠️ Debes seleccionar un cliente
        </div>
      )}

      {lineasCount === 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          ⚠️ Debes agregar al menos un material
        </div>
      )}

      {/* Información del presupuesto */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1 block">Título</span>
          <input
            type="text"
            value={titulo}
            onChange={(e) => onUpdateTitulo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Presupuesto ventanas reforma cocina"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1 block">Descripción</span>
          <textarea
            value={descripcion}
            onChange={(e) => onUpdateDescripcion(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detalles adicionales del presupuesto..."
            rows={3}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1 block">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => onUpdateFecha(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1 block">Vencimiento</span>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => onUpdateFechaVencimiento(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Resumen final */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <h4 className="font-semibold text-slate-900">Información del presupuesto</h4>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-600">Cliente:</p>
            <p className="font-semibold text-slate-900">{cliente?.nombre || "—"}</p>
          </div>
          <div>
            <p className="text-slate-600">Materiales:</p>
            <p className="font-semibold text-slate-900">{lineasCount} líneas</p>
          </div>
          <div>
            <p className="text-slate-600">Fecha:</p>
            <p className="font-semibold text-slate-900">{fecha ? formatearFecha(fecha) : "—"}</p>
          </div>
          <div>
            <p className="text-slate-600">Vencimiento:</p>
            <p className="font-semibold text-slate-900">
              {fechaVencimiento ? formatearFecha(fechaVencimiento) : "—"}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-700">Subtotal:</span>
            <span className="font-semibold">{formatearMoneda(subtotalLineas)}</span>
          </div>
          {descuentoGlobal > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Descuento:</span>
              <span className="font-semibold">-{formatearMoneda(descuentoGlobal)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-700">IVA ({ivaGlobal}%):</span>
            <span className="font-semibold">{formatearMoneda(totalIva)}</span>
          </div>
          <div className="flex justify-between bg-blue-50 px-2 py-1 rounded border-t border-slate-200 pt-2">
            <span className="font-bold text-slate-900">TOTAL:</span>
            <span className="font-bold text-blue-700 text-lg">{formatearMoneda(importeTotal)}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        ℹ️ Revisa todos los datos antes de guardar. Podrás editar después si es necesario.
      </div>
    </div>
  );
}
