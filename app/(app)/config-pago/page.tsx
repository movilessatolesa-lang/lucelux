"use client";

import { useState, useEffect } from "react";
import { getConfigPago, saveConfigPago, type ConfigPago } from "@/lib/config-pago";

const EMPTY: ConfigPago = {
  bizumNumero: "",
  bizumNombre: "",
  iban: "",
  titular: "",
  banco: "",
  concepto: "Adelanto presupuesto",
  telefono: "",
};

const inp = "w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1558d4] bg-white";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

export default function ConfigPagoPage() {
  const [form, setForm] = useState<ConfigPago>(EMPTY);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    setForm(getConfigPago());
  }, []);

  function set<K extends keyof ConfigPago>(k: K, v: ConfigPago[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setGuardado(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveConfigPago(form);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  const tieneBizum = !!form.bizumNumero;
  const tieneIban = !!form.iban;
  const importeEjemplo = 1500;
  const adelantoEjemplo = importeEjemplo * 0.5;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración de pagos</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Estos datos aparecerán en el enlace del cliente cuando acepte un presupuesto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bizum */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#00D4AA]/15 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">Bizum</h2>
          </div>

          <div>
            <label className={lbl}>Número de Bizum</label>
            <input
              type="tel"
              value={form.bizumNumero}
              onChange={(e) => set("bizumNumero", e.target.value)}
              className={inp}
              placeholder="ej: 612 345 678"
            />
          </div>
          <div>
            <label className={lbl}>Nombre a mostrar</label>
            <input
              type="text"
              value={form.bizumNombre}
              onChange={(e) => set("bizumNombre", e.target.value)}
              className={inp}
              placeholder="ej: Juan García - LUCELUX"
            />
          </div>
        </div>

        {/* Transferencia */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1558d4" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">Transferencia bancaria</h2>
          </div>

          <div>
            <label className={lbl}>IBAN</label>
            <input
              type="text"
              value={form.iban}
              onChange={(e) => set("iban", e.target.value.toUpperCase())}
              className={`${inp} font-mono tracking-wider`}
              placeholder="ej: ES91 2100 0418 4502 0005 1332"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Titular de la cuenta</label>
              <input
                type="text"
                value={form.titular}
                onChange={(e) => set("titular", e.target.value)}
                className={inp}
                placeholder="ej: Juan García García"
              />
            </div>
            <div>
              <label className={lbl}>Banco</label>
              <input
                type="text"
                value={form.banco}
                onChange={(e) => set("banco", e.target.value)}
                className={inp}
                placeholder="ej: CaixaBank"
              />
            </div>
          </div>
        </div>

        {/* General */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">General</h2>

          <div>
            <label className={lbl}>Concepto base de pago</label>
            <input
              type="text"
              value={form.concepto}
              onChange={(e) => set("concepto", e.target.value)}
              className={inp}
              placeholder="ej: Adelanto presupuesto"
            />
            <p className="text-xs text-slate-400 mt-1">
              Se combinará con el título del presupuesto. Ej: &ldquo;Adelanto presupuesto – Ventanas cocina&rdquo;
            </p>
          </div>

          <div>
            <label className={lbl}>Teléfono de contacto</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              className={inp}
              placeholder="ej: 612 345 678"
            />
            <p className="text-xs text-slate-400 mt-1">Se muestra al cliente para resolver dudas sobre el pago.</p>
          </div>
        </div>

        {/* Preview */}
        {(tieneBizum || tieneIban) && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
            <p className="text-sm font-semibold text-emerald-800">Vista previa — lo que verá el cliente</p>
            <p className="text-xs text-emerald-700">
              Para un presupuesto de ejemplo de{" "}
              <strong>{importeEjemplo.toLocaleString("es-ES")} €</strong>{" "}
              con 50% de adelanto, el cliente verá un importe a pagar de{" "}
              <strong className="text-emerald-900">{adelantoEjemplo.toLocaleString("es-ES")} €</strong>.
            </p>
            {tieneBizum && (
              <p className="text-xs text-emerald-700">
                📱 Bizum al <strong>{form.bizumNumero}</strong>
                {form.bizumNombre ? ` · ${form.bizumNombre}` : ""}
              </p>
            )}
            {tieneIban && (
              <p className="text-xs text-emerald-700">
                🏦 Transferencia a <strong className="font-mono">{form.iban}</strong>
                {form.titular ? ` · ${form.titular}` : ""}
              </p>
            )}
          </div>
        )}

        {!tieneBizum && !tieneIban && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            ⚠️ Añade al menos un método de pago (Bizum o IBAN) para que aparezca el bloque de pago en el enlace del cliente.
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#1558d4] hover:bg-[#0e46b8] text-white font-semibold py-4 rounded-xl transition-colors text-base"
        >
          {guardado ? "✓ Guardado correctamente" : "Guardar configuración"}
        </button>
      </form>
    </div>
  );
}
