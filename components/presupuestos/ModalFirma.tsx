"use client";

import { useState } from "react";
import type { Presupuesto } from "@/lib/types";

interface ModalFirmaProps {
  presupuesto: Presupuesto;
  onAceptar: () => void;
  onRechazar: () => void;
  onClose: () => void;
}

export function ModalFirma({
  presupuesto,
  onAceptar,
  onRechazar,
  onClose,
}: ModalFirmaProps) {
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            ✓
          </div>
          <h2 className="text-lg font-bold text-slate-900">Aceptar Presupuesto</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Presupuesto ID:</span> {presupuesto.id}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <span className="font-semibold">Importe Total:</span> €
              {presupuesto.importeTotal.toFixed(2)}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <span className="font-semibold">Vencimiento:</span>{" "}
              {new Date(presupuesto.fechaVencimiento).toLocaleDateString(
                "es-ES"
              )}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-sm">
              Términos y Condiciones
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-40 overflow-y-auto text-xs text-slate-600 leading-relaxed">
              <p className="mb-2">
                Al aceptar este presupuesto, usted confirma:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Que ha revisado todos los detalles del presupuesto y está de
                  acuerdo con el mismo
                </li>
                <li>
                  Que el importe total, materiales y medidas son correctos
                </li>
                <li>
                  Que autoriza el inicio de los trabajos según lo presupuestado
                </li>
                <li>
                  Que los términos de pago son aceptables (ver detalles del
                  presupuesto)
                </li>
              </ul>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300"
            />
            <span className="text-xs text-slate-600">
              Confirmo que he leído y acepto los términos anteriores
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRechazar}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
          >
            Rechazar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onAceptar}
            disabled={!aceptaTerminos}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
