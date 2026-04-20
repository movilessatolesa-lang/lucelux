"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Presupuesto } from "@/lib/types";

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador", enviado: "Pendiente firma", aceptado: "Aceptado", rechazado: "Rechazado",
};
const ESTADO_COLOR: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-600 border-gray-200",
  enviado: "bg-amber-50 text-amber-700 border-amber-200",
  aceptado: "bg-green-50 text-green-700 border-green-200",
  rechazado: "bg-red-50 text-red-700 border-red-200",
};
const FIRMA_LABEL: Record<string, string> = {
  pendiente: "Firma pendiente", aceptado: "Firmado", rechazado: "Rechazado",
};
const FIRMA_DOT: Record<string, string> = {
  pendiente: "bg-amber-400", aceptado: "bg-green-500", rechazado: "bg-red-500",
};

export default function DashboardCliente() {
  const [nombre, setNombre] = useState("");
  const [presupuestosCliente, setPresupuestosCliente] = useState<Presupuesto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/cliente/login"; return; }

      setNombre(user.user_metadata?.nombre || user.email?.split("@")[0] || "");

      const { data: clienteRow } = await supabase
        .from("clientes").select("id, nombre").eq("email", user.email).single();

      if (!clienteRow) { setCargando(false); return; }

      setNombre(clienteRow.nombre || nombre);

      const { data: rows } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("cliente_id", clienteRow.id)
        .order("fecha", { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPresupuestosCliente((rows ?? []).map((r: any) => ({
        id: r.id, usuarioId: r.usuario_id, clienteId: r.cliente_id,
        titulo: r.titulo, descripcion: r.descripcion ?? "",
        lineas: r.lineas ?? [], fecha: r.fecha,
        fechaVencimiento: r.fecha_vencimiento ?? "",
        estado: r.estado, subtotalLineas: Number(r.subtotal_lineas ?? 0),
        descuentoGlobal: Number(r.descuento_global ?? 0),
        subtotalConDescuento: Number(r.subtotal_con_descuento ?? 0),
        ivaGlobal: Number(r.iva_global ?? 21), totalIva: Number(r.total_iva ?? 0),
        importeTotal: Number(r.importe_total ?? 0),
        urlFirma: r.url_firma ?? undefined, estadoFirma: r.estado_firma ?? "pendiente",
        fechaFirma: r.fecha_firma ?? undefined,
        porcentajeAdelanto: Number(r.porcentaje_adelanto ?? 0),
        seguimiento: r.seguimiento ?? [], notas: r.notas ?? "",
        creadoEn: r.creado_en,
      })));
      setCargando(false);
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendientesFirma = presupuestosCliente.filter((p) => p.estadoFirma === "pendiente" && p.estado === "enviado").length;
  const aceptados = presupuestosCliente.filter((p) => p.estadoFirma === "aceptado").length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--ll-bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hola, {nombre.split(" ")[0] || "cliente"} 👋</h1>
          <p className="text-gray-500 mt-1">Aquí tienes el resumen de tus presupuestos y trabajos.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{presupuestosCliente.length}</div>
            <div className="text-xs text-gray-500 mt-1">Presupuestos</div>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{pendientesFirma}</div>
            <div className="text-xs text-gray-500 mt-1">Pendientes firma</div>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{aceptados}</div>
            <div className="text-xs text-gray-500 mt-1">Aceptados</div>
          </div>
        </div>

        <h2 className="text-base font-semibold text-gray-700 mb-3">Tus presupuestos</h2>
        {presupuestosCliente.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="text-4xl mb-3">📄</div>
            <div className="text-gray-500">No tienes presupuestos asignados todavía.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {presupuestosCliente.map((p) => (
              <Link key={p.id} href={`/cliente/presupuestos/${p.urlFirma ?? p.id}`}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ESTADO_COLOR[p.estado] || "bg-gray-100 text-gray-600"}`}>
                          {ESTADO_LABEL[p.estado] || p.estado}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <span className={`w-2 h-2 rounded-full ${FIRMA_DOT[p.estadoFirma] || "bg-gray-300"}`}></span>
                          {FIRMA_LABEL[p.estadoFirma] || p.estadoFirma}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{p.titulo}</h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.descripcion}</p>
                      {p.fechaVencimiento && (
                        <div className="text-xs text-gray-400 mt-1">Vence: {new Date(p.fechaVencimiento).toLocaleDateString("es-ES")}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-gray-900">{p.importeTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</div>
                      {p.estadoFirma === "pendiente" && p.estado === "enviado" && (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1 inline-block">Requiere acción</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                      Ver detalle
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6"/></svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
