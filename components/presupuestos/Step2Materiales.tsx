"use client";

import { useState } from "react";
import type { Material, LineaPresupuesto } from "@/lib/types";

const FORM_VACIO = {
  materialId: "",
  nombre: "",
  cantidad: 1,
  unidad: "ud",
  costeUnitario: 0,
  margenPorcentaje: 30,
};

interface Step2MaterialesProps {
  materiales: Material[];
  lineas: LineaPresupuesto[];
  onAddLinea: (linea: LineaPresupuesto) => void;
  onRemoveLinea: (lineaId: string) => void;
  onUpdateLinea: (id: string, data: Partial<LineaPresupuesto>) => void;
}

export function Step2Materiales({
  materiales,
  lineas,
  onAddLinea,
  onRemoveLinea,
  onUpdateLinea,
}: Step2MaterialesProps) {
  const [showForm, setShowForm] = useState(false);
  // ID de la línea que se está editando (null = modo creación)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...FORM_VACIO });

  // Abre el formulario para editar una línea existente
  const handleEditLinea = (linea: LineaPresupuesto) => {
    setEditingId(linea.id);
    setFormData({
      materialId: linea.materialId || "",
      nombre: linea.nombre,
      cantidad: linea.cantidad,
      unidad: linea.unidad,
      costeUnitario: linea.costeUnitario,
      margenPorcentaje: linea.margenPorcentaje,
    });
    setShowForm(true);
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...FORM_VACIO });
  };

  const handleGuardar = () => {
    if (!formData.nombre || formData.cantidad <= 0) {
      alert("Completa nombre y cantidad");
      return;
    }

    if (editingId) {
      // Editar línea existente
      onUpdateLinea(editingId, {
        materialId: formData.materialId || undefined,
        nombre: formData.nombre,
        cantidad: formData.cantidad,
        unidad: formData.unidad,
        costeUnitario: formData.costeUnitario,
        margenPorcentaje: formData.margenPorcentaje,
      });
    } else {
      // Añadir nueva línea
      const newLinea: LineaPresupuesto = {
        id: Math.random().toString(36).slice(2, 10),
        materialId: formData.materialId || undefined,
        nombre: formData.nombre,
        cantidad: formData.cantidad,
        unidad: formData.unidad,
        costeUnitario: formData.costeUnitario,
        margenPorcentaje: formData.margenPorcentaje,
        descuentoLinea: 0,
        ivaLinea: 21,
      };
      onAddLinea(newLinea);
    }

    handleCancelar();
  };

  const handleSelectMaterial = (material: Material) => {
    setFormData({
      ...formData,
      materialId: material.id,
      nombre: material.nombre,
      unidad: material.unidad,
      costeUnitario: material.costeUnitario,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Paso 2: Seleccionar Materiales</h3>

      {/* Lista de líneas agregadas */}
      {lineas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-slate-900">Materiales agregados:</h4>
          {lineas.map((linea) => (
            <div
              key={linea.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition ${
                editingId === linea.id
                  ? "bg-blue-50 border-blue-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">{linea.nombre}</p>
                <p className="text-sm text-slate-500">
                  {linea.cantidad} {linea.unidad} · {linea.costeUnitario.toFixed(2)} €/ud · Margen {linea.margenPorcentaje}%
                </p>
              </div>
              <div className="flex gap-2 ml-3 shrink-0">
                <button
                  onClick={() => handleEditLinea(linea)}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => onRemoveLinea(linea.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar material (solo si no hay form abierto) */}
      {!showForm && (
        <button
          onClick={() => { setEditingId(null); setFormData({ ...FORM_VACIO }); setShowForm(true); }}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Añadir material
        </button>
      )}

      {/* Formulario (añadir o editar) */}
      {showForm && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h4 className="font-semibold text-slate-900">
            {editingId ? "Editar material" : "Nuevo material"}
          </h4>

          {/* Catálogo de materiales (solo en modo creación) */}
          {!editingId && (
            <div className="space-y-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
              <p className="text-xs text-slate-400 mb-1">Selecciona del catálogo o rellena manualmente:</p>
              {materiales.map((material) => (
                <button
                  key={material.id}
                  onClick={() => handleSelectMaterial(material)}
                  className="w-full text-left p-2 hover:bg-blue-50 rounded border border-slate-200 hover:border-blue-400 transition"
                >
                  <p className="font-medium text-slate-900 text-sm">{material.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {material.costeUnitario} €/{material.unidad} · {material.categoria}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Nombre */}
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1 block">Nombre</span>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Ej: Marco Aluminio Personalizado"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1 block">Cantidad</span>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min="0"
                step="0.1"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1 block">Unidad</span>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option>ud</option>
                <option>m</option>
                <option>m²</option>
                <option>m³</option>
                <option>h</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1 block">Coste unitario (€)</span>
              <input
                type="number"
                value={formData.costeUnitario}
                onChange={(e) => setFormData({ ...formData, costeUnitario: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min="0"
                step="0.01"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1 block">Margen (%)</span>
              <input
                type="number"
                value={formData.margenPorcentaje}
                onChange={(e) => setFormData({ ...formData, margenPorcentaje: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min="0"
                max="999"
                step="0.1"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancelar}
              className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
            >
              {editingId ? "✓ Guardar cambios" : "Añadir material"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
