"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useParams } from "next/navigation";
import { PresupuestoVistaCliente } from "@/components/presupuestos/PresupuestoVistaCliente";
import { SeguimientoObra } from "@/components/presupuestos/SeguimientoObra";
import { Modal } from "@/components/Modal";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";

const MOCK_PAGOS = [
  {
    id: "1",
    usuarioId: "user1",
    presupuestoId: "1",
    clienteId: "1",
    importe: 500,
    porcentaje: 30,
    metodo: "tarjeta" as const,
    estado: "completado" as const,
    fechaCreacion: "2025-02-01",
    creadoEn: "2025-02-01",
  },
];

export default function ClientePresupuestoDetalleEditablePage() {
  const params = useParams();
  const presupuestoId = params.id as string;
  const { presupuestos, clientes, updatePresupuesto } = useApp();

  const presupuesto = presupuestos.find((p) => p.id === presupuestoId);
  const cliente = presupuesto ? clientes.find((c) => c.id === presupuesto.clienteId) : null;

  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [motivos, setMotivos] = useState("");
  const [metodoSeleccionado, setMetodoSeleccionado] = useState("tarjeta");

  if (!presupuesto || !cliente) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Presupuesto no encontrado</p>
      </div>
    );
  }

  const handleAceptar = () => {
    setShowFirmaModal(true);
  };

  const handleConfirmarAceptacion = () => {
    updatePresupuesto(presupuestoId, {
      ...presupuesto,
      estado: "aceptado",
      estadoFirma: "aceptado",
      fechaFirma: new Date().toISOString().split("T")[0],
    });
    setShowFirmaModal(false);
  };

  const handleRechazar = () => {
    setShowRechazoModal(true);
  };

  const handleConfirmarRechazo = () => {
    updatePresupuesto(presupuestoId, {
      ...presupuesto,
      estado: "rechazado",
      estadoFirma: "rechazado",
      notas: motivos,
    });
    setShowRechazoModal(false);
  };

  const handlePagar = () => {
    setShowPagoModal(true);
  };

  const handleConfirmarPago = () => {
    updatePresupuesto(presupuestoId, {
      ...presupuesto,
      estado: "aceptado",
    });
    setShowPagoModal(false);
  };

  const handleDescargarPDF = () => {
    console.log("Descargando PDF del presupuesto:", presupuesto.titulo);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Sticky */}
      <div className="mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">{presupuesto.titulo}</h1>
        <p className="text-slate-600">Cliente: {cliente.nombre}</p>
        <p className="text-2xl font-bold text-blue-600 mt-2">
          {formatearMoneda(presupuesto.importeTotal)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* PresupuestoVistaCliente con handlers */}
          <PresupuestoVistaCliente
            presupuesto={presupuesto}
            cliente={cliente}
            pagos={MOCK_PAGOS}
            onAceptar={handleAceptar}
            onRechazar={handleRechazar}
            onPagar={handlePagar}
            onDescargarPDF={handleDescargarPDF}
          />

          {/* Seguimiento de Obra */}
          {presupuesto.estadoFirma === "aceptado" && (
            <SeguimientoObra seguimiento={presupuesto.seguimiento} />
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

        {/* Sidebar derecho */}
        <div className="space-y-6">
          {/* Info del presupuesto */}
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
            Al aceptar este presupuesto, confirmas tu conformidad con las condiciones y el
            importe total.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              Adelanto requerido: <span className="font-bold">{formatearMoneda(presupuesto.importeTotal * 0.3)}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFirmaModal(false)}
              className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarAceptacion}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Aceptar
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Rechazar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Pago */}
      <Modal isOpen={showPagoModal} onClose={() => setShowPagoModal(false)}>
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Realizar pago</h3>
          <p className="text-slate-600 mb-6">
            Importe a pagar: <span className="font-bold text-lg">{formatearMoneda(presupuesto.importeTotal * 0.3)}</span>
          </p>
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowPagoModal(false)}
              className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarPago}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Pagar ahora
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
