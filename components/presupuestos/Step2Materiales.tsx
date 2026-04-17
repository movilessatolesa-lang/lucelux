"use client";

import { useState } from "react";
import type { Material, LineaPresupuesto } from "@/lib/types";

interface Step2MaterialesProps {
  materiales: Material[];
  lineas: LineaPresupuesto[];
  onAddLinea: (linea: LineaPresupuesto) => void;
  onRemoveLinea: (lineaId: string) => void;
}

export function Step2Materiales({
  materiales,
  lineas,
  onAddLinea,
  onRemoveLinea,
}: Step2MaterialesProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    materialId: "",
    nombre: "",
    cantidad: 1,
    unidad: "ud",
    costeUnitario: 0,
    margenPorcentaje: 30,
  });

  const handleAddLinea = () => {
    if (!formData.nombre || formData.cantidad <= 0) {
      alert("Completa todos los campos");
      return;
    }

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

    // Reset form
    setFormData({
      materialId: "",
      nombre: "",
      cantidad: 1,
      unidad: "ud",
      costeUnitario: 0,
      margenPorcentaje: 30,
    });
    setShowForm(false);
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
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <div>
                <p className="font-medium text-slate-900">{linea.nombre}</p>
                <p className="text-sm text-slate-600">
                  {linea.cantidad} {linea.unidad} @ €{linea.costeUnitario.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => onRemoveLinea(linea.id)}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar material */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        {showForm ? "Cancelar" : "+ Agregar Material"}
      </button>

      {/* Formulario para agregar material */}
      {showForm && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <h4 className="font-semibold text-slate-900">Selecciona o crea un material</h4>

          {/* Catálogo de materiales */}
          <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
            {materiales.map((material) => (
              <button
                key={material.id}
                onClick={() => handleSelectMaterial(material)}
                className="w-full text-left p-2 hover:bg-blue-50 rounded border border-slate-200 hover:border-blue-400 transition"
              >
                <p className="font-medium text-slate-900">{material.nombre}</p>
                <p className="text-sm text-slate-600">
                  €{material.costeUnitario} / {material.unidad} • {material.categoria}
                </p>
              </button>
            ))}
          </div>

          {/* Campos del formulario */}
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1 block">Nombre del material</span>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Marco Aluminio Personalizado"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1 block">Cantidad</span>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1 block">Unidad</span>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>ud</option>
                <option>m</option>
                <option>m²</option>
                <option>m³</option>
                <option>h</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1 block">Coste unitario (€)</span>
            <input
              type="number"
              value={formData.costeUnitario}
              onChange={(e) => setFormData({ ...formData, costeUnitario: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1 block">Margen (%)</span>
            <input
              type="number"
              value={formData.margenPorcentaje}
              onChange={(e) =>
                setFormData({ ...formData, margenPorcentaje: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="999"
              step="0.1"
            />
          </label>

          <button
            onClick={handleAddLinea}
            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Agregar Material
          </button>
        </div>
      )}
    </div>
  );
}
