"use client";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Presupuesto } from "@/lib/types";

const ESTADO_SEGUIMIENTO_LABEL: Record<string, string> = {
  aceptado: "Presupuesto aceptado",
  pendiente_material: "Gestion de materiales",
  material_disponible: "Materiales disponibles",
  en_fabricacion: "Fabricacion",
  fabricacion_lista: "Fabricacion completada",
  pendiente_cita: "Cita pendiente",
  cita_confirmada: "Cita confirmada",
  en_instalacion: "Instalacion en curso",
  finalizado: "Finalizado",
  entregado: "Entregado",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPresupuesto(r: any): Presupuesto {
  return {
    id: r.id, usuarioId: r.usuario_id, clienteId: r.cliente_id,
    titulo: r.titulo, descripcion: r.descripcion ?? "",
    lineas: r.lineas ?? [], fecha: r.fecha,
    fechaVencimiento: r.fecha_vencimiento ?? "", estado: r.estado,
    subtotalLineas: Number(r.subtotal_lineas ?? 0),
    descuentoGlobal: Number(r.descuento_global ?? 0),
    subtotalConDescuento: Number(r.subtotal_con_descuento ?? 0),
    ivaGlobal: Number(r.iva_global ?? 21), totalIva: Number(r.total_iva ?? 0),
    importeTotal: Number(r.importe_total ?? 0),
    urlFirma: r.url_firma ?? undefined, estadoFirma: r.estado_firma ?? "pendiente",
    fechaFirma: r.fecha_firma ?? undefined,
    porcentajeAdelanto: Number(r.porcentaje_adelanto ?? 0),
    seguimiento: r.seguimiento ?? [], notas: r.notas ?? "",
    creadoEn: r.creado_en,
  };
}

export default function PresupuestoClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [firmado, setFirmado] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [modalFirma, setModalFirma] = useState(false);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const { data } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("url_firma", id)
        .single();
      if (data) setPresupuesto(mapPresupuesto(data));
      setCargando(false);
    }
    cargar();
  }, [id]);

  async function handleFirmar() {
    if (!presupuesto || !aceptaTerminos) return;
    setGuardando(true);
    const supabase = createClient();
    const ahora = new Date().toISOString();
    await supabase.from("presupuestos")
      .update({ estado_firma: "aceptado", estado: "aceptado", fecha_firma: ahora })
      .eq("url_firma", id);
    setPresupuesto({ ...presupuesto, estadoFirma: "aceptado", estado: "aceptado", fechaFirma: ahora });
    setGuardando(false);
    setFirmado(true);
    setModalFirma(false);
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!presupuesto) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ll-bg)" }}>
        <div className="bg-white rounded-xl shadow p-10 text-center max-w-sm">
          <div className="text-5xl mb-4">404</div>
          <h2 className="font-bold text-gray-800 mb-2">Presupuesto no encontrado</h2>
          <Link href="/cliente/dashboard" className="text-blue-700 font-semibold text-sm">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const puedeAceptar = presupuesto.estadoFirma === "pendiente" && presupuesto.estado === "enviado";
  const hitosSeguimiento = presupuesto.seguimiento || [];
  const completados = hitosSeguimiento.filter((h) => h.completado).length;
  const progreso = hitosSeguimiento.length > 0 ? Math.round((completados / hitosSeguimiento.length) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--ll-bg)" }}>
      <header style={{ background: "var(--ll-navy)" }} className="px-6 py-4 flex items-center gap-4 shadow-lg">
        <Link href="/cliente/dashboard" className="text-blue-300 hover:text-white transition flex items-center gap-1 text-sm">
          Volver
        </Link>
        <span className="text-white font-extrabold text-xl tracking-tight">LUCELUX</span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900">{presupuesto.titulo}</h1>
          <p className="text-gray-500 text-sm mt-1">{presupuesto.descripcion}</p>
          <div className="mt-3 text-3xl font-extrabold text-gray-900">
            {presupuesto.importeTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {firmado || presupuesto.estadoFirma === "aceptado" ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-2.5 rounded-lg text-sm font-semibold">
                Firmado {presupuesto.fechaFirma ? new Date(presupuesto.fechaFirma).toLocaleDateString("es-ES") : ""}
              </div>
            ) : puedeAceptar ? (
              <button onClick={() => setModalFirma(true)} className="bg-blue-700 hover:bg-blue-900 text-white font-semibold px-5 py-2.5 rounded-lg transition shadow">
                Firmar y aceptar
              </button>
            ) : null}
          </div>
        </div>

        {presupuesto.lineas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4">Detalle</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-gray-500 font-medium pb-2">Concepto</th>
                  <th className="text-right text-gray-500 font-medium pb-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {presupuesto.lineas.map((l: any, i: number) => (
                  <tr key={l.id ?? i}>
                    <td className="py-3 font-medium text-gray-800">{l.nombre}</td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {(l.cantidad * l.costeUnitario).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>{presupuesto.importeTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
            </div>
          </div>
        )}

        {hitosSeguimiento.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-gray-800">Seguimiento</h2>
              <span className="text-sm font-semibold text-blue-700">{progreso}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progreso}%` }} />
            </div>
            <ul className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {hitosSeguimiento.map((h: any, i: number) => (
                <li key={i} className={`flex items-center gap-3 p-3 rounded-lg ${h.completado ? "bg-green-50" : "bg-gray-50"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${h.completado ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}>
                    {h.completado ? "✓" : i + 1}
                  </span>
                  <span className={`text-sm ${h.completado ? "text-green-700 font-medium" : "text-gray-600"}`}>
                    {ESTADO_SEGUIMIENTO_LABEL[h.estado] || h.estado}
                  </span>
                  {h.fecha && <span className="ml-auto text-xs text-gray-400">{h.fecha}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {modalFirma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Confirmar firma</h3>
            <p className="text-gray-600 text-sm mb-4">Al aceptar confirmas tu conformidad con el presupuesto.</p>
            <label className="flex items-start gap-2 mb-5 cursor-pointer">
              <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span className="text-sm text-gray-600">Acepto las condiciones y el importe</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setModalFirma(false)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg">Cancelar</button>
              <button onClick={handleFirmar} disabled={!aceptaTerminos || guardando} className="flex-1 bg-blue-700 hover:bg-blue-900 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition">
                {guardando ? "..." : "Firmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
