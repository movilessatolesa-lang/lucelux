"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Presupuesto, QuoteStatus } from "@/lib/types";

const QUOTE_STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: "enviado", label: "Enviado" },
  { value: "aceptado", label: "Aceptado" },
  { value: "rechazado", label: "Rechazado" },
];

const STATUS_COLOR: Record<QuoteStatus, string> = {
  enviado: "bg-sky-50 text-sky-700",
  aceptado: "bg-green-50 text-green-700",
  rechazado: "bg-red-50 text-red-600",
};

const EMPTY: Omit<Presupuesto, "id" | "creadoEn"> = {
  clienteId: "",
  descripcion: "",
  importe: 0,
  fecha: new Date().toISOString().slice(0, 10),
  notas: "",
  estado: "enviado",
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
  initial?: Presupuesto;
  onSave: (data: Omit<Presupuesto, "id" | "creadoEn">) => void;
  onCancel: () => void;
}

function PresupuestoForm({ initial, onSave, onCancel }: FormProps) {
  const { clientes } = useApp();
  const [form, setForm] = useState<Omit<Presupuesto, "id" | "creadoEn">>(
    initial
      ? { clienteId: initial.clienteId, descripcion: initial.descripcion, importe: initial.importe, fecha: initial.fecha, notas: initial.notas, estado: initial.estado }
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
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]"
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
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]"
          placeholder="Ej. Celosías terraza"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Importe (€)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.importe}
            onChange={(e) => set("importe", parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
        <select
          value={form.estado}
          onChange={(e) => set("estado", e.target.value as QuoteStatus)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]"
        >
          {QUOTE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4] resize-none"
          placeholder="Observaciones…"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold py-3 rounded-xl transition-colors text-base">
          {initial ? "Guardar cambios" : "Crear presupuesto"}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-base">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function PresupuestosPage() {
  const { presupuestos, clientes, addPresupuesto, updatePresupuesto, deletePresupuesto } = useApp();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Presupuesto | null>(null);

  function nombreCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  function handleSave(data: Omit<Presupuesto, "id" | "creadoEn">) {
    if (mode === "edit" && editing) {
      updatePresupuesto(editing.id, data);
    } else {
      addPresupuesto(data);
    }
    setMode("list");
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar este presupuesto?")) deletePresupuesto(id);
  }

  const sorted = [...presupuestos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuestos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{presupuestos.length} presupuestos registrados</p>
        </div>
        <button
          onClick={() => setMode("create")}
          className="bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          + Nuevo presupuesto
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-400">
          No hay presupuestos. Crea el primero.
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((p) => (
            <li key={p.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{p.descripcion}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{nombreCliente(p.clienteId)} · {p.fecha}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-800">{p.importe > 0 ? `${p.importe.toLocaleString("es-ES")} €` : "—"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.estado]}`}>
                  {QUOTE_STATUS_OPTIONS.find((o) => o.value === p.estado)?.label}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(p); setMode("edit"); }}
                    className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
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
          title={mode === "edit" ? "Editar presupuesto" : "Nuevo presupuesto"}
          onClose={() => { setMode("list"); setEditing(null); }}
        >
          <PresupuestoForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => { setMode("list"); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
