"use client";

import { useState, useEffect } from "react";
import type { Trabajo, Cliente, WorkStatus, PaymentStatus, MetodoPago } from "@/lib/types";
import { getTrabajos, getClientes, createTrabajo, updateTrabajo as dbUpdateTrabajo, deleteTrabajo as dbDeleteTrabajo } from "@/lib/db";
import { waUrlEnCamino } from "@/lib/alertas";

const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "pendiente",       label: "Pendiente" },
  { value: "aprobado",        label: "Aprobado" },
  { value: "en_fabricacion",  label: "En fabricación" },
  { value: "en_instalacion",  label: "En instalación" },
  { value: "terminado",       label: "Terminado" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "sin_adelanto",      label: "Sin adelanto" },
  { value: "adelanto_recibido", label: "Adelanto recibido" },
  { value: "parcial",           label: "Parcial" },
  { value: "pagado",            label: "Pagado" },
];

const METODO_OPTIONS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta",       label: "Tarjeta" },
  { value: "bizum",         label: "Bizum" },
  { value: "cheque",        label: "Cheque" },
  { value: "otro",          label: "Otro" },
];

const STATUS_COLOR: Record<WorkStatus, string> = {
  pendiente:       "bg-amber-50 text-amber-700",
  aprobado:        "bg-sky-50 text-sky-700",
  en_fabricacion:  "bg-indigo-50 text-indigo-700",
  en_instalacion:  "bg-purple-50 text-purple-700",
  terminado:       "bg-green-50 text-green-700",
};

const COBRO_COLOR: Record<PaymentStatus, string> = {
  sin_adelanto:      "bg-slate-100 text-slate-500",
  adelanto_recibido: "bg-amber-50 text-amber-700",
  parcial:           "bg-orange-50 text-orange-700",
  pagado:            "bg-green-50 text-green-700",
};

const EMPTY: Omit<Trabajo, "id" | "creadoEn"> = {
  usuarioId: "",
  clienteId: "",
  descripcion: "",
  medidas: "",
  precio: 0,
  adelanto: 0,
  fechaAdelanto: "",
  metodoPagoAdelanto: "",
  fecha: new Date().toISOString().slice(0, 10),
  notas: "",
  estado: "pendiente",
  estadoCobro: "sin_adelanto",
  horaInicio: "",
  horaFin: "",
  notasInstalacion: "",
};

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Botón "En camino" con geolocalización opcional ────────────────────────────

interface BtnEnCaminoProps {
  telefono: string;
  nombreCliente: string;
  descripcion: string;
  onMarkEnInstalacion: () => void;
}

function BtnEnCamino({ telefono, nombreCliente, descripcion, onMarkEnInstalacion }: BtnEnCaminoProps) {
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
        // Permiso denegado: envía sin ubicación igualmente
        window.open(waUrlEnCamino(telefono, nombreCliente, descripcion), "_blank");
        onMarkEnInstalacion();
        setEstado("done");
      },
      { timeout: 6000, maximumAge: 30000 }
    );
  }

  if (estado === "done") {
    return (
      <span className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg">
        ✓ Avisado
      </span>
    );
  }

  if (estado === "loading") {
    return (
      <span className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg flex items-center gap-1.5">
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
        </svg>
        Localizando…
      </span>
    );
  }

  if (estado === "menu") {
    return (
      <div className="flex flex-col gap-1.5 items-end">
        <button
          onClick={() => enviar(true)}
          className="px-3 py-2 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          📍 Con mi ubicación
        </button>
        <button
          onClick={() => enviar(false)}
          className="px-3 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          💬 Solo mensaje
        </button>
        <button
          onClick={() => setEstado("idle")}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEstado("menu")}
      className="px-3 py-2 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
    >
      🚗 En camino
    </button>
  );
}

interface FormProps {
  initial?: Trabajo;
  clientes: Cliente[];
  onSave: (data: Omit<Trabajo, "id" | "creadoEn">) => void;
  onCancel: () => void;
}

