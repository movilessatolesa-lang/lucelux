"use client";

import { useState } from "react";
import type { Presupuesto, Cliente } from "@/lib/types";
import { descargarPdfPresupuesto } from "@/lib/presupuesto-pdf";
import { ModalFirma } from "./ModalFirma";

interface BotonesAccionProps {
  presupuesto: Presupuesto;
  cliente: Cliente | null;
  onActualizarEstado: (estado: "aceptado" | "rechazado") => void;
  onGuardarPlantilla: () => void;
}

export function BotonesAccion({
  presupuesto,
  cliente,
  onActualizarEstado,
  onGuardarPlantilla,
}: BotonesAccionProps) {
  const [cargando, setCargando] = useState(false);
  const [mostrarFirma, setMostrarFirma] = useState(false);

  const handleDescargarPdf = async () => {
    if (!cliente) return;
    setCargando(true);
    try {
      await descargarPdfPresupuesto(presupuesto, cliente);
    } finally {
      setCargando(false);
    }
  };

  const handleAceptar = () => {
    onActualizarEstado("aceptado");
    setMostrarFirma(false);
  };

  const handleRechazar = () => {
    onActualizarEstado("rechazado");
    setMostrarFirma(false);
  };

  const copiarEnlaceFirma = () => {
    if (presupuesto.urlFirma) {
      const urlFirma = `${window.location.origin}/presupuestos/${presupuesto.id}/aceptar?token=${presupuesto.urlFirma}`;
      navigator.clipboard.writeText(urlFirma);
      alert("Enlace copiado al portapapeles");
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Descargar PDF */}
        <button
          onClick={handleDescargarPdf}
          disabled={cargando || !cliente}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {cargando ? "⟳" : "📄"} PDF
        </button>

        {/* Copiar enlace de firma */}
        {presupuesto.estado === "enviado" && presupuesto.estadoFirma === "pendiente" && (
          <button
            onClick={copiarEnlaceFirma}
            className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium flex items-center gap-2"
          >
            🔗 Copiar enlace
          </button>
        )}

        {/* Aceptar presupuesto */}
        {presupuesto.estado === "enviado" && presupuesto.estadoFirma === "pendiente" && (
          <button
            onClick={() => setMostrarFirma(true)}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
          >
            ✓ Aceptar
          </button>
        )}

        {/* Estado de aceptación */}
        {presupuesto.estadoFirma === "aceptado" && (
          <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
            ✓ Aceptado el {new Date(presupuesto.fechaFirma || "").toLocaleDateString("es-ES")}
          </div>
        )}

        {presupuesto.estadoFirma === "rechazado" && (
          <div className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
            ✗ Rechazado
          </div>
        )}

        {/* Guardar como plantilla */}
        {presupuesto.lineas.length > 0 && (
          <button
            onClick={onGuardarPlantilla}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
          >
            ★ Guardar como plantilla
          </button>
        )}
      </div>

      {mostrarFirma && (
        <ModalFirma
          presupuesto={presupuesto}
          onAceptar={handleAceptar}
          onRechazar={handleRechazar}
          onClose={() => setMostrarFirma(false)}
        />
      )}
    </>
  );
}
