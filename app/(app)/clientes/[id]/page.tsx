"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import type { Cliente, PaymentStatus, WorkStatus, QuoteStatus } from "@/lib/types";
import { ClienteForm } from "@/components/ClienteForm";
import { Modal } from "@/components/Modal";

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n?: number | null) => {
  if (typeof n !== "number" || Number.isNaN(n)) return "-";
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ── label / colour maps ───────────────────────────────────────────────────────

const WORK_LABEL: Record<WorkStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  en_fabricacion: "Fabricando",
  en_instalacion: "Instalando",
  terminado: "Terminado",
};

const WORK_COLOR: Record<WorkStatus, string> = {
  pendiente: "bg-slate-100 text-slate-500",
  aprobado: "bg-sky-50 text-sky-700",
  en_fabricacion: "bg-amber-50 text-amber-700",
  en_instalacion: "bg-purple-50 text-purple-700",
  terminado: "bg-green-50 text-green-700",
};

const COBRO_LABEL: Record<PaymentStatus, string> = {
  sin_adelanto: "Sin adelanto",
  adelanto_recibido: "Adelanto",
  parcial: "Parcial",
  pagado: "Pagado",
};

const COBRO_COLOR: Record<PaymentStatus, string> = {
  sin_adelanto: "bg-slate-100 text-slate-500",
  adelanto_recibido: "bg-amber-50 text-amber-700",
  parcial: "bg-orange-50 text-orange-700",
  pagado: "bg-green-50 text-green-700",
};

const QUOTE_LABEL: Record<QuoteStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
};

const QUOTE_COLOR: Record<QuoteStatus, string> = {
  borrador: "bg-slate-100 text-slate-500",
  enviado: "bg-sky-50 text-sky-700",
  aceptado: "bg-green-50 text-green-700",
  rechazado: "bg-red-50 text-red-600",
};

// ── page ──────────────────────────────────────────────────────────────────────

