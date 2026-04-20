"use client";

import { useState, useEffect } from "react";
import type { Presupuesto, Cliente, QuoteStatus } from "@/lib/types";
import {
  getPresupuestos,
  getClientes,
  deletePresupuesto as dbDeletePresupuesto,
  updatePresupuesto as dbUpdatePresupuesto,
} from "@/lib/db";
import { PresupuestoCreator } from "@/components/presupuestos/PresupuestoCreator";
import { DetallePresupuesto } from "@/components/presupuestos/DetallePresupuesto";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";
import { whatsappUrl } from "@/lib/alertas";

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
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPresupuestos(), getClientes()]).then(([ps, cs]) => {
      setPresupuestos(ps);
      setClientes(cs);
    });
  }, []);

  const nombreCliente = (id: string) => {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  };

  const enlacePresupuesto = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/presupuestos/${id}/cliente`;
  };

  const waUrlPresupuesto = (p: typeof presupuestos[0]) => {
    const cliente = clientes.find((c) => c.id === p.clienteId);
    if (!cliente?.telefono) return null;
    const nombre = cliente.nombre.split(" ")[0];
    const importe = formatearMoneda(p.importeTotal);
    const enlace = enlacePresupuesto(p.id);
    const msg = `Hola ${nombre} 👋, le enviamos desde LUCELUX el presupuesto "${p.titulo}" por importe de ${importe} (IVA incluido). Puede consultarlo y aceptarlo aquí:\n${enlace}\n\nSi tiene alguna pregunta, estamos a su disposición. ¡Gracias!`;
    return whatsappUrl(cliente.telefono, msg);
  };

  const waUrlRecordatorio = (p: typeof presupuestos[0]) => {
    const cliente = clientes.find((c) => c.id === p.clienteId);
    if (!cliente?.telefono) return null;
    const nombre = cliente.nombre.split(" ")[0];
    const enlace = enlacePresupuesto(p.id);
    const msg = `Hola ${nombre} 👋, le escribimos desde LUCELUX para recordarle el presupuesto "${p.titulo}" que le enviamos. Puede revisarlo aquí:\n${enlace}\n\n¿Tiene alguna duda o le podemos ayudar? Quedamos a su disposición.`;
    return whatsappUrl(cliente.telefono, msg);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este presupuesto?")) {
      await dbDeletePresupuesto(id);
      setPresupuestos((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleEnviarCliente = async (p: Presupuesto) => {
    const cliente = clientes.find((c) => c.id === p.clienteId);
    if (!cliente) return;
    await dbUpdatePresupuesto(p.id, { ...p, estado: "enviado" });
    setPresupuestos((prev) =>
      prev.map((pres) => (pres.id === p.id ? { ...pres, estado: "enviado" } : pres))
    );
    alert(`✓ Presupuesto marcado como enviado a ${cliente.nombre}.`);
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
                  {p.estado === "enviado" && waUrlRecordatorio(p) && (
                    <a
                      href={waUrlRecordatorio(p)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-xs font-medium bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128c3e] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Recordatorio WA
                    </a>
                  )}
                  {p.estado === "borrador" && waUrlPresupuesto(p) && (
                    <a
                      href={waUrlPresupuesto(p)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={async () => {
                        await dbUpdatePresupuesto(p.id, { ...p, estado: "enviado" });
                        setPresupuestos((prev) =>
                          prev.map((pres) => (pres.id === p.id ? { ...pres, estado: "enviado" } : pres))
                        );
                      }}
                      className="px-3 py-2 text-xs font-medium bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128c3e] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Enviar por WhatsApp
                    </a>
                  )}
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

      {showCreator && (
        <Modal title="Nuevo presupuesto" onClose={() => setShowCreator(false)}>
          <PresupuestoCreator
            onClose={() => setShowCreator(false)}
            onSaved={async () => {
              setShowCreator(false);
              setPresupuestos(await getPresupuestos());
            }}
          />
        </Modal>
      )}
      {editingId && (
        <Modal title="Editar presupuesto" onClose={() => setEditingId(null)}>
          <PresupuestoCreator
            presupuestoId={editingId}
            onClose={() => setEditingId(null)}
            onSaved={async () => {
              setEditingId(null);
              setPresupuestos(await getPresupuestos());
            }}
          />
        </Modal>
      )}
      {detalleId && presupuestoDetalle && (
        <Modal title="Detalle del presupuesto" onClose={() => setDetalleId(null)}>
          <DetallePresupuesto 
            presupuesto={presupuestoDetalle}
            cliente={clientes.find((c) => c.id === presupuestoDetalle.clienteId) ?? null}
            onActualizar={async (data) => {
              const updated = { ...presupuestoDetalle, ...data };
              await dbUpdatePresupuesto(presupuestoDetalle.id, updated);
              setPresupuestos((prev) =>
                prev.map((p) => (p.id === presupuestoDetalle.id ? updated : p))
              );
            }}
            onClose={() => setDetalleId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
