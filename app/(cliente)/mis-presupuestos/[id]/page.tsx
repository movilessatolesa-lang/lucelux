"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PresupuestoVistaCliente } from "@/components/presupuestos/PresupuestoVistaCliente";
import { SeguimientoObra } from "@/components/presupuestos/SeguimientoObra";
import { Modal } from "@/components/Modal";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";
import type { Presupuesto, Cliente } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPresupuesto(row: any): Presupuesto {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    clienteId: row.cliente_id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? "",
    lineas: row.lineas ?? [],
    fecha: row.fecha,
    fechaVencimiento: row.fecha_vencimiento ?? "",
    estado: row.estado,
    subtotalLineas: Number(row.subtotal_lineas ?? 0),
    descuentoGlobal: Number(row.descuento_global ?? 0),
    subtotalConDescuento: Number(row.subtotal_con_descuento ?? 0),
    ivaGlobal: Number(row.iva_global ?? 21),
    totalIva: Number(row.total_iva ?? 0),
    importeTotal: Number(row.importe_total ?? 0),
    urlFirma: row.url_firma ?? undefined,
    estadoFirma: row.estado_firma ?? "pendiente",
    fechaFirma: row.fecha_firma ?? undefined,
    porcentajeAdelanto: Number(row.porcentaje_adelanto ?? 0),
    seguimiento: row.seguimiento ?? [],
    notas: row.notas ?? "",
    creadoEn: row.creado_en,
    modificadoEn: row.modificado_en ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCliente(row: any): Cliente {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombre: row.nombre,
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    direccion: row.direccion ?? "",
    ciudad: row.ciudad ?? "",
    codigoPostal: row.codigo_postal ?? "",
    tipo: row.tipo ?? "particular",
    dniNif: row.dni_nif ?? "",
    notas: row.notas ?? "",
    tags: row.tags ?? [],
    recurrente: row.recurrente ?? false,
    problematico: row.problematico ?? false,
    creadoEn: row.creado_en,
  };
}

