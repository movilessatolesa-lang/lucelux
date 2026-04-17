"use client";

import type { LineaPresupuesto } from "@/lib/types";

interface Step3MedidasProps {
  lineas: LineaPresupuesto[];
  onUpdateLinea: (lineaId: string, data: Partial<LineaPresupuesto>) => void;
}

export function Step3Medidas({ lineas, onUpdateLinea }: Step3MedidasProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Paso 3: Definir Medidas</h3>

      {lineas.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-600">
          Agrega materiales en el paso anterior para definir medidas
        </div>
      ) : (
        <div className="space-y-4">
          {lineas.map((linea, idx) => (
            <div key={linea.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-3">
                {idx + 1}. {linea.nombre}
              </h4>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 mb-1 block">
                  Medidas (ej: 200cm × 150cm)
                </span>
                <input
                  type="text"
                  value={linea.medidas || ""}
                  onChange={(e) =>
                    onUpdateLinea(linea.id, { medidas: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 200cm × 150cm o 2m × 1.5m"
                />
              </label>

              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium">Cantidad:</span> {linea.cantidad} {linea.unidad}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
