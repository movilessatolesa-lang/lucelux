"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Trabajo, Cliente, WorkStatus } from "@/lib/types";
import { getTrabajos, getClientes, updateTrabajo as dbUpdateTrabajo } from "@/lib/db";
import { waUrlEnCamino } from "@/lib/alertas";

// ── Constantes ────────────────────────────────────────────────────────────────

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pendiente:       { label: "Pendiente",      color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  aprobado:        { label: "Aprobado",        color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  en_fabricacion:  { label: "En fabricación",  color: "#5b21b6", bg: "#ede9fe", dot: "#8b5cf6" },
  en_instalacion:  { label: "En instalación",  color: "#9a3412", bg: "#ffedd5", dot: "#f97316" },
  terminado:       { label: "Terminado",       color: "#166534", bg: "#dcfce7", dot: "#22c55e" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

// ── Icono calendario ──────────────────────────────────────────────────────────

function IconChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left"
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

// ── Botón "En camino" ─────────────────────────────────────────────────────────

function BtnEnCamino({
  telefono,
  nombreCliente,
  descripcion,
  onMarkEnInstalacion,
}: {
  telefono: string;
  nombreCliente: string;
  descripcion: string;
  onMarkEnInstalacion: () => void;
}) {
  const [estado, setEstado] = useState<"idle" | "menu" | "loading" | "done">("idle");

  function enviar(conUbicacion: boolean) {
    if (!conUbicacion) {
      window.open(waUrlEnCamino(telefono, nombreCliente, descripcion), "_blank");
      onMarkEnInstalacion();
      setEstado("done");
      return;
    }
    setEstado("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.open(
          waUrlEnCamino(telefono, nombreCliente, descripcion, undefined, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
          "_blank"
        );
        onMarkEnInstalacion();
        setEstado("done");
      },
      () => {
        window.open(waUrlEnCamino(telefono, nombreCliente, descripcion), "_blank");
        onMarkEnInstalacion();
        setEstado("done");
      },
      { timeout: 6000, maximumAge: 30000 }
    );
  }

  if (estado === "done") {
    return (
      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-lg">
        ✓ Avisado
      </span>
    );
  }

  if (estado === "loading") {
    return (
      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
        Localizando…
      </span>
    );
  }

  if (estado === "menu") {
    return (
      <div className="flex flex-col gap-1.5 items-end">
        <button
          onClick={() => enviar(true)}
          className="text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          📍 Con mi ubicación
        </button>
        <button
          onClick={() => enviar(false)}
          className="text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          💬 Solo mensaje
        </button>
        <button
          onClick={() => setEstado("idle")}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEstado("menu")}
      className="text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
    >
      🚗 En camino
    </button>
  );
}
// ── Dropdown de estado inline (tarjetas) ─────────────────────────────────────

function EstadoDropdown({
  value,
  onChange,
}: {
  value: WorkStatus;
  onChange: (v: WorkStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = ESTADO_CFG[value] ?? ESTADO_CFG.pendiente;

  // Cerrar al pulsar fuera
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-estado-drop]")) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative shrink-0" data-estado-drop>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border transition-colors hover:opacity-80"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.dot }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
        {cfg.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
          {Object.entries(ESTADO_CFG).map(([key, c]) => (
            <button
              key={key}
              onClick={(e) => {
                e.stopPropagation();
                onChange(key as WorkStatus);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
              <span className="text-xs font-medium" style={{ color: value === key ? c.color : "#475569" }}>
                {c.label}
              </span>
              {value === key && (
                <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke={c.dot} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// ── Drawer lateral de detalle/edición ───────────────────────────────────────

function TrabajoDrawer({
  trabajo,
  onClose,
  onSave,
  clientes,
}: {
  trabajo: Trabajo;
  onClose: () => void;
  onSave: (id: string, data: Partial<Trabajo>) => void;
  clientes: Cliente[];
}) {
  const [form, setForm] = useState({
    descripcion: trabajo.descripcion,
    medidas: trabajo.medidas,
    fecha: trabajo.fecha,
    horaInicio: trabajo.horaInicio ?? "",
    horaFin: trabajo.horaFin ?? "",
    estado: trabajo.estado,
    notas: trabajo.notas,
    notasInstalacion: trabajo.notasInstalacion ?? "",
    precio: trabajo.precio,
    adelanto: trabajo.adelanto,
  });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);

  const cliente = clientes.find((c) => c.id === trabajo.clienteId);

  // Cerrar con ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Bloquear scroll del body mientras el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    setGuardando(true);
    onSave(trabajo.id, form);
    setTimeout(() => {
      setGuardando(false);
      setGuardado(true);
      setTimeout(onClose, 600);
    }, 300);
  }

  const pendiente = Math.max(0, form.precio - form.adelanto);
  const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5";

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel deslizante */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full md:w-[420px] lg:w-[38%] bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideInRight 0.25s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0 bg-white">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-base truncate">Detalle del trabajo</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{cliente?.nombre ?? "—"}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Estado */}
          <div>
            <span className={lbl}>Estado</span>
            <div className="relative">
              {/* Botón desplegable con color del estado activo */}
              <div
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer select-none"
                style={{
                  background: ESTADO_CFG[form.estado]?.bg ?? "#f1f5f9",
                  borderColor: ESTADO_CFG[form.estado]?.dot ?? "#94a3b8",
                }}
                onClick={() => setEstadoOpen((v) => !v)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: ESTADO_CFG[form.estado]?.dot ?? "#94a3b8" }}
                />
                <span
                  className="text-sm font-semibold flex-1"
                  style={{ color: ESTADO_CFG[form.estado]?.color ?? "#334155" }}
                >
                  {ESTADO_CFG[form.estado]?.label ?? form.estado}
                </span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={ESTADO_CFG[form.estado]?.color ?? "#334155"}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform ${estadoOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Lista desplegable */}
              {estadoOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-10 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {Object.entries(ESTADO_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => { setField("estado", key as WorkStatus); setEstadoOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: cfg.dot }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: form.estado === key ? cfg.color : "#475569" }}
                      >
                        {cfg.label}
                      </span>
                      {form.estado === key && (
                        <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={cfg.dot} strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className={lbl}>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setField("descripcion", e.target.value)}
              rows={2}
              className={inp + " resize-none"}
            />
          </div>

          {/* Cliente (solo lectura) */}
          <div>
            <span className={lbl}>Cliente</span>
            <p className="text-sm text-slate-800 font-medium">{cliente?.nombre ?? "—"}</p>
            {cliente?.telefono && (
              <a href={`tel:${cliente.telefono}`}
                className="text-xs text-blue-600 hover:underline mt-0.5 block">
                {cliente.telefono}
              </a>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className={lbl}>Fecha de instalación</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setField("fecha", e.target.value)}
              className={inp}
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Hora inicio</label>
              <input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setField("horaInicio", e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Hora fin</label>
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => setField("horaFin", e.target.value)}
                className={inp}
              />
            </div>
          </div>

          {/* Medidas */}
          <div>
            <label className={lbl}>Medidas</label>
            <input
              type="text"
              value={form.medidas}
              onChange={(e) => setField("medidas", e.target.value)}
              className={inp + " font-mono"}
              placeholder="ej: 120×90"
            />
          </div>

          {/* Precio y adelanto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Precio (€)</label>
              <input
                type="number"
                min={0}
                value={form.precio}
                onChange={(e) => setField("precio", Number(e.target.value))}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Adelanto (€)</label>
              <input
                type="number"
                min={0}
                value={form.adelanto}
                onChange={(e) => setField("adelanto", Number(e.target.value))}
                className={inp}
              />
            </div>
          </div>
          {form.precio > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Pendiente de cobro</span>
              <span className="font-bold text-slate-800">€{pendiente.toFixed(2)}</span>
            </div>
          )}

          {/* Notas instalación */}
          <div>
            <label className={lbl}>Notas de instalación</label>
            <textarea
              value={form.notasInstalacion}
              onChange={(e) => setField("notasInstalacion", e.target.value)}
              rows={3}
              className={inp + " resize-none"}
              placeholder="Materiales a llevar, acceso al edificio…"
            />
          </div>

          {/* Notas generales */}
          <div>
            <label className={lbl}>Notas generales</label>
            <textarea
              value={form.notas}
              onChange={(e) => setField("notas", e.target.value)}
              rows={2}
              className={inp + " resize-none"}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-4 flex gap-3 shrink-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={guardando || guardado}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {guardado ? (
              <span className="flex items-center gap-1.5">✓ Guardado</span>
            ) : guardando ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>

      {/* Keyframe de animación */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    Promise.all([getTrabajos(), getClientes()]).then(([ts, cs]) => {
      setTrabajos(ts);
      setClientes(cs);
    });
  }, []);

  const handleUpdateTrabajo = useCallback(async (id: string, data: Partial<Trabajo>) => {
    // Si el estado cambia a "terminado", usar el endpoint que envía la reseña
    if (data.estado === "terminado") {
      const actual = trabajos.find((t) => t.id === id);
      if (actual?.estado !== "terminado") {
        await fetch(`/api/trabajos/${id}/estado`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "terminado" }),
        });
        const sinEstado = { ...data } as Partial<Trabajo>;
        delete sinEstado.estado;
        if (Object.keys(sinEstado).length > 0) await dbUpdateTrabajo(id, sinEstado);
        setTrabajos((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
        return;
      }
    }
    await dbUpdateTrabajo(id, data);
    setTrabajos((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, [trabajos]);

  const [drawerTrabajo, setDrawerTrabajo] = useState<Trabajo | null>(null);
  const closeDrawer = useCallback(() => setDrawerTrabajo(null), []);

  function telefonoCliente(id: string) {
    return clientes.find((c) => c.id === id)?.telefono ?? "";
  }

  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(toKey(today));

  // ── Trabajos del usuario (RLS ya filtra por usuario) ──────────────────
  const myTrabajos = useMemo(
    () => trabajos.filter((t) => t.fecha),
    [trabajos]
  );

  // Mapa fecha → trabajos
  const byDate = useMemo(() => {
    const map = new Map<string, Trabajo[]>();
    for (const t of myTrabajos) {
      const key = t.fecha.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [myTrabajos]);

  // ── Generación del grid del mes ───────────────────────────────────────────
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    let dow = first.getDay() - 1;   // lunes = 0
    if (dow < 0) dow = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    const result: { date: Date; current: boolean }[] = [];

    // Días del mes anterior
    for (let i = dow - 1; i >= 0; i--) {
      result.push({ date: new Date(year, month - 1, daysInPrev - i), current: false });
    }
    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ date: new Date(year, month, d), current: true });
    }
    // Rellenar hasta 42 celdas (6 filas)
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      result.push({ date: new Date(year, month + 1, d), current: false });
    }
    return result;
  }, [year, month]);

  // ── Navegación ────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedKey(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedKey(null);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedKey(toKey(today));
  };

  // ── Panel día seleccionado ────────────────────────────────────────────────
  const selectedTrabajos = selectedKey ? (byDate.get(selectedKey) ?? []) : [];
  const selectedDate = selectedKey ? new Date(selectedKey + "T12:00:00") : null;

  // ── Próximas instalaciones (30 días) ─────────────────────────────────────
  const upcoming = useMemo(() => {
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    return myTrabajos
      .filter((t) => {
        const d = new Date(t.fecha + "T12:00:00");
        return d >= today && d <= limit;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [myTrabajos, today]);

  const clienteName = (id: string) =>
    clientes.find((c) => c.id === id)?.nombre ?? "—";

  const daysUntil = (fechaStr: string) => {
    const d = new Date(fechaStr + "T12:00:00");
    return Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Calendario ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Cabecera */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-slate-900">
              {MESES[month]} {year}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-slate-600"
                aria-label="Mes anterior"
              >
                <IconChevron dir="left" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-slate-600"
                aria-label="Mes siguiente"
              >
                <IconChevron dir="right" />
              </button>
            </div>
          </div>

          {/* Encabezados días */}
          <div className="grid grid-cols-7 mb-px">
            {DIAS.map((d) => (
              <div key={d}
                className="text-center text-[11px] font-semibold text-slate-400 py-2 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
            {cells.map((cell, i) => {
              const key = toKey(cell.date);
              const dayWorks = byDate.get(key) ?? [];
              const isToday = isSameDay(cell.date, today);
              const isSelected = key === selectedKey;

              return (
                <div
                  key={i}
                  onClick={() => cell.current && setSelectedKey(key)}
                  className={[
                    "bg-white min-h-[78px] p-1.5 transition-colors select-none",
                    cell.current ? "cursor-pointer hover:bg-blue-50/60" : "opacity-30 cursor-default",
                    isSelected && cell.current ? "bg-blue-50 ring-2 ring-inset ring-blue-500" : "",
                  ].join(" ")}
                >
                  {/* Número del día */}
                  <div className="flex justify-center mb-1">
                    <span
                      className={[
                        "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-blue-600 text-white" : "text-slate-700",
                      ].join(" ")}
                    >
                      {cell.date.getDate()}
                    </span>
                  </div>

                  {/* Pills de trabajos */}
                  <div className="space-y-0.5">
                    {dayWorks
                      .slice()
                      .sort((a, b) => (a.horaInicio ?? "99:99").localeCompare(b.horaInicio ?? "99:99"))
                      .slice(0, 2)
                      .map((t) => {
                        const cfg = ESTADO_CFG[t.estado] ?? ESTADO_CFG.pendiente;
                        return (
                          <div
                            key={t.id}
                            className="text-[10px] px-1.5 py-0.5 rounded truncate leading-tight font-medium"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {t.horaInicio ? `${t.horaInicio} ` : ""}{clienteName(t.clienteId).split(" ")[0]}
                          </div>
                        );
                      })}
                    {dayWorks.length > 2 && (
                      <p className="text-[10px] text-slate-400 px-1">
                        +{dayWorks.length - 2} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Panel día seleccionado ───────────────────────────────────── */}
          {selectedKey && (
            <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">
                {selectedDate?.toLocaleDateString("es-ES", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </h3>

              {selectedTrabajos.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-slate-400">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-40">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-sm">Sin instalaciones este día</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedTrabajos
                    .slice()
                    .sort((a, b) => (a.horaInicio ?? "99:99").localeCompare(b.horaInicio ?? "99:99"))
                    .map((t) => {
                    const cfg = ESTADO_CFG[t.estado] ?? ESTADO_CFG.pendiente;
                    return (
                      <div key={t.id}
                        className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Horario */}
                          <div className="flex flex-col items-center shrink-0 min-w-[54px]">
                            <span className="text-[11px] font-bold text-slate-700">
                              {t.horaInicio || "--:--"}
                            </span>
                            {t.horaFin && (
                              <span className="text-[10px] text-slate-400">{t.horaFin}</span>
                            )}
                            <div className="w-2 h-2 rounded-full mt-1" style={{ background: cfg.dot }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {t.descripcion}
                              </p>
                              {/* Desplegable de estado inline */}
                              <EstadoDropdown
                                value={t.estado}
                                onChange={(nuevoEstado) => handleUpdateTrabajo(t.id, { estado: nuevoEstado })}
                              />
                            </div>
                            <p className="text-xs text-slate-500">{clienteName(t.clienteId)}</p>
                            {t.medidas && (
                              <p className="text-xs text-slate-400 font-mono">{t.medidas}</p>
                            )}
                            {t.notasInstalacion && (
                              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-2.5 py-2 leading-snug">
                                <span className="font-semibold">📋 Notas: </span>{t.notasInstalacion}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {telefonoCliente(t.clienteId) && t.estado !== "terminado" && (
                              <BtnEnCamino
                                telefono={telefonoCliente(t.clienteId)}
                                nombreCliente={clienteName(t.clienteId)}
                                descripcion={t.descripcion}
                                onMarkEnInstalacion={() =>
                                  handleUpdateTrabajo(t.id, { estado: "en_instalacion" })
                                }
                              />
                            )}
                            <button
                              onClick={() => setDrawerTrabajo(t)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Ver →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Panel lateral derecho ─────────────────────────────────────── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">

          {/* Próximas instalaciones */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 text-sm">Próximas (30 días)</h2>
              {upcoming.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold rounded-full px-2 py-0.5">
                  {upcoming.length}
                </span>
              )}
            </div>

            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400">
                No hay instalaciones en los próximos 30 días.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((t) => {
                  const cfg = ESTADO_CFG[t.estado] ?? ESTADO_CFG.pendiente;
                  const diff = daysUntil(t.fecha);
                  const diffLabel =
                    diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : `En ${diff} días`;
                  const fechaFmt = new Date(t.fecha + "T12:00:00").toLocaleDateString(
                    "es-ES", { weekday: "short", day: "numeric", month: "short" }
                  );

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        const d = new Date(t.fecha + "T12:00:00");
                        setYear(d.getFullYear());
                        setMonth(d.getMonth());
                        setSelectedKey(t.fecha.slice(0, 10));
                      }}
                      className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs font-semibold text-slate-900 truncate leading-snug flex-1">
                          {t.descripcion}
                        </p>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {clienteName(t.clienteId)}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-slate-400">
                          {fechaFmt}{t.horaInicio ? ` · ${t.horaInicio}${t.horaFin ? `–${t.horaFin}` : ""}` : ""}
                        </span>
                        <span
                          className={[
                            "text-[11px] font-semibold",
                            diff === 0 ? "text-red-600" : diff <= 3 ? "text-orange-500" : "text-slate-400",
                          ].join(" ")}
                        >
                          {diffLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Leyenda
            </h3>
            <div className="space-y-2">
              {Object.values(ESTADO_CFG).map((cfg) => (
                <div key={cfg.label} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cfg.dot }} />
                  <span className="text-xs text-slate-600">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acceso rápido */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Acceso rápido
            </h3>
            <Link
              href="/trabajos"
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
              Gestionar trabajos
            </Link>
          </div>

        </div>
      </div>

      {/* Drawer lateral */}
      {drawerTrabajo && (
        <TrabajoDrawer
          trabajo={drawerTrabajo}
          onClose={closeDrawer}
          onSave={(id, data) => handleUpdateTrabajo(id, data)}
          clientes={clientes}
        />
      )}
    </div>
  );
}
