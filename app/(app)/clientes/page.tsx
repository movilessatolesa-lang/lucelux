"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Cliente, Trabajo } from "@/lib/types";
import { getClientes, getTrabajos, createCliente, updateCliente } from "@/lib/db";
import { ClienteForm } from "@/components/ClienteForm";
import { Modal } from "@/components/Modal";

const fmt = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function clienteStats(id: string, trabajos: Trabajo[]) {
  const ts = trabajos.filter((t) => t.clienteId === id);
  const facturado = ts.reduce((s, t) => s + t.precio, 0);
  const cobrado = ts.reduce((s, t) => {
    if (t.estadoCobro === "pagado") return s + t.precio;
    return s + t.adelanto;
  }, 0);
  const pendiente = facturado - cobrado;
  const ultimaFecha = ts.map((t) => t.fecha).sort().at(-1) ?? "";
  return { count: ts.length, facturado, pendiente, ultimaFecha };
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getClientes().then(setClientes).catch(console.error);
    getTrabajos().then(setTrabajos).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        c.direccion.toLowerCase().includes(q) ||
        (c.ciudad ?? "").toLowerCase().includes(q)
    );
  }, [clientes, search]);

  async function handleSave(data: Omit<Cliente, "id" | "creadoEn">) {
    if (mode === "edit" && editing) {
      const updated = await updateCliente(editing.id, data);
      setClientes((prev) => prev.map((c) => c.id === editing.id ? updated : c));
    } else {
      const nuevo = await createCliente(data);
      setClientes((prev) => [nuevo, ...prev]);
    }
    setMode("list");
    setEditing(null);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={() => { setEditing(null); setMode("create"); }}
          className="bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm shrink-0"
        >
          + Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o dirección…"
          className="w-full border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-400">
          {search ? "Sin resultados para esa búsqueda." : "No hay clientes. Crea el primero."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => {
            const stats = clienteStats(c.id, trabajos);
            const initials = c.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
            return (
              <li key={c.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Card body */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: "linear-gradient(135deg, #1558d4, #0d1e6b)" }}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900">{c.nombre}</p>
                            {c.tipo === "empresa" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">Empresa</span>
                            )}
                            {c.recurrente && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">♻️ Recurrente</span>
                            )}
                            {c.problematico && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">⚠️ Problemático</span>
                            )}
                          </div>
                          {c.telefono && (
                            <p className="text-sm text-slate-500 mt-0.5">{c.telefono}</p>
                          )}
                          {(c.direccion || c.ciudad) && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {[c.direccion, c.ciudad].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>

                        {/* Economic badge */}
                        <div className="text-right shrink-0">
                          {stats.pendiente > 0 ? (
                            <span className="inline-block text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-600 font-semibold whitespace-nowrap">
                              Debe {fmt(stats.pendiente)}€
                            </span>
                          ) : stats.facturado > 0 ? (
                            <span className="inline-block text-[11px] px-2 py-1 rounded-lg bg-green-50 text-green-700 font-semibold">
                              Al día
                            </span>
                          ) : null}
                          {stats.count > 0 && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              {stats.count} trabajo{stats.count !== 1 ? "s" : ""}
                            </p>
                          )}
                          {stats.ultimaFecha && (
                            <p className="text-[10px] text-slate-400">{stats.ultimaFecha}</p>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {c.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1558d4]/10 text-[#1558d4] font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="border-t border-slate-100 grid grid-cols-4 divide-x divide-slate-100">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="py-2.5 text-center text-xs font-semibold text-[#1558d4] hover:bg-blue-50 transition-colors"
                  >
                    Ver ficha
                  </Link>
                  <button
                    onClick={() => { setEditing(c); setMode("edit"); }}
                    className="py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Editar
                  </button>
                  {c.telefono ? (
                    <a
                      href={`https://wa.me/34${c.telefono.replace(/\s/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 text-center text-xs font-semibold text-green-600 hover:bg-green-50 transition-colors"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="py-2.5 text-center text-xs text-slate-300">WhatsApp</span>
                  )}
                  {c.telefono ? (
                    <a
                      href={`tel:${c.telefono.replace(/\s/g, "")}`}
                      className="py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Llamar
                    </a>
                  ) : (
                    <span className="py-2.5 text-center text-xs text-slate-300">Llamar</span>
                  )}
                </div>
              </li>
            );
          })}
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
