"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSuscripcion, type Suscripcion } from "@/lib/suscripcion";

interface Miembro {
  id: string;
  usuarioId: string;
  nombre: string;
  email: string;
  rol: "admin" | "miembro";
  invitadoEn: string;
}

export default function EquipoPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [emailInvitar, setEmailInvitar] = useState("");
  const [invitando, setInvitando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const sus = await getSuscripcion();
    setSuscripcion(sus);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar el equipo del usuario (como owner)
    const { data: equipo } = await supabase
      .from("equipos")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!equipo) {
      setCargando(false);
      return;
    }

    // Cargar miembros
    const { data: miembrosData } = await supabase
      .from("miembros_equipo")
      .select("id, usuario_id, rol, invitado_en")
      .eq("equipo_id", equipo.id);

    if (!miembrosData) { setCargando(false); return; }

    // Enriquecer con datos de perfiles
    const ids = miembrosData.map((m) => m.usuario_id);
    const { data: perfiles } = await supabase
      .from("perfiles")
      .select("id, nombre")
      .in("id", ids);

    const lista: Miembro[] = miembrosData.map((m) => {
      const p = perfiles?.find((p) => p.id === m.usuario_id);
      return {
        id: m.id,
        usuarioId: m.usuario_id,
        nombre: p?.nombre ?? "—",
        email: "—",
        rol: m.rol,
        invitadoEn: m.invitado_en,
      };
    });

    setMiembros(lista);
    setCargando(false);
  }

  async function handleInvitar(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInvitar.trim()) return;

    setInvitando(true);
    setError(null);
    setMensajeExito(null);

    const resp = await fetch("/api/equipo/invitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInvitar.trim() }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      setError(json.error ?? "Error al enviar la invitación");
    } else {
      setMensajeExito(`Invitación enviada a ${emailInvitar}`);
      setEmailInvitar("");
      cargarDatos();
    }
    setInvitando(false);
  }

  async function handleEliminar(miembroId: string) {
    setEliminando(miembroId);
    const supabase = createClient();
    await supabase.from("miembros_equipo").delete().eq("id", miembroId);
    setMiembros((prev) => prev.filter((m) => m.id !== miembroId));
    setEliminando(null);
  }

  const esBusiness = suscripcion?.plan === "business";
  const maxMiembros = 4; // máx 4 invitados + el owner = 5

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Equipo</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gestiona los usuarios de tu empresa</p>
      </div>

      {/* Aviso si no es Business */}
      {!esBusiness && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-semibold text-purple-800 text-sm">Función exclusiva del plan Business</p>
              <p className="text-purple-600 text-sm mt-1">
                Invita hasta 4 colaboradores para que trabajen contigo en la misma cuenta.
              </p>
              <a
                href="/pricing"
                className="inline-block mt-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Ver planes →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Formulario invitar */}
      {esBusiness && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3">Invitar miembro</h2>

          {mensajeExito && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✓ {mensajeExito}
            </div>
          )}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {miembros.length >= maxMiembros ? (
            <p className="text-amber-600 text-sm">Has alcanzado el límite de {maxMiembros} miembros.</p>
          ) : (
            <form onSubmit={handleInvitar} className="flex gap-2">
              <input
                type="email"
                value={emailInvitar}
                onChange={(e) => setEmailInvitar(e.target.value)}
                placeholder="email@colaborador.com"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={invitando}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {invitando ? "..." : "Invitar"}
              </button>
            </form>
          )}
          <p className="text-xs text-slate-400 mt-2">
            El colaborador recibirá un email para crear su cuenta y accederá a todos tus datos.
          </p>
        </div>
      )}

      {/* Lista de miembros */}
      {cargando ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : miembros.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No tienes miembros en tu equipo todavía.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Miembros ({miembros.length}/{maxMiembros})
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {miembros.map((m) => (
              <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{m.nombre}</p>
                  <p className="text-xs text-slate-400">
                    {m.rol === "admin" ? "🔑 Admin" : "👤 Miembro"} · desde{" "}
                    {new Date(m.invitadoEn).toLocaleDateString("es-ES")}
                  </p>
                </div>
                {esBusiness && (
                  <button
                    onClick={() => handleEliminar(m.id)}
                    disabled={eliminando === m.id}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {eliminando === m.id ? "..." : "Eliminar"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
