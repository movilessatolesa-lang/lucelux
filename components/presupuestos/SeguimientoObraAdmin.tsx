"use client";

import { useState } from "react";
import type { Presupuesto, HitoSeguimiento, EstadoSeguimiento, Cliente } from "@/lib/types";
import { enviarNotificacionSeguimiento } from "@/lib/notificaciones";

interface SeguimientoObraAdminProps {
  presupuesto: Presupuesto;
  cliente?: Cliente | null;
  onUpdate: (nuevoSeguimiento: HitoSeguimiento[]) => void;
}

const ETAPAS: { estado: EstadoSeguimiento; label: string; icon: string }[] = [
  { estado: "aceptado", label: "Presupuesto Aceptado", icon: "✓" },
  { estado: "pendiente_material", label: "Pendiente Material", icon: "⏳" },
  { estado: "material_disponible", label: "Material Disponible", icon: "📦" },
  { estado: "en_fabricacion", label: "En Fabricación", icon: "🔧" },
  { estado: "fabricacion_lista", label: "Fabricación Lista", icon: "✓" },
  { estado: "pendiente_cita", label: "Pendiente Confirmar Cita", icon: "📅" },
  { estado: "cita_confirmada", label: "Cita Confirmada", icon: "📌" },
  { estado: "en_instalacion", label: "En Instalación", icon: "👷" },
  { estado: "entregado", label: "Entregado", icon: "🎉" },
];

export function SeguimientoObraAdmin({ presupuesto, cliente, onUpdate }: SeguimientoObraAdminProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    fecha: string;
    notas: string;
    completado: boolean;
  } | null>(null);
  const [enviandoNotificacion, setEnviandoNotificacion] = useState(false);
  const [notificacionStatus, setNotificacionStatus] = useState<{ tipo: 'exito' | 'error' | 'neutral'; mensaje: string } | null>(null);

  const seguimiento = presupuesto.seguimiento || [];

  const handleEditClick = (hito: HitoSeguimiento) => {
    setEditingId(hito.id);
    setEditData({
      fecha: hito.fecha || "",
      notas: hito.notas || "",
      completado: hito.completado,
    });
  };

  const handleSave = async () => {
    if (!editingId || !editData) return;

    const hitoActualizado = {
      ...seguimiento.find((h) => h.id === editingId)!,
      fecha: editData.fecha || seguimiento.find((h) => h.id === editingId)?.fecha,
      notas: editData.notas || seguimiento.find((h) => h.id === editingId)?.notas,
      completado: editData.completado,
    };

    const nuevoSeguimiento = seguimiento.map((h) =>
      h.id === editingId ? hitoActualizado : h
    );

    onUpdate(nuevoSeguimiento);

    // Enviar notificación al cliente si aceptamos o cambia estado
    if (cliente?.telefono && hitoActualizado.completado && hitoActualizado.completado !== seguimiento.find((h) => h.id === editingId)?.completado) {
      setEnviandoNotificacion(true);
      const resultado = await enviarNotificacionSeguimiento(
        cliente.telefono,
        hitoActualizado,
        cliente.nombre
      );
      setNotificacionStatus({
        tipo: resultado.exito ? 'exito' : 'error',
        mensaje: resultado.mensaje,
      });
      setEnviandoNotificacion(false);

      // Limpiar mensaje después de 4 segundos
      setTimeout(() => setNotificacionStatus(null), 4000);
    }

    setEditingId(null);
    setEditData(null);
  };

  const handleMarkAsCompleted = async (index: number) => {
    const nuevoSeguimiento = seguimiento.map((h, i) => ({
      ...h,
      completado: i <= index,
      fecha: i <= index && !h.fecha ? new Date().toISOString().split("T")[0] : h.fecha,
    }));

    onUpdate(nuevoSeguimiento);

    // Enviar notificación al cliente
    if (cliente?.telefono && nuevoSeguimiento[index]) {
      setEnviandoNotificacion(true);
      const resultado = await enviarNotificacionSeguimiento(
        cliente.telefono,
        nuevoSeguimiento[index],
        cliente.nombre
      );
      setNotificacionStatus({
        tipo: resultado.exito ? 'exito' : 'error',
        mensaje: resultado.mensaje,
      });
      setEnviandoNotificacion(false);

      // Limpiar mensaje después de 4 segundos
      setTimeout(() => setNotificacionStatus(null), 4000);
    }
  };

  if (!seguimiento || seguimiento.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-slate-500 text-center">Sin seguimiento configurado</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Editar Seguimiento de Obra</h3>
        {cliente?.telefono && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">📱 {cliente.telefono}</span>
        )}
      </div>

      {notificacionStatus && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          notificacionStatus.tipo === 'exito'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : notificacionStatus.tipo === 'error'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-slate-100 text-slate-800 border border-slate-200'
        }`}>
          {notificacionStatus.tipo === 'exito' ? '✅' : notificacionStatus.tipo === 'error' ? '❌' : 'ℹ️'} {notificacionStatus.mensaje}
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {seguimiento.map((hito, idx) => {
          const etapa = ETAPAS.find((e) => e.estado === hito.estado);
          const isEditing = editingId === hito.id;

          return (
            <div
              key={hito.id}
              className={`border rounded-xl p-4 ${
                isEditing
                  ? "border-blue-300 bg-blue-50"
                  : hito.completado
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {!isEditing ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{etapa?.icon}</span>
                        <p className="font-semibold text-slate-900">{etapa?.label}</p>
                        {hito.completado && (
                          <span className="text-xs bg-green-200 text-green-900 px-2 py-0.5 rounded-full">
                            ✓ Completado
                          </span>
                        )}
                      </div>

                      {hito.fecha && (
                        <p className="text-sm text-slate-600 mb-1">
                          📅 {new Date(hito.fecha).toLocaleDateString("es-ES")}
                        </p>
                      )}

                      {hito.notas && (
                        <p className="text-sm text-slate-700 bg-white p-2 rounded mt-2">{hito.notas}</p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(hito)}
                        className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        Editar
                      </button>

                      {!hito.completado && (
                        <button
                          onClick={() => handleMarkAsCompleted(idx)}
                          className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                        >
                          Marcar ✓
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={editData?.fecha || ""}
                      onChange={(e) =>
                        setEditData((prev) => prev ? { ...prev, fecha: e.target.value } : null)
                      }
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Notas</label>
                    <textarea
                      value={editData?.notas || ""}
                      onChange={(e) =>
                        setEditData((prev) => prev ? { ...prev, notas: e.target.value } : null)
                      }
                      placeholder="Ej: Material llegó, comenzar fabricación..."
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editData?.completado || false}
                      onChange={(e) =>
                        setEditData((prev) =>
                          prev ? { ...prev, completado: e.target.checked } : null
                        )
                      }
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium text-slate-700">Marcar como completado</label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={enviandoNotificacion}
                      className="flex-1 px-3 py-2 text-xs bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded transition-colors font-semibold disabled:cursor-not-allowed"
                    >
                      {enviandoNotificacion ? '⏳ Enviando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditData(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 rounded transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
