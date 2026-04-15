"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Trabajo, WorkStatus, PaymentStatus, MetodoPago } from "@/lib/types";

const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "pendiente",       label: "Pendiente" },
  { value: "aprobado",        label: "Aprobado" },
  { value: "en_fabricacion",  label: "En fabricación" },
  { value: "en_instalacion",  label: "En instalación" },
  { value: "terminado",       label: "Terminado" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "sin_adelanto",      label: "Sin adelanto" },
  { value: "adelanto_recibido", label: "Adelanto recibido" },
  { value: "parcial",           label: "Parcial" },
  { value: "pagado",            label: "Pagado" },
];

const METODO_OPTIONS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta",       label: "Tarjeta" },
  { value: "bizum",         label: "Bizum" },
  { value: "cheque",        label: "Cheque" },
  { value: "otro",          label: "Otro" },
];

const STATUS_COLOR: Record<WorkStatus, string> = {
  pendiente:       "bg-amber-50 text-amber-700",
  aprobado:        "bg-sky-50 text-sky-700",
  en_fabricacion:  "bg-indigo-50 text-indigo-700",
  en_instalacion:  "bg-purple-50 text-purple-700",
  terminado:       "bg-green-50 text-green-700",
};

const COBRO_COLOR: Record<PaymentStatus, string> = {
  sin_adelanto:      "bg-slate-100 text-slate-500",
  adelanto_recibido: "bg-amber-50 text-amber-700",
  parcial:           "bg-orange-50 text-orange-700",
  pagado:            "bg-green-50 text-green-700",
};

const EMPTY: Omit<Trabajo, "id" | "creadoEn"> = {
  clienteId: "",
  descripcion: "",
  medidas: "",
  precio: 0,
  adelanto: 0,
  fechaAdelanto: "",
  metodoPagoAdelanto: "",
  fecha: new Date().toISOString().slice(0, 10),
  notas: "",
  estado: "pendiente",
  estadoCobro: "sin_adelanto",
};

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface FormProps {
  initial?: Trabajo;
  onSave: (data: Omit<Trabajo, "id" | "creadoEn">) => void;
  onCancel: () => void;
}

function TrabajoForm({ initial, onSave, onCancel }: FormProps) {
  const { clientes } = useApp();
  const [form, setForm] = useState<Omit<Trabajo, "id" | "creadoEn">>(
    initial
      ? {
          clienteId:          initial.clienteId,
          descripcion:        initial.descripcion,
          medidas:            initial.medidas,
          precio:             initial.precio,
          adelanto:           initial.adelanto,
          fechaAdelanto:      initial.fechaAdelanto,
          metodoPagoAdelanto: initial.metodoPagoAdelanto,
          fecha:              initial.fecha,
          notas:              initial.notas,
          estado:             initial.estado,
          estadoCobro:        initial.estadoCobro,
        }
      : EMPTY
  );

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const pendiente = Math.max(0, form.precio - form.adelanto);
  const tieneAdelanto = form.estadoCobro !== "sin_adelanto";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descripcion.trim()) return;
    onSave(form);
  }

  const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Cliente</label>
        <select value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)} className={inputCls}>
          <option value="">— Sin cliente —</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Descripción *</label>
        <input
          required
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          className={inputCls}
          placeholder="Ej. Ventana corredera aluminio"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Medidas</label>
          <input value={form.medidas} onChange={(e) => set("medidas", e.target.value)} className={inputCls} placeholder="150×120 cm" />
        </div>
        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Estado del trabajo</label>
        <select value={form.estado} onChange={(e) => set("estado", e.target.value as WorkStatus)} className={inputCls}>
          {WORK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Cobros block */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Control de cobro</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Importe total (€)</label>
            <input
              type="number" min={0} step={0.01}
              value={form.precio}
              onChange={(e) => set("precio", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Adelanto recibido (€)</label>
            <input
              type="number" min={0} step={0.01}
              value={form.adelanto}
              onChange={(e) => set("adelanto", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
          <span className="text-sm text-slate-500">Importe pendiente</span>
          <span className={`text-base font-bold ${pendiente > 0 ? "text-red-500" : "text-green-600"}`}>
            {fmt(pendiente)} €
          </span>
        </div>
        <div>
          <label className={labelCls}>Estado de cobro</label>
          <select value={form.estadoCobro} onChange={(e) => set("estadoCobro", e.target.value as PaymentStatus)} className={inputCls}>
            {PAYMENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {tieneAdelanto && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha del adelanto</label>
              <input type="date" value={form.fechaAdelanto} onChange={(e) => set("fechaAdelanto", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Método de pago</label>
              <select value={form.metodoPagoAdelanto} onChange={(e) => set("metodoPagoAdelanto", e.target.value as MetodoPago | "")} className={inputCls}>
                <option value="">— Seleccionar —</option>
                {METODO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Notas</label>
        <textarea
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Observaciones…"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold py-3 rounded-xl transition-colors text-base">
          {initial ? "Guardar cambios" : "Crear trabajo"}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-base">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function TrabajosPage() {
  const { trabajos, clientes, addTrabajo, updateTrabajo, deleteTrabajo } = useApp();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Trabajo | null>(null);

  function nombreCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  function handleSave(data: Omit<Trabajo, "id" | "creadoEn">) {
    if (mode === "edit" && editing) {
      updateTrabajo(editing.id, data);
    } else {
      addTrabajo(data);
    }
    setMode("list");
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar este trabajo?")) deleteTrabajo(id);
  }

  const sorted = [...trabajos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trabajos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{trabajos.length} trabajos registrados</p>
        </div>
        <button
          onClick={() => setMode("create")}
          className="bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          + Nuevo trabajo
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-400">
          No hay trabajos. Crea el primero.
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((t) => {
            const pendiente = Math.max(0, t.precio - t.adelanto);
            const cliente = nombreCliente(t.clienteId);
            const estadoLabel = PAYMENT_STATUS_OPTIONS.find((o) => o.value === t.estadoCobro)?.label ?? t.estadoCobro;
            return (
              <li key={t.id} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm">
                {/* Header: descripción + badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{t.descripcion}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {cliente} · {t.fecha}{t.medidas ? ` · ${t.medidas}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${STATUS_COLOR[t.estado]}`}>
                      {WORK_STATUS_OPTIONS.find((o) => o.value === t.estado)?.label}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${COBRO_COLOR[t.estadoCobro]}`}>
                      {estadoLabel}
                    </span>
                  </div>
                </div>
                {/* Importes */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{t.precio > 0 ? `${fmt(t.precio)} €` : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Adelanto</p>
                    <p className="text-sm font-bold text-amber-600 mt-0.5">{t.adelanto > 0 ? `${fmt(t.adelanto)} €` : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Pendiente</p>
                    <p className={`text-sm font-bold mt-0.5 ${pendiente > 0 ? "text-red-500" : "text-green-600"}`}>
                      {t.precio > 0 ? `${fmt(pendiente)} €` : "—"}
                    </p>
                  </div>
                </div>
                {/* Método + acciones */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400 capitalize">
                    {t.adelanto > 0 && t.metodoPagoAdelanto
                      ? `${t.metodoPagoAdelanto}${t.fechaAdelanto ? ` · ${t.fechaAdelanto}` : ""}`
                      : ""}
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditing(t); setMode("edit"); }}
                      className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-3 py-2 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(mode === "create" || mode === "edit") && (
        <Modal
          title={mode === "edit" ? "Editar trabajo" : "Nuevo trabajo"}
          onClose={() => { setMode("list"); setEditing(null); }}
        >
          <TrabajoForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => { setMode("list"); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