export default function ClienteDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  const { clientes, trabajos, presupuestos, updateCliente } = useApp();
  const [editing, setEditing] = useState(false);

  const cliente = clientes.find((c) => c.id === id);

  if (!cliente) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-500 font-medium">Cliente no encontrado.</p>
        <Link href="/clientes" className="mt-4 inline-block text-[#1558d4] font-semibold text-sm">
          ← Volver a clientes
        </Link>
      </div>
    );
  }

  const clienteTrabajos = [...trabajos.filter((t) => t.clienteId === id)].sort(
    (a, b) => (a.fecha < b.fecha ? 1 : -1)
  );
  const clientePresupuestos = [...presupuestos.filter((p) => p.clienteId === id)].sort(
    (a, b) => (a.fecha < b.fecha ? 1 : -1)
  );

  // ── economic summary ──────────────────────────────────────────────────────
  const totalFacturado = clienteTrabajos.reduce((s, t) => s + t.precio, 0);
  const totalCobrado = clienteTrabajos.reduce((s, t) => {
    if (t.estadoCobro === "pagado") return s + t.precio;
    return s + t.adelanto;
  }, 0);
  const totalPendiente = totalFacturado - totalCobrado;
  const totalAdelantos = clienteTrabajos.reduce((s, t) => s + t.adelanto, 0);

  const initials = cliente.nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function handleSave(data: Omit<Cliente, "id" | "creadoEn">) {
    updateCliente(id, data);
    setEditing(false);
  }

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    [cliente.direccion, cliente.ciudad].filter(Boolean).join(", ")
  )}`;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Back link */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Todos los clientes
      </Link>

      {/* ── A. Header card ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 select-none"
              style={{ background: "linear-gradient(135deg, #1558d4 0%, #0d1e6b 100%)" }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-900 leading-tight break-words">
                    {cliente.nombre}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium capitalize">
                      {cliente.tipo}
                    </span>
                    {cliente.recurrente && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                        ♻️ Recurrente
                      </span>
                    )}
                    {cliente.problematico && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                        ⚠️ Problemático
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-[#1558d4] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  Editar
                </button>
              </div>

              {/* Contact details */}
              <div className="mt-3 space-y-1.5">
                {cliente.telefono && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="text-slate-400 w-4 text-center">📞</span>
                    {cliente.telefono}
                  </p>
                )}
                {cliente.email && (
                  <p className="text-sm text-slate-600 flex items-center gap-2 break-all">
                    <span className="text-slate-400 w-4 text-center shrink-0">✉️</span>
                    {cliente.email}
                  </p>
                )}
                {(cliente.direccion || cliente.ciudad) && (
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 w-4 text-center shrink-0 mt-0.5">📍</span>
                    <span>
                      {[cliente.direccion, cliente.ciudad, cliente.codigoPostal]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>
                )}
                {cliente.dniNif && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="text-slate-400 w-4 text-center">🪪</span>
                    {cliente.dniNif}
                  </p>
                )}
              </div>

              {/* Tags */}
              {cliente.tags && cliente.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {cliente.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1558d4]/10 text-[#1558d4] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick action bar */}
        <div className="border-t border-slate-100 grid grid-cols-4 divide-x divide-slate-100">
          {[
            {
              label: "Llamar",
              icon: "📞",
              href: cliente.telefono ? `tel:${cliente.telefono.replace(/\s/g, "")}` : null,
            },
            {
              label: "WhatsApp",
              icon: "💬",
              href: cliente.telefono
                ? `https://wa.me/34${cliente.telefono.replace(/\s/g, "")}`
                : null,
              external: true,
            },
            {
              label: "Mapa",
              icon: "🗺️",
              href: cliente.direccion || cliente.ciudad ? mapsUrl : null,
              external: true,
            },
          ].map((action) =>
            action.href ? (
              <a
                key={action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                className="flex flex-col items-center gap-1 py-3 hover:bg-slate-50 transition-colors"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-[10px] font-semibold text-slate-500">{action.label}</span>
              </a>
            ) : (
              <div key={action.label} className="flex flex-col items-center gap-1 py-3 opacity-30">
                <span className="text-xl">{action.icon}</span>
                <span className="text-[10px] font-semibold text-slate-500">{action.label}</span>
              </div>
            )
          )}
          <button
            onClick={() => setEditing(true)}
            className="flex flex-col items-center gap-1 py-3 hover:bg-slate-50 transition-colors"
          >
            <span className="text-xl">✏️</span>
            <span className="text-[10px] font-semibold text-slate-500">Editar</span>
          </button>
        </div>
      </div>

      {/* ── B. Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Trabajos",
            value: clienteTrabajos.length.toString(),
            color: "text-slate-800",
          },
          {
            label: "Presupuestos",
            value: clientePresupuestos.length.toString(),
            color: "text-slate-800",
          },
          {
            label: "Facturado",
            value: `${fmt(totalFacturado)}€`,
            color: "text-slate-800",
          },
          {
            label: "Cobrado",
            value: `${fmt(totalCobrado)}€`,
            color: "text-green-600",
          },
          {
            label: "Pendiente",
            value: `${fmt(totalPendiente)}€`,
            color: totalPendiente > 0 ? "text-red-500" : "text-green-600",
          },
          {
            label: "Adelantos",
            value: `${fmt(totalAdelantos)}€`,
            color: "text-amber-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-2xl px-3 py-3 text-center"
          >
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className={`text-base font-bold mt-0.5 leading-tight ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── E. Economic warning ───────────────────────────────────────────────── */}
      {totalPendiente > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-red-700 text-sm">Deuda pendiente de cobro</p>
            <p className="text-red-600 text-xs mt-0.5">
              <strong>{fmt(totalPendiente)}€</strong> sin cobrar de un total facturado de{" "}
              {fmt(totalFacturado)}€.
            </p>
          </div>
        </div>
      )}

      {/* ── C. Trabajos ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-3">
          Trabajos{" "}
          {clienteTrabajos.length > 0 && (
            <span className="text-sm font-normal text-slate-400">
              ({clienteTrabajos.length})
            </span>
          )}
        </h2>
        {clienteTrabajos.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-8 text-center text-slate-400 text-sm">
            Sin trabajos registrados.
          </div>
        ) : (
          <ul className="space-y-2">
            {clienteTrabajos.map((t) => {
              const pendiente = Math.max(0, t.precio - t.adelanto);
              return (
                <li key={t.id} className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{t.descripcion}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.fecha}
                        {t.medidas ? " · " + t.medidas : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${WORK_COLOR[t.estado]}`}
                      >
                        {WORK_LABEL[t.estado]}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${COBRO_COLOR[t.estadoCobro]}`}
                      >
                        {COBRO_LABEL[t.estadoCobro]}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                      <p className="text-[9px] text-slate-400 font-medium uppercase">Total</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {t.precio > 0 ? fmt(t.precio) + "€" : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                      <p className="text-[9px] text-slate-400 font-medium uppercase">Cobrado</p>
                      <p className="text-xs font-bold text-amber-600 mt-0.5">
                        {t.adelanto > 0 ? fmt(t.adelanto) + "€" : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                      <p className="text-[9px] text-slate-400 font-medium uppercase">Pendiente</p>
                      <p
                        className={`text-xs font-bold mt-0.5 ${
                          pendiente > 0 ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {t.precio > 0 ? fmt(pendiente) + "€" : "—"}
                      </p>
                    </div>
                  </div>

                  {t.adelanto > 0 && t.metodoPagoAdelanto && (
                    <p className="text-[10px] text-slate-400 mt-2 capitalize">
                      {t.metodoPagoAdelanto}
                      {t.fechaAdelanto ? " · " + t.fechaAdelanto : ""}
                    </p>
                  )}
                  {t.notas && (
                    <p className="text-[11px] text-slate-500 mt-1.5 italic">{t.notas}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── D. Presupuestos ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-3">
          Presupuestos{" "}
          {clientePresupuestos.length > 0 && (
            <span className="text-sm font-normal text-slate-400">
              ({clientePresupuestos.length})
            </span>
          )}
        </h2>
        {clientePresupuestos.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-8 text-center text-slate-400 text-sm">
            Sin presupuestos registrados.
          </div>
        ) : (
          <ul className="space-y-2">
            {clientePresupuestos.map((p) => (
              <li
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{p.descripcion}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.fecha}
                    {p.notas ? " · " + p.notas : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="font-bold text-slate-800 text-sm">{fmt(p.importeTotal)}€</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${QUOTE_COLOR[p.estado]}`}
                  >
                    {QUOTE_LABEL[p.estado]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── F. Internal notes ────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-3">Notas internas</h2>
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 min-h-[80px]">
          {cliente.notas ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{cliente.notas}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              Sin notas. Edita el cliente para añadir observaciones.
            </p>
          )}
        </div>
      </section>

      {/* ── G. Files / photos placeholder ────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-3">Fotos y documentos</h2>
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl px-5 py-10 text-center">
          <p className="text-4xl mb-2">📁</p>
          <p className="text-sm font-semibold text-slate-500">Próximamente</p>
          <p className="text-xs text-slate-400 mt-1">
            Podrás subir fotos del trabajo, contratos y documentos del cliente.
          </p>
        </div>
      </section>

      {/* Edit modal */}
      {editing && (
        <Modal title="Editar cliente" onClose={() => setEditing(false)}>
          <ClienteForm
            initial={cliente}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
    </div>
  );
}
