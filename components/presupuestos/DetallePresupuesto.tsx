"use client";

import { useState } from "react";
import type { Presupuesto, Cliente, HitoSeguimiento } from "@/lib/types";
import { useApp } from "@/lib/store";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";
import { BotonesAccion } from "./BotonesAccion";
import { SeguimientoObraAdmin } from "./SeguimientoObraAdmin";

interface DetallePresupuestoProps {
  presupuesto: Presupuesto;
  onActualizar: (data: Partial<Presupuesto>) => void;
  onClose: () => void;
}

export function DetallePresupuesto({
  presupuesto,
  onActualizar,
  onClose,
}: DetallePresupuestoProps) {
  const { clientes, addPlantilla } = useApp();
  const cliente = clientes.find((c) => c.id === presupuesto.clienteId);

  const handleGuardarPlantilla = () => {
    const nombre = prompt("Nombre de la plantilla:");
    if (!nombre) return;

    addPlantilla({
      nombre,
      descripcion: presupuesto.descripcion,
      lineas: presupuesto.lineas,
      margenPorcentajePredeterminado: presupuesto.ivaGlobal,
      ivaGlobalPredeterminado: presupuesto.ivaGlobal,
    });

    alert("Plantilla guardada exitosamente");
  };

  const handleActualizarEstado = (estado: "aceptado" | "rechazado") => {
    onActualizar({
      estadoFirma: estado,
      fechaFirma: new Date().toISOString(),
      estado: estado === "aceptado" ? "aceptado" : "rechazado",
    });
  };

  const handleActualizarSeguimiento = (nuevoSeguimiento: HitoSeguimiento[]) => {
    onActualizar({
      seguimiento: nuevoSeguimiento,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{presupuesto.titulo}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Cliente y info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Cliente</h3>
              {cliente ? (
                <>
                  <p className="font-medium text-slate-900">{cliente.nombre}</p>
                  <p className="text-sm text-slate-600">{cliente.direccion}</p>
                  <p className="text-sm text-slate-600">
                    {cliente.codigoPostal} {cliente.ciudad}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Sin cliente</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Información</h3>
              <p className="text-sm text-slate-600">
                <span className="font-medium">ID:</span> {presupuesto.id}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Fecha:</span> {formatearFecha(presupuesto.fecha)}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Vencimiento:</span>{" "}
                {formatearFecha(presupuesto.fechaVencimiento)}
              </p>
            </div>
          </div>

          {/* Descripción */}
          {presupuesto.descripcion && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Descripción</h3>
              <p className="text-slate-600">{presupuesto.descripcion}</p>
            </div>
          )}

          {/* Tabla de materiales */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Materiales</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Material</th>
                    <th className="px-3 py-2 text-center font-semibold">Cant.</th>
                    <th className="px-3 py-2 text-right font-semibold">Coste Unit.</th>
                    <th className="px-3 py-2 text-right font-semibold">Margen</th>
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuesto.lineas.map((linea, idx) => {
                    const subtotal = linea.cantidad * linea.costeUnitario;
                    const conMargen = subtotal * (1 + linea.margenPorcentaje / 100);
                    const total = conMargen - linea.descuentoLinea;
                    return (
                      <tr key={linea.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">{linea.nombre}</p>
                          {linea.medidas && (
                            <p className="text-xs text-slate-600">{linea.medidas}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-900">
                          {linea.cantidad} {linea.unidad}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-900">
                          {formatearMoneda(linea.costeUnitario)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-900">
                          {linea.margenPorcentaje}%
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {formatearMoneda(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="max-w-xs ml-auto space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between">
              <span className="text-slate-700">Subtotal:</span>
              <span className="font-semibold">{formatearMoneda(presupuesto.subtotalLineas)}</span>
            </div>
            {presupuesto.descuentoGlobal > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Descuento:</span>
                <span className="font-semibold">-{formatearMoneda(presupuesto.descuentoGlobal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-700">IVA ({presupuesto.ivaGlobal}%):</span>
              <span className="font-semibold">{formatearMoneda(presupuesto.totalIva)}</span>
            </div>
            <div className="flex justify-between bg-blue-50 px-2 py-1 rounded border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-900">TOTAL:</span>
              <span className="font-bold text-blue-700">{formatearMoneda(presupuesto.importeTotal)}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <BotonesAccion
            presupuesto={presupuesto}
            cliente={cliente || null}
            onActualizarEstado={handleActualizarEstado}
            onGuardarPlantilla={handleGuardarPlantilla}
          />

          {/* Panel de Seguimiento (si presupuesto aceptado) */}
          {presupuesto.estadoFirma === "aceptado" && (
            <SeguimientoObraAdmin
              presupuesto={presupuesto}
              onUpdate={handleActualizarSeguimiento}
            />
          )}

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
