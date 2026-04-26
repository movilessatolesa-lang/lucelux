"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PASOS = ["Tu empresa", "Configuración", "¡Listo!"];

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1 — datos empresa
  const [nombre, setNombre] = useState("");
  const [nif, setNif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [iban, setIban] = useState("");

  // Paso 2 — configuración
  const [ivaDefault, setIvaDefault] = useState("21");
  const [adelantoDefault, setAdelantoDefault] = useState("30");
  const [diasVencimiento, setDiasVencimiento] = useState("30");

  async function handlePaso1(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre de empresa es obligatorio"); return; }
    setError(null);
    setPaso(1);
  }

  async function handlePaso2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Guardar configuracion_empresa
      await supabase.from("configuracion_empresa").upsert({
        usuario_id: user.id,
        nombre_empresa: nombre.trim(),
        dni_nif: nif.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        iban: iban.trim(),
        iva_global_predeterminado: parseFloat(ivaDefault) || 21,
        porcentaje_adelanto: parseFloat(adelantoDefault) || 30,
        dias_vencimiento_presupuesto: parseInt(diasVencimiento) || 30,
        dias_vencimiento_factura: 15,
        numero_factura_actual: 1,
      }, { onConflict: "usuario_id" });

      // Marcar onboarding como completado
      await supabase
        .from("perfiles")
        .update({ onboarding_completado: true })
        .eq("id", user.id);

      setPaso(2);
    } catch {
      setError("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function handleFinalizar() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">LUCELUX</h1>
          <p className="text-slate-400 text-sm">Configuración inicial</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {PASOS.map((p, i) => (
            <div key={p} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < paso
                    ? "bg-green-500 text-white"
                    : i === paso
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {i < paso ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${i === paso ? "text-white" : "text-slate-500"}`}>{p}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ── PASO 0: Datos empresa ── */}
          {paso === 0 && (
            <form onSubmit={handlePaso1} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Datos de tu empresa</h2>
                <p className="text-sm text-slate-500">Aparecerán en tus presupuestos y facturas.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre empresa *</label>
                  <input
                    value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lucelux Carpintería de Aluminio"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIF / CIF</label>
                  <input
                    value={nif} onChange={(e) => setNif(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="B12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="empresa@email.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                  <input
                    value={direccion} onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Calle, número"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                  <input
                    value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Barcelona"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">IBAN (cobros)</label>
                  <input
                    value={iban} onChange={(e) => setIban(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ES12 3456 7890..."
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Continuar →
              </button>
            </form>
          )}

          {/* ── PASO 1: Configuración ── */}
          {paso === 1 && (
            <form onSubmit={handlePaso2} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Configuración por defecto</h2>
                <p className="text-sm text-slate-500">Puedes cambiarlos en cualquier momento desde Configuración.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IVA por defecto (%)</label>
                <select
                  value={ivaDefault} onChange={(e) => setIvaDefault(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="21">21% — IVA general</option>
                  <option value="10">10% — IVA reducido</option>
                  <option value="4">4% — IVA superreducido</option>
                  <option value="0">0% — Exento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adelanto por defecto (%)</label>
                <div className="relative">
                  <input
                    type="number" min="0" max="100"
                    value={adelantoDefault} onChange={(e) => setAdelantoDefault(e.target.value)}
                    className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Porcentaje que solicitas al aceptar un presupuesto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Validez presupuestos (días)</label>
                <input
                  type="number" min="1" max="365"
                  value={diasVencimiento} onChange={(e) => setDiasVencimiento(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(0)}
                  className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Finalizar →"}
                </button>
              </div>
            </form>
          )}

          {/* ── PASO 2: Bienvenida ── */}
          {paso === 2 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Bienvenido a Lucelux!</h2>
                <p className="text-slate-500 text-sm">
                  Tu cuenta está configurada. Tienes <strong>30 días</strong> de acceso completo gratuito.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-semibold text-blue-800">¿Qué puedes hacer ahora?</p>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>✓ Añadir tus clientes</li>
                  <li>✓ Crear presupuestos con firma digital</li>
                  <li>✓ Hacer seguimiento de obras</li>
                  <li>✓ Emitir facturas en PDF</li>
                  <li>✓ Automatizar mensajes WhatsApp</li>
                </ul>
              </div>

              <button
                onClick={handleFinalizar}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Ir al Dashboard →
              </button>

              <p className="text-xs text-slate-400">
                Al finalizar el período de prueba puedes contratar un plan desde{" "}
                <a href="/pricing" className="text-blue-600 underline">aquí</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
