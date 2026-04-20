"use client";

import { useState, useEffect } from "react";
import type { Trabajo, Cliente, PaymentStatus } from "@/lib/types";
import { getTrabajos, getClientes, updateTrabajo as dbUpdateTrabajo } from "@/lib/db";

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "sin_adelanto",      label: "Sin adelanto" },
  { value: "adelanto_recibido", label: "Adelanto recibido" },
  { value: "parcial",           label: "Parcial" },
  { value: "pagado",            label: "Pagado" },
];

const COBRO_COLOR: Record<PaymentStatus, string> = {
  sin_adelanto:      "bg-slate-100 text-slate-500",
  adelanto_recibido: "bg-amber-50 text-amber-700",
  parcial:           "bg-orange-50 text-orange-700",
  pagado:            "bg-green-50 text-green-700",
};

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CobrosPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    getTrabajos().then(setTrabajos).catch(console.error);
    getClientes().then(setClientes).catch(console.error);
  }, []);

  function nombreCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  const pendientes = trabajos.filter((t) => t.estadoCobro !== "pagado");
  const pagados    = trabajos.filter((t) => t.estadoCobro === "pagado");

  async function setEstadoCobro(id: string, val: PaymentStatus) {
    await dbUpdateTrabajo(id, { estadoCobro: val });
    setTrabajos((prev) => prev.map((t) => t.id === id ? { ...t, estadoCobro: val } : t));
  }

  function renderList(list: typeof trabajos, title: string) {
    return (
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">{title} ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-slate-400 text-sm">Ninguno.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((t) => {
              const pendiente = Math.max(0, t.precio - t.adelanto);
              return (
                <li key={t.id} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{t.descripcion}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{nombreCliente(t.clienteId)} · {t.fecha}</p>
                    </div>
                    <select
                      value={t.estadoCobro}
                      onChange={(e) => setEstadoCobro(t.id, e.target.value as PaymentStatus)}
                      className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#1558d4] cursor-pointer ${COBRO_COLOR[t.estadoCobro]}`}
                    >
                      {PAYMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
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
                  {t.adelanto > 0 && t.metodoPagoAdelanto && (
                    <p className="text-[11px] text-slate-400 mt-2 capitalize">
                      Adelanto: {t.metodoPagoAdelanto}{t.fechaAdelanto ? ` · ${t.fechaAdelanto}` : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  const totalFacturado  = trabajos.reduce((s, t) => s + (t.precio   || 0), 0);
  const totalAdelantos  = trabajos.reduce((s, t) => s + (t.adelanto  || 0), 0);
  const totalPendiente  = trabajos.reduce((s, t) => s + Math.max(0, (t.precio || 0) - (t.adelanto || 0)), 0);
  const totalCobrado    = trabajos.filter((t) => t.estadoCobro === "pagado").reduce((s, t) => s + (t.precio || 0), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cobros</h1>
        <p className="text-slate-500 text-sm mt-0.5">Estado de cobros de todos los trabajos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total facturado</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{fmt(totalFacturado)} €</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Adelantos recibidos</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{fmt(totalAdelantos)} €</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Importe pendiente</p>
          <p className="text-xl font-bold text-red-500 mt-1">{fmt(totalPendiente)} €</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Pagado completo</p>
          <p className="text-xl font-bold text-green-600 mt-1">{fmt(totalCobrado)} €</p>
        </div>
      </div>

      {renderList(pendientes, "Por cobrar")}
      {renderList(pagados, "Cobrado")}
    </div>
  );
}

