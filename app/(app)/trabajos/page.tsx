"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Trabajo, WorkStatus, PaymentStatus } from "@/lib/types";

const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado", label: "Aprobado" },
  { value: "en_fabricacion", label: "En fabricación" },
  { value: "en_instalacion", label: "En instalación" },
  { value: "terminado", label: "Terminado" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
];

const STATUS_COLOR: Record<WorkStatus, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  aprobado: "bg-sky-50 text-sky-700",
  en_fabricacion: "bg-indigo-50 text-indigo-700",
  en_instalacion: "bg-purple-50 text-purple-700",
  terminado: "bg-green-50 text-green-700",
};

const COBRO_COLOR: Record<PaymentStatus, string> = {
  pendiente: "bg-red-50 text-red-600",
  parcial: "bg-amber-50 text-amber-700",
  pagado: "bg-green-50 text-green-700",
};

const EMPTY: Omit<Trabajo, "id" | "creadoEn"> = {
  clienteId: "",
  descripcion: "",
  medidas: "",
  precio: 0,
  fecha: new Date().toISOString().slice(0, 10),
  notas: "",
  estado: "pendiente",
  estadoCobro: "pendiente",
};

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
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
      ? { clienteId: initial.clienteId, descripcion: initial.descripcion, medidas: initial.medidas, precio: initial.precio, fecha: initial.fecha, notas: initial.notas, estado: initial.estado, estadoCobro: initial.estadoCobro }
      : EMPTY
  );

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descripcion.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
        <select
          value={form.clienteId}
          onChange={(e) => set("clienteId", e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Sin cliente —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
        <input
          required
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej. Ventana corredera aluminio"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Medidas</label>
          <input
            value={form.medidas}
            onChange={(e) => set("medidas", e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="150×120 cm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Precio (€)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.precio}
            onChange={(e) => set("precio", parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
        <input
          type="date"
          value={form.fecha}
          onChange={(e) => set("fecha", e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select
            value={form.estado}
            onChange={(e) => set("estado", e.target.value as WorkStatus)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {WORK_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cobro</label>
          <select
            value={form.estadoCobro}
            onChange={(e) => set("estadoCobro", e.target.value as PaymentStatus)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAYMENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Observaciones…"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-base">
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
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
          {sorted.map((t) => (
            <li key={t.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{t.descripcion}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{nombreCliente(t.clienteId)} · {t.fecha}</p>
                  {t.medidas && <p className="text-xs text-slate-400 mt-0.5">{t.medidas}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-800">{t.precio > 0 ? `${t.precio.toLocaleString("es-ES")} €` : "—"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.estado]}`}>
                    {WORK_STATUS_OPTIONS.find((o) => o.value === t.estado)?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COBRO_COLOR[t.estadoCobro]}`}>
                    {PAYMENT_STATUS_OPTIONS.find((o) => o.value === t.estadoCobro)?.label}
                  </span>
                </div>
                <div className="flex gap-2">
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
          ))}
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
