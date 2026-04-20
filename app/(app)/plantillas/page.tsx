"use client";

import { useState, useEffect } from "react";
import type { PlantillaPresupuesto, LineaPresupuesto } from "@/lib/types";
import { getPlantillas, createPlantilla, deletePlantilla as dbDeletePlantilla, getMateriales } from "@/lib/db";

// ── helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtDec(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcLinea(l: LineaPresupuesto) {
  const coste = l.cantidad * l.costeUnitario;
  const pvp = coste * (1 + l.margenPorcentaje / 100);
  const conDesc = pvp - (l.descuentoLinea ?? 0);
  const iva = conDesc * (l.ivaLinea / 100);
  return { pvp, conDesc, iva, total: conDesc + iva };
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── LineaForm ─────────────────────────────────────────────────────────────────

function LineaForm({
  linea,
  materiales,
  onChange,
  onRemove,
}: {
  linea: LineaPresupuesto;
  materiales: { id: string; nombre: string; costeUnitario: number; unidad: string }[];
  onChange: (l: LineaPresupuesto) => void;
  onRemove: () => void;
}) {
  const inp = "border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1558d4] w-full";

  function set<K extends keyof LineaPresupuesto>(k: K, v: LineaPresupuesto[K]) {
    onChange({ ...linea, [k]: v });
  }

  function handleMaterial(id: string) {
    if (!id) return;
    const mat = materiales.find((m) => m.id === id);
    if (!mat) return;
    onChange({
      ...linea,
      materialId: mat.id,
      nombre: mat.nombre,
      costeUnitario: mat.costeUnitario,
      unidad: mat.unidad,
    });
  }

  const { pvp, total } = calcLinea(linea);

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
      {/* Material selector */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-slate-500 mb-0.5 block">Material del catálogo</label>
          <select
            value={linea.materialId ?? ""}
            onChange={(e) => handleMaterial(e.target.value)}
            className={inp}
          >
            <option value="">— Personalizado —</option>
            {materiales.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-0.5 block">Unidad</label>
          <input value={linea.unidad} onChange={(e) => set("unidad", e.target.value)} className={inp} placeholder="ud" />
        </div>
      </div>
      {/* Nombre */}
      <div>
        <label className="text-xs text-slate-500 mb-0.5 block">Nombre de la línea *</label>
        <input
          required
          value={linea.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          className={inp}
          placeholder="Ej. Ventana corredera aluminio"
        />
      </div>
      {/* Medidas */}
      <div>
        <label className="text-xs text-slate-500 mb-0.5 block">Medidas (opcional)</label>
        <input
          value={linea.medidas ?? ""}
          onChange={(e) => set("medidas", e.target.value)}
          className={inp}
          placeholder="150 × 120 cm"
        />
      </div>
      {/* Numéricos */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-slate-500 mb-0.5 block">Cantidad</label>
          <input
            type="number" min={0} step={0.01}
            value={linea.cantidad}
            onChange={(e) => set("cantidad", parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-0.5 block">Coste unit.</label>
          <input
            type="number" min={0} step={0.01}
            value={linea.costeUnitario}
            onChange={(e) => set("costeUnitario", parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-0.5 block">Margen %</label>
          <input
            type="number" min={0} max={999} step={1}
            value={linea.margenPorcentaje}
            onChange={(e) => set("margenPorcentaje", parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-0.5 block">IVA %</label>
          <input
            type="number" min={0} step={1}
            value={linea.ivaLinea}
            onChange={(e) => set("ivaLinea", parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
      </div>
      {/* Resumen + eliminar */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">
          PVP sin IVA: <b>{fmtDec(pvp)} €</b> · Total: <b>{fmtDec(total)} €</b>
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-500 hover:text-red-700 font-medium"
        >
          Eliminar línea
        </button>
      </div>
    </div>
  );
}

// ── PlantillaForm ─────────────────────────────────────────────────────────────

const LINEA_VACIA = (): LineaPresupuesto => ({
  id: uid(),
  nombre: "",
  cantidad: 1,
  unidad: "ud",
  costeUnitario: 0,
  margenPorcentaje: 30,
  descuentoLinea: 0,
  ivaLinea: 21,
  medidas: "",
});

interface FormProps {
  initial?: PlantillaPresupuesto;
  materiales: { id: string; nombre: string; costeUnitario: number; unidad: string }[];
  onSave: (data: Omit<PlantillaPresupuesto, "id" | "creadoEn">) => void;
  onCancel: () => void;
}

function PlantillaForm({ initial, materiales, onSave, onCancel }: FormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [margen, setMargen] = useState(initial?.margenPorcentajoPredeterminado ?? 30);
  const [iva, setIva] = useState(initial?.ivaGlobalPredeterminado ?? 21);
  const [lineas, setLineas] = useState<LineaPresupuesto[]>(
    initial?.lineas?.length ? initial.lineas.map((l) => ({ ...l })) : [LINEA_VACIA()]
  );

  const inp = "border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4] w-full";
  const lbl = "block text-sm font-medium text-slate-700 mb-1";

  function addLinea() {
    setLineas((prev) => [...prev, { ...LINEA_VACIA(), margenPorcentaje: margen, ivaLinea: iva }]);
  }

  function updateLinea(idx: number, l: LineaPresupuesto) {
    setLineas((prev) => prev.map((x, i) => (i === idx ? l : x)));
  }

  function removeLinea(idx: number) {
    setLineas((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (lineas.length === 0) return;
    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      lineas,
      margenPorcentajoPredeterminado: margen,
      ivaGlobalPredeterminado: iva,
    });
  }

  // Totales estimados
  const totalEstimado = lineas.reduce((s, l) => s + calcLinea(l).total, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lbl}>Nombre de la plantilla *</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inp}
          placeholder='Ej. "Ventana corredera estándar 120×90"'
        />
      </div>
      <div>
        <label className={lbl}>Descripción</label>
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className={inp}
          placeholder="Para qué tipo de trabajo es esta plantilla"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Margen predeterminado (%)</label>
          <input
            type="number" min={0} step={1}
            value={margen}
            onChange={(e) => setMargen(parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>IVA predeterminado (%)</label>
          <input
            type="number" min={0} step={1}
            value={iva}
            onChange={(e) => setIva(parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
      </div>

      {/* Líneas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Líneas ({lineas.length})
          </span>
          <span className="text-xs text-slate-400">
            Total estimado: <b className="text-slate-700">{fmtDec(totalEstimado)} €</b>
          </span>
        </div>
        <div className="space-y-3">
          {lineas.map((l, idx) => (
            <LineaForm
              key={l.id}
              linea={l}
              materiales={materiales}
              onChange={(updated) => updateLinea(idx, updated)}
              onRemove={() => removeLinea(idx)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addLinea}
          className="mt-3 w-full border-2 border-dashed border-slate-300 hover:border-[#1558d4] text-slate-500 hover:text-[#1558d4] rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          + Añadir línea
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {initial ? "Guardar cambios" : "Crear plantilla"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<PlantillaPresupuesto[]>([]);
  const materiales = getMateriales();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<PlantillaPresupuesto | null>(null);

  useEffect(() => {
    getPlantillas().then(setPlantillas);
  }, []);

  async function handleSave(data: Omit<PlantillaPresupuesto, "id" | "creadoEn">) {
    if (mode === "edit" && editing) {
      // updatePlantilla no existe en db.ts aún — re-creamos la plantilla
      await dbDeletePlantilla(editing.id);
      const nueva = await createPlantilla(data);
      setPlantillas((prev) =>
        prev.map((p) => (p.id === editing.id ? nueva : p))
      );
    } else {
      const nueva = await createPlantilla(data);
      setPlantillas((prev) => [nueva, ...prev]);
    }
    setMode("list");
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (confirm("\u00bfEliminar esta plantilla?")) {
      await dbDeletePlantilla(id);
      setPlantillas((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plantillas</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Modelos de presupuesto reutilizables
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setMode("create"); }}
          className="bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          + Nueva plantilla
        </button>
      </div>

      {/* Lista */}
      {plantillas.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-400 space-y-3">
          <svg className="mx-auto opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
          <p className="text-sm">No hay plantillas. Crea la primera para agilizar tus presupuestos.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {plantillas.map((pl) => {
            const totalEstimado = pl.lineas.reduce((s, l) => s + calcLinea(l).total, 0);
            return (
              <li
                key={pl.id}
                className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{pl.nombre}</p>
                    {pl.descripcion && (
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{pl.descripcion}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {pl.lineas.length} línea{pl.lineas.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        Margen {pl.margenPorcentajoPredeterminado}%
                      </span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        IVA {pl.ivaGlobalPredeterminado}%
                      </span>
                      <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ~{fmtDec(totalEstimado)} €
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => { setEditing(pl); setMode("edit"); }}
                      className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(pl.id)}
                      className="px-3 py-2 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Preview de líneas */}
                <div className="mt-3 border-t border-slate-100 pt-3 space-y-1">
                  {pl.lineas.slice(0, 3).map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs text-slate-600">
                      <span className="truncate max-w-[70%]">
                        {l.cantidad} {l.unidad} · {l.nombre}
                        {l.medidas ? ` (${l.medidas})` : ""}
                      </span>
                      <span className="font-medium text-slate-800 shrink-0 ml-2">
                        {fmtDec(calcLinea(l).total)} €
                      </span>
                    </div>
                  ))}
                  {pl.lineas.length > 3 && (
                    <p className="text-xs text-slate-400">
                      +{pl.lineas.length - 3} líneas más…
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal crear/editar */}
      {(mode === "create" || mode === "edit") && (
        <Modal
          title={mode === "edit" ? "Editar plantilla" : "Nueva plantilla"}
          onClose={() => { setMode("list"); setEditing(null); }}
        >
          <PlantillaForm
            initial={editing ?? undefined}
            materiales={materiales}
            onSave={handleSave}
            onCancel={() => { setMode("list"); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
