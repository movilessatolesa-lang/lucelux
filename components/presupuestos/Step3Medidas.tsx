"use client";

import type { LineaPresupuesto } from "@/lib/types";

interface Step3MedidasProps {
  lineas: LineaPresupuesto[];
  onUpdateLinea: (lineaId: string, data: Partial<LineaPresupuesto>) => void;
}

export function Step3Medidas({ lineas, onUpdateLinea }: Step3MedidasProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">
        Paso 3: Medidas
      </h3>

      {lineas.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500">
          Agrega materiales en el paso anterior para definir medidas
        </div>
      ) : (
        <div className="space-y-4">
          {lineas.map((linea, idx) => (
            <div
              key={linea.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <h4 className="font-semibold text-slate-800 mb-3">
                {idx + 1}. {linea.nombre}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({linea.cantidad} {linea.unidad})
                </span>
              </h4>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wide">
                  Medidas{" "}
                  <span className="font-normal text-slate-400 normal-case">
                    (ancho × alto en cm)
                  </span>
                </span>
                <input
                  type="text"
                  value={linea.medidas || ""}
                  onChange={(e) =>
                    onUpdateLinea(linea.id, { medidas: e.target.value })
                  }
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="ej: 120x90"
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