function TrabajoForm({ initial, clientes, onSave, onCancel }: FormProps) {
  const [form, setForm] = useState<Omit<Trabajo, "id" | "creadoEn">>(
    initial
      ? {
          usuarioId:          initial.usuarioId,
          clienteId:          initial.clienteId,
          descripcion:        initial.descripcion,
          medidas:            initial.medidas,
          precio:             initial.precio,
          adelanto:           initial.adelanto,
          fechaAdelanto:      initial.fechaAdelanto,
          metodoPagoAdelanto: initial.metodoPagoAdelanto,
          fecha:              initial.fecha,
          notas:              initial.notas,
          estado:             initial.estado,
          estadoCobro:        initial.estadoCobro,
          horaInicio:        initial.horaInicio ?? "",
          horaFin:           initial.horaFin ?? "",
          notasInstalacion:   initial.notasInstalacion ?? "",
        }
      : EMPTY
  );

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const pendiente = Math.max(0, form.precio - form.adelanto);
  const tieneAdelanto = form.estadoCobro !== "sin_adelanto";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descripcion.trim()) return;
    onSave(form);
  }

  const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Cliente</label>
        <select value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)} className={inputCls}>
          <option value="">— Sin cliente —</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Descripción *</label>
        <input
          required
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          className={inputCls}
          placeholder="Ej. Ventana corredera aluminio"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Medidas</label>
          <input value={form.medidas} onChange={(e) => set("medidas", e.target.value)} className={inputCls} placeholder="150×120 cm" />
        </div>
        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Hora de inicio</label>
          <input
            type="time"
            value={form.horaInicio ?? ""}
            onChange={(e) => set("horaInicio", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Hora de fin</label>
          <input
            type="time"
            value={form.horaFin ?? ""}
            onChange={(e) => set("horaFin", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={labelCls}>Estado del trabajo</label>
          <select value={form.estado} onChange={(e) => set("estado", e.target.value as WorkStatus)} className={inputCls}>
            {WORK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Cobros block */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Control de cobro</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Importe total (€)</label>
            <input
              type="number" min={0} step={0.01}
              value={form.precio}
              onChange={(e) => set("precio", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Adelanto recibido (€)</label>
            <input
              type="number" min={0} step={0.01}
              value={form.adelanto}
              onChange={(e) => set("adelanto", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
          <span className="text-sm text-slate-500">Importe pendiente</span>
          <span className={`text-base font-bold ${pendiente > 0 ? "text-red-500" : "text-green-600"}`}>
            {fmt(pendiente)} €
          </span>
        </div>
        <div>
          <label className={labelCls}>Estado de cobro</label>
          <select value={form.estadoCobro} onChange={(e) => set("estadoCobro", e.target.value as PaymentStatus)} className={inputCls}>
            {PAYMENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {tieneAdelanto && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha del adelanto</label>
              <input type="date" value={form.fechaAdelanto} onChange={(e) => set("fechaAdelanto", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Método de pago</label>
              <select value={form.metodoPagoAdelanto} onChange={(e) => set("metodoPagoAdelanto", e.target.value as MetodoPago | "")} className={inputCls}>
                <option value="">— Seleccionar —</option>
                {METODO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Notas generales</label>
        <textarea
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          rows={2}
          className={`${inputCls} resize-none`}
          placeholder="Observaciones generales…"
        />
      </div>
      <div>
        <label className={labelCls}>Notas de instalación</label>
        <textarea
          value={form.notasInstalacion ?? ""}
          onChange={(e) => set("notasInstalacion", e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Materiales a llevar, acceso al edificio, contacto del portero…"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold py-3 rounded-xl transition-colors text-base">
          {initial ? "Guardar cambios" : "Crear trabajo"}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-base">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function TrabajosPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Trabajo | null>(null);

  useEffect(() => {
    Promise.all([getTrabajos(), getClientes()]).then(([ts, cs]) => {
      setTrabajos(ts);
      setClientes(cs);
    });
  }, []);

  function nombreCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  function telefonoCliente(id: string) {
    return clientes.find((c) => c.id === id)?.telefono ?? "";
  }

  async function handleSave(data: Omit<Trabajo, "id" | "creadoEn">) {
    if (mode === "edit" && editing) {
      // Si el estado cambia a "terminado", usar el endpoint que envía la reseña
      if (data.estado === "terminado" && editing.estado !== "terminado") {
        await fetch(`/api/trabajos/${editing.id}/estado`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "terminado" }),
        });
        const sinEstado = { ...data } as Partial<typeof data>;
        delete sinEstado.estado;
        if (Object.keys(sinEstado).length > 0) await dbUpdateTrabajo(editing.id, sinEstado);
      } else {
        await dbUpdateTrabajo(editing.id, data);
      }
      setTrabajos((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...data } : t)));
    } else {
      const nuevo = await createTrabajo(data);
      setTrabajos((prev) => [nuevo, ...prev]);
    }
    setMode("list");
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (confirm("\u00bfEliminar este trabajo?")) {
      await dbDeleteTrabajo(id);
      setTrabajos((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const sorted = [...trabajos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trabajos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{trabajos.length} trabajos registrados</p>
        </div>
        <button
          onClick={() => setMode("create")}
          className="bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          + Nuevo trabajo
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-400">
          No hay trabajos. Crea el primero.
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((t) => {
            const pendiente = Math.max(0, t.precio - t.adelanto);
            const cliente = nombreCliente(t.clienteId);
            const estadoLabel = PAYMENT_STATUS_OPTIONS.find((o) => o.value === t.estadoCobro)?.label ?? t.estadoCobro;
            return (
              <li key={t.id} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm">
                {/* Header: descripción + badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{t.descripcion}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {cliente} · {t.fecha}{t.medidas ? ` · ${t.medidas}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${STATUS_COLOR[t.estado]}`}>
                      {WORK_STATUS_OPTIONS.find((o) => o.value === t.estado)?.label}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${COBRO_COLOR[t.estadoCobro]}`}>
                      {estadoLabel}
                    </span>
                  </div>
                </div>
                {/* Importes */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{t.precio > 0 ? `${fmt(t.precio)} €` : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Adelanto</p>
                    <p className="text-sm font-bold text-amber-600 mt-0.5">{t.adelanto > 0 ? `${fmt(t.adelanto)} €` : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Pendiente</p>
                    <p className={`text-sm font-bold mt-0.5 ${pendiente > 0 ? "text-red-500" : "text-green-600"}`}>
                      {t.precio > 0 ? `${fmt(pendiente)} €` : "—"}
                    </p>
                  </div>
                </div>
                {/* Método + acciones */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400 capitalize">
                    {t.adelanto > 0 && t.metodoPagoAdelanto
                      ? `${t.metodoPagoAdelanto}${t.fechaAdelanto ? ` · ${t.fechaAdelanto}` : ""}`
                      : ""}
                  </p>
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    {telefonoCliente(t.clienteId) && t.estado !== "terminado" && (
                      <BtnEnCamino
                        telefono={telefonoCliente(t.clienteId)}
                        nombreCliente={nombreCliente(t.clienteId)}
                        descripcion={t.descripcion}
                        onMarkEnInstalacion={async () => {
                          await dbUpdateTrabajo(t.id, { estado: "en_instalacion" });
                          setTrabajos((prev) =>
                            prev.map((tr) => tr.id === t.id ? { ...tr, estado: "en_instalacion" } : tr)
                          );
                        }}
                      />
                    )}
                    <button
                      onClick={() => { setEditing(t); setMode("edit"); }}
                      className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-3 py-2 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(mode === "create" || mode === "edit") && (
        <Modal
          title={mode === "edit" ? "Editar trabajo" : "Nuevo trabajo"}
          onClose={() => { setMode("list"); setEditing(null); }}
        >
          <TrabajoForm
            initial={editing ?? undefined}
            clientes={clientes}
            onSave={handleSave}
            onCancel={() => { setMode("list"); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

