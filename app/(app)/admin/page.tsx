"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Tipo devuelto por /api/admin/usuarios
type EmpresaStats = {
  id: string;
  nombre: string;
  email: string;
  empresa: string;
  onboarding_completado: boolean;
  creado_en: string;
  suscripcion: {
    plan: string;
    estado: string;
    trial_fin: string;
  } | null;
};

function diasRestantes(fechaFin: string): number {
  const diff = new Date(fechaFin).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function badgePlan(plan: string, estado: string, trialFin: string) {
  if (plan === "business") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Business</span>;
  if (plan === "pro") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Pro</span>;
  if (plan === "trial") {
    const dias = diasRestantes(trialFin);
    if (dias > 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Trial · {dias}d</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Trial expirado</span>;
  }
  if (estado === "cancelado") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Cancelado</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">{plan}</span>;
}

export default function AdminPage() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<EmpresaStats[]>([]);
  const [cargando, setCargando] = useState(true);
  const [acceso, setAcceso] = useState<"comprobando" | "ok" | "denegado">("comprobando");
  const [busqueda, setBusqueda] = useState("");
  const [extendiendo, setExtendiendo] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("es_superadmin")
        .eq("id", user.id)
        .single();

      if (!perfil?.es_superadmin) { setAcceso("denegado"); setCargando(false); return; }
      setAcceso("ok");

      // Cargar datos via API route (usa service role)
      const resp = await fetch("/api/admin/usuarios");
      if (!resp.ok) { setAcceso("denegado"); setCargando(false); return; }
      const lista: EmpresaStats[] = await resp.json();

      setEmpresas(lista);
      setCargando(false);
    }
    cargar();
  }, [router]);

  async function extenderTrial(usuarioId: string) {
    setExtendiendo(usuarioId);
    const supabase = createClient();
    const nuevaFin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("suscripciones")
      .update({ trial_fin: nuevaFin, estado: "activo", plan: "trial" })
      .eq("usuario_id", usuarioId);
    setEmpresas((prev) =>
      prev.map((e) =>
        e.id === usuarioId && e.suscripcion
          ? { ...e, suscripcion: { ...e.suscripcion, trial_fin: nuevaFin, estado: "activo" } }
          : e
      )
    );
    setExtendiendo(null);
  }

  const filtradas = empresas.filter(
    (e) =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.empresa.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalActivos = empresas.filter(
    (e) => e.suscripcion && (e.suscripcion.plan !== "trial" || diasRestantes(e.suscripcion.trial_fin) > 0)
  ).length;
  const totalPagando = empresas.filter(
    (e) => e.suscripcion && (e.suscripcion.plan === "pro" || e.suscripcion.plan === "business")
  ).length;
  const totalTrial = empresas.filter(
    (e) => e.suscripcion?.plan === "trial" && diasRestantes(e.suscripcion.trial_fin) > 0
  ).length;
  const totalExpirado = empresas.filter(
    (e) => e.suscripcion?.plan === "trial" && diasRestantes(e.suscripcion.trial_fin) === 0
  ).length;

  if (acceso === "comprobando") {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  if (acceso === "denegado") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-slate-900">Acceso denegado</h1>
        <p className="text-slate-500 mt-2">Solo los superadmins pueden acceder a este panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel Superadmin</h1>
        <p className="text-slate-500 text-sm mt-0.5">Vista global de todas las empresas registradas</p>
      </div>

      {/* Stats */}
      {!cargando && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total empresas", value: empresas.length, color: "text-slate-800" },
            { label: "Acceso activo", value: totalActivos, color: "text-green-600" },
            { label: "Trial activo", value: totalTrial, color: "text-amber-600" },
            { label: "Pagando", value: totalPagando, color: "text-blue-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email o empresa..."
          className="w-full max-w-sm px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Empresa / Usuario</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Plan</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Onboarding</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Registro</th>
                <th className="text-right px-4 py-3 text-slate-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No hay resultados</td></tr>
              ) : (
                filtradas.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{e.empresa !== "—" ? e.empresa : e.nombre}</p>
                      <p className="text-xs text-slate-400">{e.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {e.suscripcion
                        ? badgePlan(e.suscripcion.plan, e.suscripcion.estado, e.suscripcion.trial_fin)
                        : <span className="text-slate-400 text-xs">Sin suscripción</span>}
                    </td>
                    <td className="px-4 py-3">
                      {e.onboarding_completado
                        ? <span className="text-green-600 text-xs font-medium">✓ Completado</span>
                        : <span className="text-amber-600 text-xs font-medium">⏳ Pendiente</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(e.creado_en).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.suscripcion && (
                        <button
                          onClick={() => extenderTrial(e.id)}
                          disabled={extendiendo === e.id}
                          className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {extendiendo === e.id ? "..." : "+30 días"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalExpirado > 0 && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-100 text-xs text-red-600">
              ⚠️ {totalExpirado} empresa{totalExpirado > 1 ? "s" : ""} con trial expirado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
