"use client";

import type { LineaPresupuesto } from "@/lib/types";
import { calcularTotalLinea, calcularSubtotalCoste, formatearMoneda } from "@/lib/presupuesto-utils";

interface Step4CostesProps {
  lineas: LineaPresupuesto[];
  subtotalLineas: number;
  descuentoGlobal: number;
  ivaGlobal: number;
  onUpdateLinea: (lineaId: string, data: Partial<LineaPresupuesto>) => void;
  onUpdateDescuentoGlobal: (descuento: number) => void;
  onUpdateIvaGlobal: (iva: number) => void;
}

export function Step4Costes({
  lineas,
  subtotalLineas,
  descuentoGlobal,
  ivaGlobal,
  onUpdateLinea,
  onUpdateDescuentoGlobal,
  onUpdateIvaGlobal,
}: Step4CostesProps) {
  const totalIva = (subtotalLineas - descuentoGlobal) * (ivaGlobal / 100);
  const importeTotal = subtotalLineas - descuentoGlobal + totalIva;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Paso 4: Revisar Costes</h3>

      {lineas.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-600">
          No hay materiales para calcular costes
        </div>
      ) : (
        <>
          {/* Tabla de líneas */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-900">Material</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-900">Cantidad</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-900">Coste Unit.</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-900">Subtotal</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-900">Margen %</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-900">Desc. €</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, idx) => (
                  <tr key={linea.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-3 py-2 text-slate-900">
                      <p className="font-medium">{linea.nombre}</p>
                      {linea.medidas && <p className="text-xs text-slate-600">{linea.medidas}</p>}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900">
                      {linea.cantidad} {linea.unidad}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900">
                      {formatearMoneda(linea.costeUnitario)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900">
                      {formatearMoneda(calcularSubtotalCoste(linea))}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={linea.margenPorcentaje}
                        onChange={(e) =>
                          onUpdateLinea(linea.id, {
                            margenPorcentaje: parseFloat(e.target.value),
                          })
                        }
                        className="w-12 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="999"
                        step="0.1"
                      />
                      %
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={linea.descuentoLinea}
                        onChange={(e) =>
                          onUpdateLinea(linea.id, {
                            descuentoLinea: parseFloat(e.target.value),
                          })
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatearMoneda(calcularTotalLinea(linea))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen de costes */}
          <div className="max-w-xs ml-auto space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between">
              <span className="text-slate-700">Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatearMoneda(subtotalLineas)}</span>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 pt-2">
              <label className="text-slate-700">Descuento global (€):</label>
              <input
                type="number"
                value={descuentoGlobal}
                onChange={(e) => onUpdateDescuentoGlobal(parseFloat(e.target.value))}
                className="flex-1 px-2 py-1 border border-slate-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex justify-between">
              <span className="text-slate-700">Subtotal con desc.:</span>
              <span className="font-semibold text-slate-900">
                {formatearMoneda(subtotalLineas - descuentoGlobal)}
              </span>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 pt-2">
              <label className="text-slate-700">IVA (%):</label>
              <input
                type="number"
                value={ivaGlobal}
                onChange={(e) => onUpdateIvaGlobal(parseFloat(e.target.value))}
                className="w-16 px-2 py-1 border border-slate-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="flex justify-between">
              <span className="text-slate-700">IVA:</span>
              <span className="font-semibold text-slate-900">{formatearMoneda(totalIva)}</span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-2 bg-blue-50 px-2 py-1 rounded">
              <span className="font-semibold text-slate-900">TOTAL:</span>
              <span className="font-bold text-blue-700">{formatearMoneda(importeTotal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
