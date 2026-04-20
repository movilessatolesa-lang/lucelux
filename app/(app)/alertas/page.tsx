"use client";

import { useMemo, useState, useEffect } from "react";
import { getPresupuestos, getTrabajos, getClientes } from "@/lib/db";
import { generarAlertas, whatsappUrl } from "@/lib/alertas";
import type { Alerta, AlertaTipo } from "@/lib/alertas";
import type { Presupuesto, Trabajo, Cliente } from "@/lib/types";

// ── helpers ───────────────────────────────────────────────────────────────────

const TIPO_CFG: Record<
  AlertaTipo,
  { label: string; emoji: string; bg: string; text: string; border: string }
> = {
  presupuesto_sin_respuesta: {
    label: "Sin respuesta",
    emoji: "📨",
    bg: "#eff6ff",
    text: "#1558d4",
    border: "#bfdbfe",
  },
  presupuesto_vencido: {
    label: "Presupuesto vencido",
    emoji: "⏰",
    bg: "#fef3c7",
    text: "#92400e",
    border: "#fde68a",
  },
  cobro_pendiente: {
    label: "Cobro pendiente",
    emoji: "💶",
    bg: "#fef2f2",
    text: "#991b1b",
    border: "#fecaca",
  },
  garantia_revision: {
    label: "Revisión garantía",
    emoji: "🛡️",
    bg: "#f0fdf4",
    text: "#166534",
    border: "#bbf7d0",
  },
};

const PRIORIDAD_CFG = {
  alta:  { dot: "#ef4444", label: "Urgente" },
  media: { dot: "#f59e0b", label: "Media" },
  baja:  { dot: "#94a3b8", label: "Baja" },
};

// ── componente de tarjeta ─────────────────────────────────────────────────────

function AlertaCard({ alerta }: { alerta: Alerta }) {
  const [copied, setCopied] = useState(false);
  const cfg = TIPO_CFG[alerta.tipo];
  const prio = PRIORIDAD_CFG[alerta.prioridad];
  const tieneWA = !!alerta.clienteTelefono && !!alerta.whatsappMsg;

  function copyMsg() {
    if (!alerta.whatsappMsg) return;
    navigator.clipboard.writeText(alerta.whatsappMsg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: cfg.border }}
    >
      {/* Cabecera */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: cfg.bg }}
      >
        <span className="text-xl shrink-0">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: prio.dot }}>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: prio.dot }}
              />
              {prio.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
            {alerta.titulo}
          </p>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-slate-700">{alerta.descripcion}</p>

        {alerta.clienteNombre && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {alerta.clienteNombre}
            {alerta.clienteTelefono && (
              <span className="text-slate-400">· {alerta.clienteTelefono}</span>
            )}
          </div>
        )}

        {alerta.importePendiente !== undefined && (
          <div className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            {alerta.importePendiente.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            € pendientes
          </div>
        )}

        {/* Mensaje prefabricado */}
        {alerta.whatsappMsg && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed italic">
            &ldquo;{alerta.whatsappMsg}&rdquo;
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1 flex-wrap">
          {tieneWA && (
            <a
              href={whatsappUrl(alerta.clienteTelefono!, alerta.whatsappMsg!)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] rounded-xl px-3 py-2 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar por WhatsApp
            </a>
          )}
          {alerta.whatsappMsg && (
            <button
              onClick={copyMsg}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
            >
              {copied ? (
                <>✓ Copiado</>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copiar mensaje
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── página principal ──────────────────────────────────────────────────────────

type Filtro = "todas" | AlertaTipo;

export default function AlertasPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  useEffect(() => {
    Promise.all([getPresupuestos(), getTrabajos(), getClientes()]).then(([ps, ts, cs]) => {
      setPresupuestos(ps);
      setTrabajos(ts);
      setClientes(cs);
    });
  }, []);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const alertas = useMemo(
    () => generarAlertas(presupuestos, trabajos, clientes, baseUrl),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presupuestos, trabajos, clientes]
  );

  const filtered = filtro === "todas" ? alertas : alertas.filter((a) => a.tipo === filtro);

  const urgentes = alertas.filter((a) => a.prioridad === "alta").length;

  const contadores: Record<AlertaTipo, number> = {
    presupuesto_sin_respuesta: alertas.filter((a) => a.tipo === "presupuesto_sin_respuesta").length,
    presupuesto_vencido:       alertas.filter((a) => a.tipo === "presupuesto_vencido").length,
    cobro_pendiente:           alertas.filter((a) => a.tipo === "cobro_pendiente").length,
    garantia_revision:         alertas.filter((a) => a.tipo === "garantia_revision").length,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Alertas</h1>
          {alertas.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
              {alertas.length}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm mt-0.5">
          Acciones pendientes y avisos automáticos del negocio
        </p>
      </div>

      {/* Resumen urgente */}
      {urgentes > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <span className="text-2xl">🔴</span>
          <div>
            <p className="font-semibold text-red-800">
              {urgentes} alerta{urgentes !== 1 ? "s" : ""} urgente{urgentes !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-red-600">Requieren atención inmediata</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltro("todas")}
          className={[
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
            filtro === "todas"
              ? "bg-[#1558d4] text-white border-[#1558d4]"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400",
          ].join(" ")}
        >
          Todas ({alertas.length})
        </button>
        {(Object.entries(TIPO_CFG) as [AlertaTipo, typeof TIPO_CFG[AlertaTipo]][]).map(
          ([tipo, cfg]) =>
            contadores[tipo] > 0 && (
              <button
                key={tipo}
                onClick={() => setFiltro(tipo)}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  filtro === tipo
                    ? "bg-[#1558d4] text-white border-[#1558d4]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400",
                ].join(" ")}
              >
                {cfg.emoji} {cfg.label} ({contadores[tipo]})
              </button>
            )
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
          <div className="text-4xl">✅</div>
          <p className="font-semibold text-slate-700">
            {filtro === "todas" ? "¡Todo en orden!" : "Sin alertas de este tipo"}
          </p>
          <p className="text-sm text-slate-400">
            {filtro === "todas"
              ? "No hay presupuestos sin respuesta, cobros pendientes ni garantías por revisar."
              : "Prueba a ver todas las alertas."}
          </p>
          {filtro !== "todas" && (
            <button
              onClick={() => setFiltro("todas")}
              className="text-xs text-[#1558d4] hover:underline"
            >
              Ver todas
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alerta) => (
            <AlertaCard key={alerta.id} alerta={alerta} />
          ))}
        </div>
      )}
    </div>
  );
}
