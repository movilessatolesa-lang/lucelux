"use client";

import { useState, useEffect } from "react";
import type { Cliente, Presupuesto, LineaPresupuesto, PlantillaPresupuesto } from "@/lib/types";
import { getClientes, getPresupuesto, getMateriales, getPlantillas, createPresupuesto, updatePresupuesto as dbUpdatePresupuesto } from "@/lib/db";
import type { Material } from "@/lib/types";
// getMateriales es síncrona, las demás son async
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaPresupuesto[]>([]);
  const [presupuestoActual, setPresupuestoActual] = useState<Presupuesto | null>(null);
  const [step, setStep] = useState(1);
  const [showPlantillas, setShowPlantillas] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [ivaGlobal, setIvaGlobal] = useState(21);
  const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(50);

  useEffect(() => {
    async function cargar() {
      const [cs, pls] = await Promise.all([
        getClientes(),
        getPlantillas(),
      ]);
      setClientes(cs);
      setMateriales(getMateriales());
      setPlantillas(pls);

      if (presupuestoId) {
        const p = await getPresupuesto(presupuestoId);
        if (p) {
          setPresupuestoActual(p);
          setTitulo(p.titulo);
          setDescripcion(p.descripcion);
          setClienteId(p.clienteId);
          setLineas(p.lineas);
          setFecha(p.fecha);
          setFechaVencimiento(p.fechaVencimiento);
          setDescuentoGlobal(p.descuentoGlobal);
          setIvaGlobal(p.ivaGlobal);
          setPorcentajeAdelanto(p.porcentajeAdelanto);
        }
      }
    }
    cargar();
  }, [presupuestoId]);

  const cliente = clientes.find((c) => c.id === clienteId);

  // Calcular totales
  const temporalPresupuesto: Presupuesto = {
    id: presupuestoActual?.id || "",
    usuarioId: presupuestoActual?.usuarioId || "",
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
    porcentajeAdelanto,
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

  const handleGuardar = async () => {
    const presupuestoCompleto: Presupuesto = {
      ...(presupuestoActual || {
        id: "",
        usuarioId: "",
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
      porcentajeAdelanto,
      ...totales,
      notas: presupuestoActual?.notas || "",
      urlFirma: presupuestoActual?.urlFirma || generarTokenFirma(),
    } as Presupuesto;

    const errores = validarPresupuesto(presupuestoCompleto);
    if (errores.length > 0) {
      alert("Errores en el presupuesto:\n" + errores.join("\n"));
      return;
    }

    if (presupuestoActual) {
      await dbUpdatePresupuesto(presupuestoActual.id, presupuestoCompleto);
    } else {
      const { id: _id, usuarioId: _uid, creadoEn: _ce, modificadoEn: _me, ...sinIds } = presupuestoCompleto;
      void _id; void _uid; void _ce; void _me;
      await createPresupuesto(sinIds);
    }

    onSaved?.();
    onClose();
  };

  function aplicarPlantilla(id: string) {
    const pl = plantillas.find((p) => p.id === id);
    if (!pl) return;
    // Nuevas ids para evitar colisiones
    const nuevasLineas: LineaPresupuesto[] = pl.lineas.map((l) => ({
      ...l,
      id: Math.random().toString(36).slice(2, 10),
    }));
    setLineas((prev) => [...prev, ...nuevasLineas]);
    if (!titulo) setTitulo(pl.nombre);
    setIvaGlobal(pl.ivaGlobalPredeterminado);
    setShowPlantillas(false);
  }

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
        {step === 2 && plantillas.length > 0 && (
          <div className="mb-4">
            {showPlantillas ? (
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-800">Selecciona una plantilla</span>
                  <button
                    type="button"
                    onClick={() => setShowPlantillas(false)}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="space-y-1.5">
                  {plantillas.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => aplicarPlantilla(pl.id)}
                      className="w-full text-left rounded-lg bg-white border border-blue-200 hover:border-blue-400 px-3 py-2.5 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-800">{pl.nombre}</p>
                      {pl.descripcion && (
                        <p className="text-xs text-slate-500">{pl.descripcion}</p>
                      )}
                      <p className="text-[11px] text-blue-600 mt-0.5">
                        {pl.lineas.length} línea{pl.lineas.length !== 1 ? "s" : ""}
                        · Margen {pl.margenPorcentajoPredeterminado}%
                        · IVA {pl.ivaGlobalPredeterminado}%
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPlantillas(true)}
                className="flex items-center gap-2 text-sm text-[#1558d4] hover:text-[#0e46b8] font-medium border border-[#1558d4]/30 hover:border-[#1558d4] rounded-xl px-4 py-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                </svg>
                Usar plantilla
              </button>
            )}
          </div>
        )}
        {step === 1 && (
          <Step1Cliente
            clientes={clientes}
            selectedClienteId={clienteId}
            onClienteSelect={setClienteId}
          />
        )}

        {step === 2 && (
          <Step2Materiales
            materiales={materiales}
            lineas={lineas}
            onAddLinea={handleAddLinea}
            onRemoveLinea={handleRemoveLinea}
            onUpdateLinea={handleUpdateLinea}
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
            porcentajeAdelanto={porcentajeAdelanto}
            onUpdateTitulo={setTitulo}
            onUpdateDescripcion={setDescripcion}
            onUpdateFecha={setFecha}
            onUpdateFechaVencimiento={setFechaVencimiento}
            onUpdatePorcentajeAdelanto={setPorcentajeAdelanto}
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
