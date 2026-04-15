"use client";

import { useState } from "react";
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
    initial
      ? { nombre: initial.nombre, telefono: initial.telefono, direccion: initial.direccion, notas: initial.notas }
      : EMPTY
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
