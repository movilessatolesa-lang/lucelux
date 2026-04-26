"use client";

import { useMemo, useState, useEffect } from "react";
import { getTrabajos, getPresupuestos, getClientes } from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import type { Trabajo, Presupuesto, Cliente, WorkStatus } from "@/lib/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDec(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthKey(fecha: string) {
  // "2025-03-15" → "2025-03"
  return fecha.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("es-ES", {
    month: "short",
    year: "numeric",
  });
}

const TRABAJO_STATUS_LABEL: Record<WorkStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  en_fabricacion: "En fabricación",
  en_instalacion: "En instalación",
  terminado: "Terminado",
};

const STATUS_COLORS: Record<WorkStatus, string> = {
  pendiente: "#f59e0b",
  aprobado: "#0ea5e9",
  en_fabricacion: "#6366f1",
  en_instalacion: "#f97316",
  terminado: "#22c55e",
};

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color = "#1558d4",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── simple bar chart ──────────────────────────────────────────────────────────

function BarChart({
  data,
  color = "#1558d4",
  unit = "€",
}: {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-36 w-full">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
              {d.value > 0 ? `${fmt(d.value)}${unit}` : ""}
            </span>
            <div className="w-full relative rounded-t-md transition-all" style={{ height: `${Math.max(pct, 2)}%`, background: color }} />
            <span className="text-[10px] text-slate-400 truncate max-w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── donut ─────────────────────────────────────────────────────────────────────

function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-slate-400 text-sm text-center py-6">Sin datos</p>;

  let cumulativePercent = 0;
  const size = 120;
  const strokeWidth = 22;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dashArray = `${pct * circ} ${circ}`;
          const rotation = cumulativePercent * 360 - 90;
          cumulativePercent += pct;
          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={0}
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5 text-xs">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-slate-600">{seg.label}</span>
            <span className="ml-auto font-semibold text-slate-800 pl-3">
              {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

type Periodo = "3m" | "6m" | "12m" | "all";

export default function AnaliticaPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [periodo, setPeriodo] = useState<Periodo>("12m");

  useEffect(() => {
    getTrabajos().then(setTrabajos).catch(console.error);
    getPresupuestos().then(setPresupuestos).catch(console.error);
    getClientes().then(setClientes).catch(console.error);
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const hoy = new Date();

  // Filtro por periodo
  const mesesAtras = periodo === "3m" ? 3 : periodo === "6m" ? 6 : periodo === "12m" ? 12 : 999;
  const desde = new Date(hoy);
  desde.setMonth(desde.getMonth() - mesesAtras);
  const desdeKey = desde.toISOString().slice(0, 10);

  const misTrabajos = trabajos.filter(
    (t) => !userId || t.usuarioId === userId || (periodo === "all" || t.fecha >= desdeKey)
  ).filter((t) => periodo === "all" || t.fecha >= desdeKey);
  const misPresupuestos = presupuestos.filter(
    (p) => periodo === "all" || p.fecha >= desdeKey
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const { totalFacturado, totalCobrado, totalPendiente } = useMemo(() => {
    let totalFacturado = 0;
    let totalCobrado = 0;
    for (const t of misTrabajos) {
      totalFacturado += t.precio;
      totalCobrado += t.adelanto;
      if (t.estadoCobro === "pagado") totalCobrado = totalCobrado - t.adelanto + t.precio;
    }
    const totalPendiente = Math.max(0, totalFacturado - totalCobrado);
    return { totalFacturado, totalCobrado, totalPendiente };
  }, [misTrabajos]);

  const conversionRate = useMemo(() => {
    if (misPresupuestos.length === 0) return 0;
    const aceptados = misPresupuestos.filter((p) => p.estado === "aceptado").length;
    return Math.round((aceptados / misPresupuestos.length) * 100);
  }, [misPresupuestos]);

  // ── Ingresos por mes ──────────────────────────────────────────────────────

  const ingresosPorMes = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of misTrabajos) {
      const key = monthKey(t.fecha);
      map.set(key, (map.get(key) ?? 0) + t.precio);
    }
    const keys = [...map.keys()].sort();
    return keys.map((k) => ({ label: monthLabel(k), value: map.get(k) ?? 0 }));
  }, [misTrabajos]);

  // ── Top clientes ──────────────────────────────────────────────────────────

  const topClientes = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; count: number }>();
    for (const t of misTrabajos) {
      const cliente = clientes.find((c) => c.id === t.clienteId);
      const nombre = cliente?.nombre ?? "Sin cliente";
      const prev = map.get(t.clienteId) ?? { nombre, total: 0, count: 0 };
      map.set(t.clienteId, { nombre, total: prev.total + t.precio, count: prev.count + 1 });
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 6);
  }, [misTrabajos, clientes]);

  const topClientesMax = topClientes[0]?.total ?? 1;

  // ── Trabajos por estado ───────────────────────────────────────────────────

  const estadoSegments = useMemo(() => {
    const map = new Map<WorkStatus, number>();
    for (const t of misTrabajos) {
      map.set(t.estado, (map.get(t.estado) ?? 0) + 1);
    }
    return (Object.keys(STATUS_COLORS) as WorkStatus[])
      .filter((s) => (map.get(s) ?? 0) > 0)
      .map((s) => ({
        label: TRABAJO_STATUS_LABEL[s],
        value: map.get(s) ?? 0,
        color: STATUS_COLORS[s],
      }));
  }, [misTrabajos]);

  // ── Presupuestos por estado ───────────────────────────────────────────────

  const presupSegments = useMemo(() => {
    const estados = ["borrador", "enviado", "aceptado", "rechazado"] as const;
    const colores = {
      borrador: "#94a3b8",
      enviado: "#0ea5e9",
      aceptado: "#22c55e",
      rechazado: "#ef4444",
    };
    const labels = {
      borrador: "Borrador",
      enviado: "Enviado",
      aceptado: "Aceptado",
      rechazado: "Rechazado",
    };
    const map = new Map<string, number>();
    for (const p of misPresupuestos) {
      map.set(p.estado, (map.get(p.estado) ?? 0) + 1);
    }
    return estados
      .filter((e) => (map.get(e) ?? 0) > 0)
      .map((e) => ({ label: labels[e], value: map.get(e) ?? 0, color: colores[e] }));
  }, [misPresupuestos]);

  // ── Cobros por mes ────────────────────────────────────────────────────────

  const cobrosPorMes = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of misTrabajos) {
      if (t.fechaAdelanto) {
        const key = monthKey(t.fechaAdelanto);
        map.set(key, (map.get(key) ?? 0) + t.adelanto);
      }
    }
    const keys = [...map.keys()].sort();
    return keys.map((k) => ({ label: monthLabel(k), value: map.get(k) ?? 0 }));
  }, [misTrabajos]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analítica</h1>
          <p className="text-slate-500 text-sm mt-0.5">Rentabilidad y rendimiento del negocio</p>
        </div>
        {/* Filtro periodo */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          {(["3m", "6m", "12m", "all"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={[
                "px-4 py-2 text-sm font-medium transition-colors",
                periodo === p
                  ? "bg-[#1558d4] text-white"
                  : "text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {p === "all" ? "Todo" : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total facturado"
          value={`${fmt(totalFacturado)} €`}
          sub={`${misTrabajos.length} trabajos`}
          color="#1558d4"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <KpiCard
          label="Total cobrado"
          value={`${fmt(totalCobrado)} €`}
          sub="adelantos + pagados"
          color="#22c55e"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <KpiCard
          label="Pendiente cobro"
          value={`${fmt(totalPendiente)} €`}
          color={totalPendiente > 0 ? "#ef4444" : "#22c55e"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <KpiCard
          label="Conversión presupuestos"
          value={`${conversionRate}%`}
          sub={`${misPresupuestos.length} presupuestos`}
          color="#6366f1"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
      </div>

      {/* ── Ingresos por mes + Cobros ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Facturación por mes</h2>
          {ingresosPorMes.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin datos en este periodo</p>
          ) : (
            <BarChart data={ingresosPorMes} color="#1558d4" unit=" €" />
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Cobros por mes (adelantos)</h2>
          {cobrosPorMes.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin datos en este periodo</p>
          ) : (
            <BarChart data={cobrosPorMes} color="#22c55e" unit=" €" />
          )}
        </div>
      </div>

      {/* ── Top clientes ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Top clientes por facturación</h2>
        {topClientes.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Sin datos en este periodo</p>
        ) : (
          <div className="space-y-3">
            {topClientes.map((c, i) => {
              const pct = (c.total / topClientesMax) * 100;
              return (
                <div key={c.nombre} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate">{c.nombre}</span>
                      <span className="text-sm font-bold text-slate-900 ml-3 shrink-0">
                        {fmtDec(c.total)} €
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "#1558d4" }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">{c.count} trabajo{c.count !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Donuts ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Trabajos por estado</h2>
          <DonutChart segments={estadoSegments} />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Presupuestos por estado</h2>
          <DonutChart segments={presupSegments} />
        </div>
      </div>

      {/* ── Resumen cobros ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Resumen de cobros</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["sin_adelanto", "adelanto_recibido", "parcial", "pagado"] as const).map((estado) => {
            const labels = {
              sin_adelanto: "Sin adelanto",
              adelanto_recibido: "Con adelanto",
              parcial: "Parcial",
              pagado: "Pagado",
            };
            const colors = {
              sin_adelanto: "#94a3b8",
              adelanto_recibido: "#f59e0b",
              parcial: "#f97316",
              pagado: "#22c55e",
            };
            const count = misTrabajos.filter((t) => t.estadoCobro === estado).length;
            const importe = misTrabajos
              .filter((t) => t.estadoCobro === estado)
              .reduce((s, t) => s + t.precio, 0);
            return (
              <div
                key={estado}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
              >
                <div
                  className="w-2 h-2 rounded-full mx-auto mb-2"
                  style={{ background: colors[estado] }}
                />
                <p className="text-[11px] text-slate-500 font-medium">{labels[estado]}</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{count}</p>
                <p className="text-[11px] text-slate-400">{fmt(importe)} €</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
