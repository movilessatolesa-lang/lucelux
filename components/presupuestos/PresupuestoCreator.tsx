"use client";

import { useState } from "react";
import type { Cliente, Presupuesto, LineaPresupuesto } from "@/lib/types";
import { useApp } from "@/lib/store";
import {
  calcularTotalesPresupuesto,
  generarTokenFirma,
  validarPresupuesto,
} from "@/lib/presupuesto-utils";
import { Step1Cliente } from "./Step1Cliente";
import { Step2Materiales } from "./Step2Materiales";
import { Step3Medidas } from "./Step3Medidas";
import { Step4Costes } from "./Step4Costes";
import { Step5Resumen } from "./Step5Resumen";

interface PresupuestoCreatorProps {
  presupuestoId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function PresupuestoCreator({ presupuestoId, onClose, onSaved }: PresupuestoCreatorProps) {
  const { clientes, presupuestos, addPresupuesto, updatePresupuesto } = useApp();
  const [step, setStep] = useState(1);

  // Obtener presupuesto actual si es edición
  const presupuestoActual = presupuestoId
    ? presupuestos.find((p) => p.id === presupuestoId)
    : null;

  const [titulo, setTitulo] = useState(presupuestoActual?.titulo || "");
  const [descripcion, setDescripcion] = useState(presupuestoActual?.descripcion || "");
  const [clienteId, setClienteId] = useState(presupuestoActual?.clienteId || "");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>(presupuestoActual?.lineas || []);
  const [fecha, setFecha] = useState(
    presupuestoActual?.fecha || new Date().toISOString().slice(0, 10)
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    presupuestoActual?.fechaVencimiento || ""
  );
  const [descuentoGlobal, setDescuentoGlobal] = useState(presupuestoActual?.descuentoGlobal || 0);
  const [ivaGlobal, setIvaGlobal] = useState(presupuestoActual?.ivaGlobal || 21);

  const cliente = clientes.find((c) => c.id === clienteId);

  // Calcular totales
  const temporalPresupuesto: Presupuesto = {
    id: presupuestoActual?.id || "",
    clienteId,
    titulo,
    descripcion,
    lineas,
    fecha,
    fechaVencimiento,
    estado: presupuestoActual?.estado || "borrador",
    subtotalLineas: 0,
    descuentoGlobal,
    subtotalConDescuento: 0,
    ivaGlobal,
    totalIva: 0,
    importeTotal: 0,
    estadoFirma: "pendiente",
    notas: "",
    creadoEn: presupuestoActual?.creadoEn || new Date().toISOString(),
  };

  const totales = calcularTotalesPresupuesto(temporalPresupuesto);

  const handleAddLinea = (linea: LineaPresupuesto) => {
    setLineas([...lineas, linea]);
  };

  const handleRemoveLinea = (lineaId: string) => {
    setLineas(lineas.filter((l) => l.id !== lineaId));
  };

  const handleUpdateLinea = (lineaId: string, data: Partial<LineaPresupuesto>) => {
    setLineas(
      lineas.map((l) => (l.id === lineaId ? { ...l, ...data } : l))
    );
  };

  const handleGuardar = () => {
    // Crear presupuesto completo
    const presupuestoCompleto: Presupuesto = {
      ...(presupuestoActual || {
        id: Math.random().toString(36).slice(2, 10),
        estado: "borrador",
        creadoEn: new Date().toISOString(),
        estadoFirma: "pendiente",
      }),
      clienteId,
      titulo,
      descripcion,
      lineas,
      fecha,
      fechaVencimiento,
      descuentoGlobal,
      ivaGlobal,
      ...totales,
      notas: presupuestoActual?.notas || "",
      urlFirma: presupuestoActual?.urlFirma || generarTokenFirma(),
    } as Presupuesto;

    // Validar
    const errores = validarPresupuesto(presupuestoCompleto);
    if (errores.length > 0) {
      alert("Errores en el presupuesto:\n" + errores.join("\n"));
      return;
    }

    // Guardar
    if (presupuestoActual) {
      updatePresupuesto(presupuestoActual.id, presupuestoCompleto);
    } else {
      addPresupuesto(
        Object.fromEntries(
          Object.entries(presupuestoCompleto).filter(
            ([key]) => key !== "id" && key !== "creadoEn"
          )
        ) as any
      );
    }

    onSaved?.();
    onClose();
  };

  const pasoValido = () => {
    if (step === 1) return !!clienteId;
    if (step === 2) return lineas.length > 0;
    if (step === 3) return true; // Medidas son opcionales
    if (step === 4) return true; // Costes se calculan automáticamente
    if (step === 5) return !!titulo && !!clienteId && lineas.length > 0 && !!fechaVencimiento;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Indicador de paso */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`w-8 h-8 rounded-full font-semibold transition-colors ${
              s === step
                ? "bg-blue-600 text-white"
                : s < step
                  ? "bg-green-600 text-white"
                  : "bg-slate-200 text-slate-700"
            }`}
          >
            {s < step ? "✓" : s}
          </button>
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="min-h-[300px]">
        {step === 1 && (
          <Step1Cliente
            clientes={clientes}
            selectedClienteId={clienteId}
            onClienteSelect={setClienteId}
          />
        )}

        {step === 2 && (
          <Step2Materiales
            materiales={useApp().materiales}
            lineas={lineas}
            onAddLinea={handleAddLinea}
            onRemoveLinea={handleRemoveLinea}
          />
        )}

        {step === 3 && (
          <Step3Medidas
            lineas={lineas}
            onUpdateLinea={handleUpdateLinea}
          />
        )}

        {step === 4 && (
          <Step4Costes
            lineas={lineas}
            subtotalLineas={totales.subtotalLineas}
            descuentoGlobal={descuentoGlobal}
            ivaGlobal={ivaGlobal}
            onUpdateLinea={handleUpdateLinea}
            onUpdateDescuentoGlobal={setDescuentoGlobal}
            onUpdateIvaGlobal={setIvaGlobal}
          />
        )}

        {step === 5 && (
          <Step5Resumen
            titulo={titulo}
            descripcion={descripcion}
            cliente={cliente || null}
            fecha={fecha}
            fechaVencimiento={fechaVencimiento}
            lineasCount={lineas.length}
            subtotalLineas={totales.subtotalLineas}
            descuentoGlobal={descuentoGlobal}
            ivaGlobal={ivaGlobal}
            importeTotal={totales.importeTotal}
            onUpdateTitulo={setTitulo}
            onUpdateDescripcion={setDescripcion}
            onUpdateFecha={setFecha}
            onUpdateFechaVencimiento={setFechaVencimiento}
          />
        )}
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
        >
          Cancelar
        </button>

        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
            >
              ← Anterior
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!pasoValido()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleGuardar}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✓ Guardar Presupuesto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
