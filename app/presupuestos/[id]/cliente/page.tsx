"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PresupuestoVistaCliente } from "@/components/presupuestos/PresupuestoVistaCliente";
import { SeguimientoObra } from "@/components/presupuestos/SeguimientoObra";
import { Modal } from "@/components/Modal";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";
import { generarPdfPresupuesto } from "@/lib/presupuesto-pdf";
import { BloquePagoCliente } from "@/components/presupuestos/BloquePagoCliente";
import type { Presupuesto, Cliente } from "@/lib/types";

// Mappers snake_case → camelCase (página pública, sin auth)
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

export default function ClientePresupuestoPublicoPage() {
  const params = useParams();
  // El [id] en la URL es el token url_firma, no el id interno
  const token = params.id as string;

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [motivos, setMotivos] = useState("");
  const [metodoSeleccionado, setMetodoSeleccionado] = useState("tarjeta");
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      const supabase = createClient();

      // Buscar por url_firma (RLS permite acceso público cuando url_firma no es null)
      const { data: presupuestoData, error: presupuestoError } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("url_firma", token)
        .single();

      if (presupuestoError || !presupuestoData) {
        setError("Presupuesto no encontrado o enlace inválido");
        setCargando(false);
        return;
      }

      const presupuestoMapeado = mapPresupuesto(presupuestoData);
      setPresupuesto(presupuestoMapeado);

      const { data: clienteData } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", presupuestoMapeado.clienteId)
        .single();

      if (clienteData) setCliente(mapCliente(clienteData));
      setCargando(false);
    }

    cargarDatos();
  }, [token]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error || !presupuesto || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-4xl mb-3">❌</p>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Enlace no válido</h2>
          <p className="text-slate-600">{error ?? "No se encontró el presupuesto."}</p>
        </div>
      </div>
    );
  }

  const handleAceptar = () => setShowFirmaModal(true);
  const handleRechazar = () => setShowRechazoModal(true);

  const handleConfirmarAceptacion = async () => {
    if (!presupuesto) return;
    setGuardando(true);
    const supabase = createClient();
    const ahora = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("presupuestos")
      .update({ estado_firma: "aceptado", fecha_firma: ahora, estado: "aceptado" })
      .eq("url_firma", token);

    if (!updateError) {
      setPresupuesto({ ...presupuesto, estado: "aceptado", estadoFirma: "aceptado", fechaFirma: ahora });
    }
    setGuardando(false);
    setShowFirmaModal(false);
  };

  const handleConfirmarRechazo = async () => {
    if (!presupuesto) return;
    setGuardando(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("presupuestos")
      .update({ estado_firma: "rechazado", estado: "rechazado", notas: motivos })
      .eq("url_firma", token);

    if (!updateError) {
      setPresupuesto({ ...presupuesto, estado: "rechazado", estadoFirma: "rechazado", notas: motivos });
    }
    setGuardando(false);
    setShowRechazoModal(false);
  };

  const handlePagar = () => {
    setShowPagoModal(true);
  };

  const handleDescargarPDF = async () => {
    if (!presupuesto || !cliente) return;
    setDescargando(true);
    try {
      const blob = await generarPdfPresupuesto(presupuesto, cliente);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presupuesto-${presupuesto.titulo.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el PDF. Inténtalo de nuevo.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">{presupuesto.titulo}</h1>
            <div className="text-right">
              <p className="text-sm text-slate-500">De: LUCELUX</p>
            </div>
          </div>
          <p className="text-slate-600">Para: {cliente.nombre}</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {formatearMoneda(presupuesto.importeTotal)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* PresupuestoVistaCliente */}
            <PresupuestoVistaCliente
              presupuesto={presupuesto}
              cliente={cliente}
              pagos={[]}
              onAceptar={handleAceptar}
              onRechazar={handleRechazar}
              onPagar={handlePagar}
              onDescargarPDF={handleDescargarPDF}
              descargando={descargando}
            />

            {/* Seguimiento de Obra */}
            {presupuesto.estadoFirma === "aceptado" && (
              <SeguimientoObra seguimiento={presupuesto.seguimiento} />
            )}

            {/* Bloque de pago tras aceptar */}
            {presupuesto.estadoFirma === "aceptado" && (
              <BloquePagoCliente
                importeTotal={presupuesto.importeTotal}
                porcentajeAdelanto={presupuesto.porcentajeAdelanto ?? 50}
                tituloPresupuesto={presupuesto.titulo}
              />
            )}

            {/* Detalles de materiales */}
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
                    {presupuesto.lineas.map((linea) => (
                      <tr key={linea.id} className="border-b border-slate-200">
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{linea.nombre}</p>
                          {linea.descripcion && (
                            <p className="text-xs text-slate-500">{linea.descripcion}</p>
                          )}
                        </td>
                        <td className="text-center py-3 text-slate-600">
                          {linea.cantidad} {linea.unidad}
                        </td>
                        <td className="text-right py-3">
                          {formatearMoneda(linea.costeUnitario)}
                        </td>
                        <td className="text-right py-3 font-semibold">
                          {formatearMoneda(linea.cantidad * linea.costeUnitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Información</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-slate-500">Número</p>
                  <p className="font-medium text-slate-900">{presupuesto.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Emitido</p>
                  <p className="font-medium text-slate-900">{formatearFecha(presupuesto.fecha)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Vence</p>
                  <p className="font-medium text-slate-900">
                    {formatearFecha(presupuesto.fechaVencimiento)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Estado</p>
                  <p className="font-medium text-slate-900 capitalize">{presupuesto.estado}</p>
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="bg-slate-900 text-white rounded-2xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatearMoneda(presupuesto.subtotalLineas)}</span>
                </div>
                {presupuesto.descuentoGlobal > 0 && (
                  <div className="flex justify-between text-sm text-green-300">
                    <span>Descuento</span>
                    <span>-{formatearMoneda(presupuesto.descuentoGlobal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>IVA ({presupuesto.ivaGlobal}%)</span>
                  <span>{formatearMoneda(presupuesto.totalIva)}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-lg">{formatearMoneda(presupuesto.importeTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODALES */}

        {/* Modal Firma */}
        <Modal isOpen={showFirmaModal} onClose={() => setShowFirmaModal(false)}>
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Confirmar aceptación</h3>
            <p className="text-slate-600 mb-6">
              Al aceptar este presupuesto confirmas tu conformidad con las condiciones y el importe total.
            </p>
            {presupuesto.porcentajeAdelanto > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  Adelanto requerido ({presupuesto.porcentajeAdelanto}%):{" "}
                  <span className="font-bold">
                    {formatearMoneda(presupuesto.importeTotal * (presupuesto.porcentajeAdelanto / 100))}
                  </span>
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFirmaModal(false)}
                className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAceptacion}
                disabled={guardando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                {guardando ? "Guardando..." : "Aceptar"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Rechazo */}
        <Modal isOpen={showRechazoModal} onClose={() => setShowRechazoModal(false)}>
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Rechazar presupuesto</h3>
            <p className="text-slate-600 mb-4">¿Por qué rechazas este presupuesto?</p>
            <textarea
              value={motivos}
              onChange={(e) => setMotivos(e.target.value)}
              placeholder="Motivo del rechazo..."
              className="w-full border border-slate-300 rounded-lg p-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRechazoModal(false)}
                className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRechazo}
                disabled={guardando}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                {guardando ? "Guardando..." : "Rechazar"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Pago */}
        <Modal isOpen={showPagoModal} onClose={() => setShowPagoModal(false)}>
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Instrucciones de pago</h3>
            <p className="text-slate-600 mb-4">Selecciona el método de pago preferido:</p>
            <div className="space-y-3 mb-6">
              {["tarjeta", "transferencia", "bizum"].map((metodo) => (
                <label key={metodo} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="metodo"
                    value={metodo}
                    checked={metodoSeleccionado === metodo}
                    onChange={(e) => setMetodoSeleccionado(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize font-medium text-slate-900">{metodo}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowPagoModal(false)}
              className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
