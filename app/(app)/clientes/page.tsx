"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Cliente } from "@/lib/types";
import { ClienteForm } from "@/components/ClienteForm";
import { Modal } from "@/components/Modal";

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
