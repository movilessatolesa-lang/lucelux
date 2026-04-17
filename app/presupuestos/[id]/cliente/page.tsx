"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PresupuestoVistaCliente } from "@/components/presupuestos/PresupuestoVistaCliente";
import { Modal } from "@/components/Modal";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";
import type { Presupuesto, Cliente } from "@/lib/types";

// Mock data - en producción cargar desde API
const SEED_PRESUPUESTOS: Presupuesto[] = [
  {
    id: "p1",
    usuarioId: "usr_demo_001",
    clienteId: "c1",
    titulo: "Celosías aluminio terraza",
    descripcion: "Celosías para terraza exterior",
    lineas: [
      {
        id: "lin1",
        materialId: "mat1",
        nombre: "Marco Aluminio Plata 25mm",
        cantidad: 10,
        unidad: "m",
        medidas: "2.5m × 1.5m",
        costeUnitario: 45,
        margenPorcentaje: 30,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin2",
        materialId: "mat4",
        nombre: "Vidrio Templado 6mm",
        cantidad: 3.75,
        unidad: "m²",
        medidas: "2.5m × 1.5m",
        costeUnitario: 20,
        margenPorcentaje: 30,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
    ],
    fecha: "2025-04-01",
    fechaVencimiento: "2025-05-01",
    estado: "enviado",
    subtotalLineas: 2077.5,
    descuentoGlobal: 0,
    subtotalConDescuento: 2077.5,
    ivaGlobal: 21,
    totalIva: 436.28,
    importeTotal: 2513.78,
    estadoFirma: "pendiente",
    urlFirma: "token_p1_c1",
    notas: "Medidas pendientes de confirmar",
    creadoEn: "2025-04-01T11:00:00.000Z",
  },
  {
    id: "p2",
    usuarioId: "usr_demo_001",
    clienteId: "c1",
    titulo: "Persiana motorizada dormitorio",
    descripcion: "Persiana con motor reversible",
    lineas: [
      {
        id: "lin3",
        nombre: "Persiana Motorizada 1.2m × 1m",
        cantidad: 1,
        unidad: "ud",
        medidas: "1.2m × 1m",
        costeUnitario: 200,
        margenPorcentaje: 40,
        descuentoLinea: 20,
        ivaLinea: 21,
      },
    ],
    fecha: "2025-02-10",
    fechaVencimiento: "2025-03-10",
    estado: "aceptado",
    subtotalLineas: 280,
    descuentoGlobal: 0,
    subtotalConDescuento: 280,
    ivaGlobal: 21,
    totalIva: 58.8,
    importeTotal: 338.8,
    estadoFirma: "aceptado",
    fechaFirma: "2025-02-12T10:00:00.000Z",
    urlFirma: "token_p2_c1",
    notas: "",
    creadoEn: "2025-02-10T09:00:00.000Z",
  },
];

const SEED_CLIENTES: Cliente[] = [
  {
    id: "c1",
    usuarioId: "usr_demo_001",
    nombre: "Manuel García López",
    telefono: "612 345 678",
    email: "mgarcia@gmail.com",
    direccion: "Calle Mayor 12, 2ºB",
    ciudad: "Madrid",
    codigoPostal: "28001",
    tipo: "particular",
    dniNif: "12345678A",
    notas: "Cliente habitual",
    tags: ["habitual"],
    recurrente: true,
    problematico: false,
    creadoEn: "2024-01-15T10:00:00.000Z",
  },
];

const MOCK_PAGOS = [
  {
    id: "1",
    usuarioId: "user1",
    presupuestoId: "p1",
    clienteId: "c1",
    importe: 500,
    porcentaje: 30,
    metodo: "tarjeta" as const,
    estado: "completado" as const,
    fechaCreacion: "2025-02-01",
    creadoEn: "2025-02-01",
  },
];

export default function ClientePresupuestoPublicoPage() {
  const params = useParams();
  const presupuestoId = params.id as string;
  
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [motivos, setMotivos] = useState("");
  const [metodoSeleccionado, setMetodoSeleccionado] = useState("tarjeta");

  useEffect(() => {
    // Cargar presupuesto
    const presupuestoEncontrado = SEED_PRESUPUESTOS.find((p) => p.id === presupuestoId);
    
    if (!presupuestoEncontrado) {
      setError("Presupuesto no encontrado");
      return;
    }

    setPresupuesto(presupuestoEncontrado);

    // Cargar cliente
    const clienteEncontrado = SEED_CLIENTES.find((c) => c.id === presupuestoEncontrado.clienteId);
    if (clienteEncontrado) {
      setCliente(clienteEncontrado);
    }
  }, [presupuestoId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-4xl mb-3">❌</p>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!presupuesto || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  const handleAceptar = () => {
    setShowFirmaModal(true);
  };

  const handleConfirmarAceptacion = () => {
    setPresupuesto({
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
    setPresupuesto({
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
    setPresupuesto({
      ...presupuesto,
      estado: "aceptado",
    });
    setShowPagoModal(false);
  };

  const handleDescargarPDF = () => {
    console.log("Descargando PDF del presupuesto:", presupuesto.titulo);
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
              <p className="text-sm text-slate-500">{cliente.email}</p>
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
              pagos={MOCK_PAGOS}
              onAceptar={handleAceptar}
              onRechazar={handleRechazar}
              onPagar={handlePagar}
              onDescargarPDF={handleDescargarPDF}
            />

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
    </div>
  );
}
