"use client";

import type { HitoSeguimiento, EstadoSeguimiento } from "@/lib/types";
import { formatearFecha } from "@/lib/presupuesto-utils";

interface SeguimientoObraProps {
  seguimiento?: HitoSeguimiento[];
  editable?: boolean;
  onUpdateEstado?: (nuevoEstado: EstadoSeguimiento, notas?: string) => void;
}

const ETAPAS_SEGUIMIENTO: { estado: EstadoSeguimiento; label: string; color: string; icon: string }[] = [
  { estado: "aceptado", label: "Presupuesto Aceptado", color: "bg-blue-100 text-blue-900", icon: "✓" },
  { estado: "pendiente_material", label: "Pendiente Material", color: "bg-amber-100 text-amber-900", icon: "⏳" },
  { estado: "material_disponible", label: "Material Disponible", color: "bg-emerald-100 text-emerald-900", icon: "📦" },
  { estado: "en_fabricacion", label: "En Fabricación", color: "bg-purple-100 text-purple-900", icon: "🔧" },
  { estado: "fabricacion_lista", label: "Fabricación Lista", color: "bg-cyan-100 text-cyan-900", icon: "✓" },
  { estado: "pendiente_cita", label: "Pendiente Confirmar Cita", color: "bg-amber-100 text-amber-900", icon: "📅" },
  { estado: "cita_confirmada", label: "Cita Confirmada", color: "bg-emerald-100 text-emerald-900", icon: "📌" },
  { estado: "en_instalacion", label: "En Instalación", color: "bg-orange-100 text-orange-900", icon: "👷" },
  { estado: "finalizado", label: "Finalizado", color: "bg-green-100 text-green-900", icon: "✓" },
  { estado: "entregado", label: "Entregado", color: "bg-green-100 text-green-900", icon: "🎉" },
];

export function SeguimientoObra({ seguimiento = [], editable = false, onUpdateEstado }: SeguimientoObraProps) {
  if (!seguimiento || seguimiento.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-slate-500 text-center">Pendiente de iniciar el seguimiento de la obra</p>
      </div>
    );
  }

  const ultimoEstado = seguimiento[seguimiento.length - 1];
  const porcentajeComplecion = Math.round((seguimiento.filter((h) => h.completado).length / seguimiento.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Seguimiento de Obra</h3>
        
        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Avance</span>
            <span className="text-sm font-bold text-slate-900">{porcentajeComplecion}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
              style={{ width: `${porcentajeComplecion}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {seguimiento.map((hito, idx) => {
            const etapa = ETAPAS_SEGUIMIENTO.find((e) => e.estado === hito.estado);
            const esActual = idx === seguimiento.findIndex((h) => !h.completado);
            const esUltimo = idx === seguimiento.length - 1;

            return (
              <div key={hito.id} className="flex gap-4">
                {/* Línea conectora */}
                {!esUltimo && (
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                        hito.completado
                          ? "bg-green-600 text-white"
                          : esActual
                          ? "bg-blue-600 text-white ring-4 ring-blue-200"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {etapa?.icon}
                    </div>
                    <div className={`w-0.5 flex-1 my-2 ${hito.completado ? "bg-green-600" : "bg-slate-300"}`} />
                  </div>
                )}

                {/* Último item sin línea */}
                {esUltimo && (
                  <div className="flex items-start">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                        hito.completado
                          ? "bg-green-600 text-white"
                          : esActual
                          ? "bg-blue-600 text-white ring-4 ring-blue-200"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {etapa?.icon}
                    </div>
                  </div>
                )}

                {/* Contenido */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{etapa?.label}</p>
                    {hito.completado && <span className="text-xs font-semibold text-green-600">✓ Completado</span>}
                    {esActual && <span className="text-xs font-semibold text-blue-600">🔄 En curso</span>}
                  </div>
                  
                  {hito.descripcion && (
                    <p className="text-sm text-slate-600 mb-1">{hito.descripcion}</p>
                  )}
                  
                  {hito.fecha && (
                    <p className="text-xs text-slate-500">{formatearFecha(hito.fecha)}</p>
                  )}
                  
                  {hito.notas && (
                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                      💬 {hito.notas}
                    </div>
                  )}

                  {editable && esActual && onUpdateEstado && (
                    <button
                      onClick={() => {
                        const siguienteIdx = idx + 1;
                        if (siguienteIdx < seguimiento.length) {
                          const siguienteEstado = seguimiento[siguienteIdx].estado;
                          onUpdateEstado(siguienteEstado);
                        }
                      }}
                      className="mt-2 text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                    >
                      Marcar como completado →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
