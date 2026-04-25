"use client";

import { useEffect, useState } from "react";
import { getConfigPago, type ConfigPago } from "@/lib/config-pago";
import { formatearMoneda } from "@/lib/presupuesto-utils";

interface BloquePagoClienteProps {
  importeTotal: number;
  porcentajeAdelanto: number;
  tituloPresupuesto: string;
  /** Config de pago obtenida de Supabase (página pública del cliente) */
  configOverride?: ConfigPago | null;
}

function copiar(texto: string, setCopied: (k: string) => void, key: string) {
  navigator.clipboard.writeText(texto).then(() => {
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  });
}

export function BloquePagoCliente({
  importeTotal,
  porcentajeAdelanto,
  tituloPresupuesto,
  configOverride,
}: BloquePagoClienteProps) {
  const [cfg, setCfg] = useState<ConfigPago | null>(null);
  const [copiado, setCopiado] = useState("");

  useEffect(() => {
    if (configOverride) {
      setCfg(configOverride);
    } else {
      setCfg(getConfigPago());
    }
  }, [configOverride]);

  if (!cfg) return null;
  if (porcentajeAdelanto === 0) return null;

  const importeAdelanto = importeTotal * (porcentajeAdelanto / 100);
  const tieneBizum = !!cfg.bizumNumero;
  const tieneTransferencia = !!cfg.iban;
  const hayMediosPago = tieneBizum || tieneTransferencia;

  const conceptoSugerido = `${cfg.concepto} – ${tituloPresupuesto}`.slice(0, 140);

  return (
    <div className="rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 space-y-5 shadow-sm">
      {/* Cabecera */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-emerald-900">¡Presupuesto aceptado!</h3>
          <p className="text-sm text-emerald-700">
            Para confirmar y comenzar con su pedido, le pedimos un adelanto del{" "}
            <span className="font-bold">{porcentajeAdelanto}%</span>.
          </p>
        </div>
      </div>

      {/* Importe destacado */}
      <div className="rounded-xl bg-white border border-emerald-200 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Importe a pagar ahora</p>
          <p className="text-3xl font-black text-emerald-700 mt-0.5">
            {formatearMoneda(importeAdelanto)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {porcentajeAdelanto}% del total ({formatearMoneda(importeTotal)})
          </p>
        </div>
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">Puede pagar por cualquiera de estos medios:</p>

        {!hayMediosPago && (
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-1">
            <p className="text-sm text-slate-700 font-medium">📞 Contacte con nosotros</p>
            <p className="text-sm text-slate-500">
              Le facilitaremos los datos de pago por teléfono o mensaje.
            </p>
            {cfg.telefono && (
              <a
                href={`tel:${cfg.telefono}`}
                className="inline-block mt-2 bg-[#1558d4] text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Llamar: {cfg.telefono}
              </a>
            )}
          </div>
        )}

        {/* Bizum */}
        {tieneBizum && (
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-bold text-slate-800">Bizum</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-slate-400">Número</p>
                  <p className="font-bold text-slate-900 text-lg tracking-wide">{cfg.bizumNumero}</p>
                </div>
                <button
                  onClick={() => copiar(cfg.bizumNumero, setCopiado, "bizum")}
                  className="text-xs font-medium text-[#1558d4] bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {copiado === "bizum" ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
              {cfg.bizumNombre && (
                <p className="text-xs text-slate-500 px-1">A nombre de: <span className="font-medium text-slate-700">{cfg.bizumNombre}</span></p>
              )}
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs text-slate-400">Concepto a indicar</p>
                <p className="text-sm font-medium text-slate-700">{conceptoSugerido}</p>
              </div>
              <button
                onClick={() => copiar(conceptoSugerido, setCopiado, "concepto_bizum")}
                className="text-xs font-medium text-[#1558d4] bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors shrink-0"
              >
                {copiado === "concepto_bizum" ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        {/* Transferencia */}
        {tieneTransferencia && (
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1558d4" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <span className="font-bold text-slate-800">Transferencia bancaria</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-slate-400">IBAN</p>
                  <p className="font-mono font-bold text-slate-900 text-sm tracking-wider">{cfg.iban}</p>
                </div>
                <button
                  onClick={() => copiar(cfg.iban.replace(/\s/g, ""), setCopiado, "iban")}
                  className="text-xs font-medium text-[#1558d4] bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors shrink-0"
                >
                  {copiado === "iban" ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
              {cfg.titular && (
                <p className="text-xs text-slate-500 px-1">Titular: <span className="font-medium text-slate-700">{cfg.titular}</span></p>
              )}
              {cfg.banco && (
                <p className="text-xs text-slate-500 px-1">Banco: <span className="font-medium text-slate-700">{cfg.banco}</span></p>
              )}
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-slate-400">Concepto a indicar</p>
                  <p className="text-sm font-medium text-slate-700">{conceptoSugerido}</p>
                </div>
                <button
                  onClick={() => copiar(conceptoSugerido, setCopiado, "concepto_transf")}
                  className="text-xs font-medium text-[#1558d4] bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors shrink-0"
                >
                  {copiado === "concepto_transf" ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contacto */}
      {cfg.telefono && (
        <p className="text-xs text-center text-slate-500">
          ¿Tiene dudas? Llámenos al{" "}
          <a href={`tel:${cfg.telefono}`} className="text-[#1558d4] font-semibold hover:underline">
            {cfg.telefono}
          </a>
        </p>
      )}
    </div>
  );
}
