"use client";

import { useState } from "react";
import type { Cliente, TipoCliente } from "@/lib/types";

const EMPTY: Omit<Cliente, "id" | "creadoEn"> = {
  usuarioId: "",
  nombre: "",
  telefono: "",
  email: "",
  direccion: "",
  ciudad: "",
  codigoPostal: "",
  tipo: "particular",
  dniNif: "",
  notas: "",
  tags: [],
  recurrente: false,
  problematico: false,
};

const inputCls =
  "w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4]";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

interface Props {
  initial?: Cliente;
  onSave: (data: Omit<Cliente, "id" | "creadoEn">) => void;
  onCancel: () => void;
}

export function ClienteForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<Cliente, "id" | "creadoEn">>(
    initial
      ? {
          usuarioId: initial.usuarioId,
          nombre: initial.nombre,
          telefono: initial.telefono,
          email: initial.email ?? "",
          direccion: initial.direccion,
          ciudad: initial.ciudad ?? "",
          codigoPostal: initial.codigoPostal ?? "",
          tipo: initial.tipo ?? "particular",
          dniNif: initial.dniNif ?? "",
          notas: initial.notas,
          tags: initial.tags ?? [],
          recurrente: initial.recurrente ?? false,
          problematico: initial.problematico ?? false,
        }
      : EMPTY
  );
  const [tagInput, setTagInput] = useState("");

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    set("tags", form.tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo */}
      <div>
        <label className={labelCls}>Tipo de cliente</label>
        <div className="flex gap-3">
          {(["particular", "empresa"] as TipoCliente[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("tipo", t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                form.tipo === t
                  ? "bg-[#1558d4] text-white border-[#1558d4]"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {t === "particular" ? "👤 Particular" : "🏢 Empresa"}
            </button>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className={labelCls}>Nombre / Razón social *</label>
        <input
          required
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          className={inputCls}
          placeholder={form.tipo === "empresa" ? "Empresa S.L." : "Nombre completo"}
        />
      </div>

      {/* Teléfono + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Teléfono</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
            className={inputCls}
            placeholder="612 345 678"
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
            placeholder="correo@ejemplo.com"
          />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className={labelCls}>Dirección</label>
        <input
          value={form.direccion}
          onChange={(e) => set("direccion", e.target.value)}
          className={inputCls}
          placeholder="Calle, número, piso"
        />
      </div>

      {/* Ciudad + CP */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Ciudad</label>
          <input
            value={form.ciudad}
            onChange={(e) => set("ciudad", e.target.value)}
            className={inputCls}
            placeholder="Madrid"
          />
        </div>
        <div>
          <label className={labelCls}>Código postal</label>
          <input
            value={form.codigoPostal}
            onChange={(e) => set("codigoPostal", e.target.value)}
            className={inputCls}
            placeholder="28001"
          />
        </div>
      </div>

      {/* DNI/NIF */}
      <div>
        <label className={labelCls}>DNI / NIF / CIF</label>
        <input
          value={form.dniNif}
          onChange={(e) => set("dniNif", e.target.value)}
          className={inputCls}
          placeholder="12345678A / B12345678"
        />
      </div>

      {/* Flags */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => set("recurrente", !form.recurrente)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${
            form.recurrente
              ? "bg-green-50 text-green-700 border-green-300"
              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
          }`}
        >
          ♻️ Recurrente
        </button>
        <button
          type="button"
          onClick={() => set("problematico", !form.problematico)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${
            form.problematico
              ? "bg-red-50 text-red-700 border-red-300"
              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
          }`}
        >
          ⚠️ Problemático
        </button>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Etiquetas</label>
        {form.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-slate-400 hover:text-slate-700 leading-none ml-0.5"
                  aria-label={`Eliminar etiqueta ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className={inputCls + " flex-1"}
            placeholder="ej. VIP, obra, urgente…"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={labelCls}>Notas internas</label>
        <textarea
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          rows={3}
          className={inputCls + " resize-none"}
          placeholder="Observaciones, preferencias, forma de pago..."
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {initial ? "Guardar cambios" : "Crear cliente"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-base"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}


