"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";

interface PresupuestoResumen {
  id: string;
  titulo: string;
  fecha: string;
  estado: string;
  importeTotal: number;
  urlFirma: string | null;
}

export default function ClientePresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { setCargando(false); return; }

      // Buscar el cliente por email del usuario autenticado
      const { data: clienteData } = await supabase
        .from("clientes")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!clienteData) { setCargando(false); return; }

      // Traer sólo los presupuestos de ese cliente
      const { data: rows } = await supabase
        .from("presupuestos")
        .select("id, titulo, fecha, estado, importe_total, url_firma")
        .eq("cliente_id", clienteData.id)
        .order("fecha", { ascending: false });

      setPresupuestos(
        (rows ?? []).map((r) => ({
          id: r.id,
          titulo: r.titulo,
          fecha: r.fecha,
          estado: r.estado,
          importeTotal: Number(r.importe_total ?? 0),
          urlFirma: r.url_firma ?? null,
        }))
      );
      setCargando(false);
    }
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Mis Presupuestos</h1>
      <p className="text-slate-600 mb-8">Consulta el estado de tus presupuestos</p>

      {presupuestos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-500">No hay presupuestos disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {presupuestos.map((p) => (
            <Link
              key={p.id}
              href={`/mis-presupuestos/${p.urlFirma ?? p.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.titulo}</h3>
                  <p className="text-sm text-slate-500">{formatearFecha(p.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatearMoneda(p.importeTotal)}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium capitalize">
                    {p.estado}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