export default function ClientePresupuestoDetallePage() {
  const params = useParams();
  const token = params.id as string; // url_firma token

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [motivos, setMotivos] = useState("");
  const [metodoSeleccionado, setMetodoSeleccionado] = useState("tarjeta");

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("url_firma", token)
        .single();

      if (error || !data) { setCargando(false); return; }

      const p = mapPresupuesto(data);
      setPresupuesto(p);

      const { data: clienteData } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", p.clienteId)
        .single();

      if (clienteData) setCliente(mapCliente(clienteData));
      setCargando(false);
    }
    cargar();
  }, [token]);

  const handleConfirmarAceptacion = async () => {
    if (!presupuesto) return;
    setGuardando(true);
    const supabase = createClient();
    const ahora = new Date().toISOString();
    const { error } = await supabase
      .from("presupuestos")
      .update({ estado_firma: "aceptado", fecha_firma: ahora, estado: "aceptado" })
      .eq("url_firma", token);
    if (!error) setPresupuesto({ ...presupuesto, estado: "aceptado", estadoFirma: "aceptado", fechaFirma: ahora });
    setGuardando(false);
    setShowFirmaModal(false);
  };

  const handleConfirmarRechazo = async () => {
    if (!presupuesto) return;
    setGuardando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("presupuestos")
      .update({ estado_firma: "rechazado", estado: "rechazado", notas: motivos })
      .eq("url_firma", token);
    if (!error) setPresupuesto({ ...presupuesto, estado: "rechazado", estadoFirma: "rechazado", notas: motivos });
    setGuardando(false);
    setShowRechazoModal(false);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!presupuesto || !cliente) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-slate-500">Presupuesto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">{presupuesto.titulo}</h1>
        <p className="text-slate-600">Cliente: {cliente.nombre}</p>
        <p className="text-2xl font-bold text-blue-600 mt-2">
          {formatearMoneda(presupuesto.importeTotal)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PresupuestoVistaCliente
            presupuesto={presupuesto}
            cliente={cliente}
            pagos={[]}
            onAceptar={() => setShowFirmaModal(true)}
            onRechazar={() => setShowRechazoModal(true)}
            onPagar={() => setShowPagoModal(true)}
            onDescargarPDF={() => {}}
          />

          {presupuesto.estadoFirma === "aceptado" && (
            <SeguimientoObra seguimiento={presupuesto.seguimiento} />
          )}

          {presupuesto.lineas.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Materiales y servicios</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-slate-600">Descripción</th>
                      <th className="text-center py-2 text-slate-600">Cantidad</th>
                      <th className="text-right py-2 text-slate-600">Unitario</th>
                      <th className="text-right py-2 text-slate-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {presupuesto.lineas.map((linea: any, i: number) => (
                      <tr key={linea.id ?? i} className="border-b border-slate-100">
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{linea.nombre}</p>
                          {linea.medidas && <p className="text-xs text-slate-500">{linea.medidas}</p>}
                        </td>
                        <td className="text-center py-3 text-slate-600">{linea.cantidad} {linea.unidad}</td>
                        <td className="text-right py-3">{formatearMoneda(linea.costeUnitario)}</td>
                        <td className="text-right py-3 font-semibold">
                          {formatearMoneda(linea.cantidad * linea.costeUnitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Información</h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-500">Emitido</p>
                <p className="font-medium text-slate-900">{formatearFecha(presupuesto.fecha)}</p>
              </div>
              {presupuesto.fechaVencimiento && (
                <div>
                  <p className="text-slate-500">Vence</p>
                  <p className="font-medium text-slate-900">{formatearFecha(presupuesto.fechaVencimiento)}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Estado</p>
                <p className="font-medium text-slate-900 capitalize">{presupuesto.estado}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span>{formatearMoneda(presupuesto.subtotalLineas)}</span>
              </div>
              {presupuesto.descuentoGlobal > 0 && (
                <div className="flex justify-between text-green-300">
                  <span>Descuento</span>
                  <span>-{formatearMoneda(presupuesto.descuentoGlobal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">IVA ({presupuesto.ivaGlobal}%)</span>
                <span>{formatearMoneda(presupuesto.totalIva)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatearMoneda(presupuesto.importeTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Aceptar */}
      <Modal isOpen={showFirmaModal} onClose={() => setShowFirmaModal(false)}>
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Confirmar aceptación</h3>
          <p className="text-slate-600 mb-6">Al aceptar confirmas tu conformidad con las condiciones y el importe total.</p>
          {presupuesto.porcentajeAdelanto > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                Adelanto requerido ({presupuesto.porcentajeAdelanto}%):
                <span className="font-bold"> {formatearMoneda(presupuesto.importeTotal * (presupuesto.porcentajeAdelanto / 100))}</span>
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setShowFirmaModal(false)} className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors">Cancelar</button>
            <button onClick={handleConfirmarAceptacion} disabled={guardando} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors">
              {guardando ? "Guardando..." : "Aceptar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal isOpen={showRechazoModal} onClose={() => setShowRechazoModal(false)}>
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Rechazar presupuesto</h3>
          <textarea value={motivos} onChange={(e) => setMotivos(e.target.value)} placeholder="Motivo del rechazo..." className="w-full border border-slate-300 rounded-lg p-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" rows={4} />
          <div className="flex gap-3">
            <button onClick={() => setShowRechazoModal(false)} className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors">Cancelar</button>
            <button onClick={handleConfirmarRechazo} disabled={guardando} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors">
              {guardando ? "Guardando..." : "Rechazar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Pago */}
      <Modal isOpen={showPagoModal} onClose={() => setShowPagoModal(false)}>
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Método de pago</h3>
          <div className="space-y-3 mb-6">
            {["tarjeta", "transferencia", "bizum"].map((metodo) => (
              <label key={metodo} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="metodo" value={metodo} checked={metodoSeleccionado === metodo} onChange={(e) => setMetodoSeleccionado(e.target.value)} className="w-4 h-4" />
                <span className="capitalize font-medium text-slate-900">{metodo}</span>
              </label>
            ))}
          </div>
          <button onClick={() => setShowPagoModal(false)} className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors">Cerrar</button>
        </div>
      </Modal>
    </div>
  );
}

