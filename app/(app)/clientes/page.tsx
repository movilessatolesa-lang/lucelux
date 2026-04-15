"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Cliente } from "@/lib/types";

const EMPTY: Omit<Cliente, "id" | "creadoEn"> = {
  nombre: "",
  telefono: "",
  direccion: "",
  notas: "",
};

interface Props {
  initial?: Cliente;
  onSave: (data: Omit<Cliente, "id" | "creadoEn">) => void;
  onCancel: () => void;
}

export function ClienteForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<Cliente, "id" | "creadoEn">>(
    initial ? { nombre: initial.nombre, telefono: initial.telefono, direccion: initial.direccion, notas: initial.notas } : EMPTY
  );

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre *
        </label>
        <input
          required
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nombre del cliente"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="612 345 678"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Dirección
        </label>
        <input
          value={form.direccion}
          onChange={(e) => set("direccion", e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Calle, número, ciudad"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notas
        </label>
        <textarea
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Observaciones adicionales…"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {initial ? "Guardar cambios" : "Crear cliente"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-base"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
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

export default function ClientesPage() {
  const { clientes, addCliente, updateCliente, deleteCliente } = useApp();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Cliente | null>(null);

  function openEdit(c: Cliente) {
    setEditing(c);
    setMode("edit");
  }

  function handleSave(data: Omit<Cliente, "id" | "creadoEn">) {
    if (mode === "edit" && editing) {
      updateCliente(editing.id, data);
    } else {
      addCliente(data);
    }
    setMode("list");
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar este cliente?")) deleteCliente(id);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={() => setMode("create")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          + Nuevo cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-400">
          No hay clientes. Crea el primero.
        </div>
      ) : (
        <ul className="space-y-3">
          {clientes.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{c.nombre}</p>
                {c.telefono && (
                  <p className="text-sm text-slate-500 mt-0.5">{c.telefono}</p>
                )}
                {c.direccion && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{c.direccion}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-2 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(mode === "create" || mode === "edit") && (
        <Modal
          title={mode === "edit" ? "Editar cliente" : "Nuevo cliente"}
          onClose={() => { setMode("list"); setEditing(null); }}
        >
          <ClienteForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => { setMode("list"); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
