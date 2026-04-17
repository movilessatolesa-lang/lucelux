"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import type { QuoteStatus } from "@/lib/types";
import { PresupuestoCreator } from "@/components/presupuestos/PresupuestoCreator";
import { DetallePresupuesto } from "@/components/presupuestos/DetallePresupuesto";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";

const QUOTE_STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "enviado", label: "Enviado" },
  { value: "aceptado", label: "Aceptado" },
  { value: "rechazado", label: "Rechazado" },
];

const STATUS_COLOR: Record<QuoteStatus, string> = {
  borrador: "bg-slate-100 text-slate-500",
  enviado: "bg-sky-50 text-sky-700",
  aceptado: "bg-green-50 text-green-700",
  rechazado: "bg-red-50 text-red-600",
};

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
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

export default function PresupuestosPage() {
  const { presupuestos, clientes, deletePresupuesto, updatePresupuesto } = useApp();
  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const nombreCliente = (id: string) => {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este presupuesto?")) {
      deletePresupuesto(id);
    }
  };

  const handleEnviarCliente = (p: typeof presupuestos[0]) => {
    const cliente = clientes.find((c) => c.id === p.clienteId);
    if (!cliente) return;
    
    const linkPublico = `${window.location.origin}/presupuestos/${p.id}/cliente`;
    const email = cliente.email;
    
    // Actualizar estado a "enviado"
    updatePresupuesto(p.id, {
      ...p,
      estado: "enviado",
    });
    
    // Copiar al clipboard
    navigator.clipboard.writeText(linkPublico);
    
    // Mostrar modal con info de envío
    alert(`✓ Presupuesto marcado como enviado.\n\nLink copiado al portapapeles:\n${linkPublico}\n\nEnvía este link a ${email}`);
  };

  const presupuestoDetalle = detalleId ? presupuestos.find((p) => p.id === detalleId) : null;

  const sorted = [...presupuestos].sort((a, b) =>
    new Date(a.fecha).getTime() < new Date(b.fecha).getTime() ? 1 : -1
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuestos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {presupuestos.length} presupuestos registrados
          </p>
        </div>
        <button
          onClick={() => setShowCreator(true)}
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
        <div className="space-y-3">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetalleId(p.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 truncate">{p.titulo}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {nombreCliente(p.clienteId)} •{" "}
                    <span className="font-medium">{p.lineas.length} materiales</span> •{" "}
                    {formatearFecha(p.fecha)}
                  </p>
                  {p.descripcion && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.descripcion}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg text-slate-900">
                    {formatearMoneda(p.importeTotal)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">IVA incluido</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      STATUS_COLOR[p.estado]
                    }`}
                  >
                    {QUOTE_STATUS_OPTIONS.find((o) => o.value === p.estado)?.label}
                  </span>

                  {p.estadoFirma === "aceptado" && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
                      ✓ Aceptado
                    </span>
                  )}
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEnviarCliente(p)}
                    className="px-3 py-2 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  >
                    📧 Enviar a cliente
                  </button>
                  <button
                    onClick={() => setEditingId(p.id)}
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
            </div>
          ))}
        </div>
      )}

      {(showCreator || editingId) && (
        <Modal
          title={editingId ? "Editar presupuesto" : "Nuevo presupuesto"}
          onClose={() => {
            setShowCreator(false);
            setEditingId(null);
          }}
        >
          <PresupuestoCreator
            presupuestoId={editingId ?? undefined}
            onClose={() => {
              setShowCreator(false);
              setEditingId(null);
            }}
            onSaved={() => {
              setShowCreator(false);
              setEditingId(null);
            }}
          />
        </Modal>
      )}

      {presupuestoDetalle && (
        <DetallePresupuesto
          presupuesto={presupuestoDetalle}
          onActualizar={(data) => {
            updatePresupuesto(presupuestoDetalle.id, data);
            setDetalleId(null);
          }}
          onClose={() => setDetalleId(null)}
        />
      )}
    </div>
  );
}
