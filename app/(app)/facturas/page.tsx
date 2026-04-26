"use client";

import { useState, useEffect, useMemo } from "react";
import type { Factura, Cliente, Presupuesto, ConfiguracionEmpresa, InvoiceStatus } from "@/lib/types";
import {
  getFacturas,
  getClientes,
  getPresupuestos,
  createFactura,
  updateFactura,
  deleteFactura,
  getConfigEmpresa,
} from "@/lib/db";
import { generarPdfFactura } from "@/lib/factura-pdf";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Colores de estado ─────────────────────────────────────────────────────────

const ESTADO_COLOR: Record<InvoiceStatus, string> = {
  borrador:  "bg-slate-100 text-slate-600",
  emitida:   "bg-blue-50 text-blue-700",
  pagada:    "bg-green-50 text-green-700",
  vencida:   "bg-red-50 text-red-700",
  anulada:   "bg-slate-100 text-slate-400 line-through",
};

const ESTADO_LABEL: Record<InvoiceStatus, string> = {
  borrador: "Borrador",
  emitida:  "Emitida",
  pagada:   "Pagada",
  vencida:  "Vencida",
  anulada:  "Anulada",
};

type FiltroEstado = "todas" | InvoiceStatus;

// ── Componente principal ───────────────────────────────────────────────────────

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [config, setConfig] = useState<ConfiguracionEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroEstado>("todas");
  const [busqueda, setBusqueda] = useState("");

  // Modal nueva factura
  const [modalNueva, setModalNueva] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string>("");
  const [creando, setCreando] = useState(false);

  // Modal confirmar borrar
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Descargando PDF
  const [descargando, setDescargando] = useState<string | null>(null);
  // Enviando WhatsApp
  const [enviando, setEnviando] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFacturas(), getClientes(), getPresupuestos(), getConfigEmpresa()])
      .then(([f, c, p, cfg]) => {
        setFacturas(f);
        setClientes(c);
        setPresupuestos(p);
        setConfig(cfg);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Presupuestos aceptados sin factura ya emitida
  const presupuestosFacturables = useMemo(() => {
    const yaFacturados = new Set(facturas.map((f) => f.presupuestoId).filter(Boolean));
    return presupuestos.filter(
      (p) => p.estadoFirma === "aceptado" && !yaFacturados.has(p.id)
    );
  }, [presupuestos, facturas]);

  function clienteNombre(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const activas = facturas.filter((f) => f.estado !== "anulada");
    const totalEmitido = activas.reduce((s, f) => s + f.total, 0);
    const cobrado = activas.filter((f) => f.estado === "pagada").reduce((s, f) => s + f.total, 0);
    const pendiente = activas.filter((f) => ["emitida", "vencida"].includes(f.estado)).reduce((s, f) => s + f.total, 0);
    return { totalEmitido, cobrado, pendiente };
  }, [facturas]);

  // ── Filtrado ──────────────────────────────────────────────────────────────

  const filtradas = useMemo(() => {
    let result = facturas;
    if (filtro !== "todas") result = result.filter((f) => f.estado === filtro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        (f) =>
          f.numero.toLowerCase().includes(q) ||
          clienteNombre(f.clienteId).toLowerCase().includes(q)
      );
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facturas, filtro, busqueda, clientes]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function handleCrearFactura() {
    if (!presupuestoSeleccionado) return;
    setCreando(true);
    try {
      const pres = presupuestos.find((p) => p.id === presupuestoSeleccionado);
      if (!pres) return;
      const diasVenc = config?.diasVencimientoFactura ?? 15;
      const fechaHoy = today();
      const nueva = await createFactura({
        presupuestoId: pres.id,
        trabajoId: "",
        clienteId: pres.clienteId,
        lineas: pres.lineas,
        subtotal: pres.subtotalConDescuento,
        descuento: 0,
        iva: pres.ivaGlobal,
        total: pres.importeTotal,
        estado: "emitida",
        fechaEmision: fechaHoy,
        fechaVencimiento: addDays(fechaHoy, diasVenc),
      });
      setFacturas((prev) => [nueva, ...prev]);
      setModalNueva(false);
      setPresupuestoSeleccionado("");
    } catch (e) {
      console.error(e);
      alert("Error al crear la factura");
    } finally {
      setCreando(false);
    }
  }

  async function handleEstado(id: string, estado: InvoiceStatus) {
    const updates: Partial<Factura> = { estado };
    if (estado === "pagada") updates.fechaPago = today();
    const updated = await updateFactura(id, updates);
    setFacturas((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }

  async function handleDelete(id: string) {
    await deleteFactura(id);
    setFacturas((prev) => prev.filter((f) => f.id !== id));
    setConfirmDelete(null);
  }

  async function handleDescargarPdf(factura: Factura) {
    setDescargando(factura.id);
    try {
      const cliente = clientes.find((c) => c.id === factura.clienteId);
      if (!cliente) return;
      const blob = await generarPdfFactura(factura, cliente, config);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${factura.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error al generar el PDF");
    } finally {
      setDescargando(null);
    }
  }

  async function handleEnviarWhatsApp(facturaId: string) {
    setEnviando(facturaId);
    try {
      const res = await fetch(`/api/facturas/${facturaId}/enviar`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFacturas((prev) =>
        prev.map((f) => (f.id === facturaId && f.estado === "borrador" ? { ...f, estado: "emitida" as InvoiceStatus } : f))
      );
      alert("Factura enviada por WhatsApp");
    } catch (e: unknown) {
      alert((e as Error).message || "Error al enviar");
    } finally {
      setEnviando(null);
    }
  }

  function handleExportarCSV() {
    const rows = [
      ["Número", "Cliente", "Fecha emisión", "Vencimiento", "Estado", "Total"].join(";"),
      ...filtradas.map((f) =>
        [
          f.numero,
          clienteNombre(f.clienteId),
          f.fechaEmision,
          f.fechaVencimiento ?? "",
          ESTADO_LABEL[f.estado],
          fmt(f.total),
        ].join(";")
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facturas-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#1558d4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const FILTROS: { value: FiltroEstado; label: string }[] = [
    { value: "todas",   label: "Todas" },
    { value: "emitida", label: "Emitidas" },
    { value: "pagada",  label: "Pagadas" },
    { value: "vencida", label: "Vencidas" },
    { value: "borrador",label: "Borradores" },
    { value: "anulada", label: "Anuladas" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {facturas.length} {facturas.length === 1 ? "factura" : "facturas"} en total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportarCSV}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => setModalNueva(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors"
            style={{ background: "#1558d4" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Factura
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total emitido", value: stats.totalEmitido, color: "#1558d4" },
          { label: "Pendiente de cobro", value: stats.pendiente, color: "#f59e0b" },
          { label: "Cobrado", value: stats.cobrado, color: "#16a34a" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold mt-1" style={{ color }}>{fmt(value)} €</p>
          </div>
        ))}
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por número o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1558d4] bg-white"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                filtro === f.value
                  ? "text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              style={filtro === f.value ? { background: "#1558d4" } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="font-medium">No hay facturas</p>
          {filtro === "todas" && <p className="text-sm mt-1">Crea la primera desde un presupuesto aceptado.</p>}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((f) => {
            const nombre = clienteNombre(f.clienteId);
            return (
              <li key={f.id} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-base">{f.numero}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_COLOR[f.estado]}`}>
                        {ESTADO_LABEL[f.estado]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Emitida {f.fechaEmision}
                      {f.fechaVencimiento && ` · Vence ${f.fechaVencimiento}`}
                      {f.fechaPago && ` · Pagada ${f.fechaPago}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-slate-800">{fmt(f.total)} €</p>
                    <p className="text-xs text-slate-400">IVA {f.iva}%</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {/* Cambiar estado */}
                  {f.estado === "emitida" && (
                    <button
                      onClick={() => handleEstado(f.id, "pagada")}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Marcar pagada
                    </button>
                  )}
                  {f.estado === "vencida" && (
                    <button
                      onClick={() => handleEstado(f.id, "pagada")}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Cobrada
                    </button>
                  )}
                  {f.estado === "borrador" && (
                    <button
                      onClick={() => handleEstado(f.id, "emitida")}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      Emitir
                    </button>
                  )}
                  {!["pagada", "anulada"].includes(f.estado) && (
                    <button
                      onClick={() => handleEstado(f.id, "anulada")}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Anular
                    </button>
                  )}

                  {/* WhatsApp */}
                  {["emitida", "vencida", "borrador"].includes(f.estado) && (
                    <button
                      onClick={() => handleEnviarWhatsApp(f.id)}
                      disabled={enviando === f.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-60"
                    >
                      {enviando === f.id ? (
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 00-9-9"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      )}
                      WhatsApp
                    </button>
                  )}

                  {/* PDF */}
                  <button
                    onClick={() => handleDescargarPdf(f)}
                    disabled={descargando === f.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1558d4] bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-60"
                  >
                    {descargando === f.id ? (
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
                        <path d="M21 12a9 9 0 00-9-9"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    )}
                    PDF
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => setConfirmDelete(f.id)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Modal nueva factura ────────────────────────────────────────────── */}
      {modalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Nueva Factura</h2>
            <p className="text-sm text-slate-500 mb-5">
              Selecciona un presupuesto aceptado para generar la factura.
            </p>

            {presupuestosFacturables.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="font-medium text-sm">No hay presupuestos pendientes de facturar.</p>
                <p className="text-xs mt-1">Los presupuestos deben estar aceptados (firmados) por el cliente.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
                {presupuestosFacturables.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      presupuestoSeleccionado === p.id
                        ? "border-[#1558d4] bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="presupuesto"
                      value={p.id}
                      checked={presupuestoSeleccionado === p.id}
                      onChange={() => setPresupuestoSeleccionado(p.id)}
                      className="mt-0.5 accent-[#1558d4]"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">{p.titulo}</p>
                      <p className="text-xs text-slate-500">{clienteNombre(p.clienteId)} · {p.fecha}</p>
                      <p className="text-xs font-bold text-[#1558d4] mt-0.5">{fmt(p.importeTotal)} €</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setModalNueva(false); setPresupuestoSeleccionado(""); }}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearFactura}
                disabled={!presupuestoSeleccionado || creando}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
                style={{ background: "#1558d4" }}
              >
                {creando ? "Creando..." : "Crear Factura"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar borrar ─────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">¿Eliminar factura?</h2>
            <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
