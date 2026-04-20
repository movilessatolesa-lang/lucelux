"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import type { Presupuesto, Cliente } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPresupuesto(row: any): Presupuesto {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    clienteId: row.cliente_id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? "",
    lineas: row.lineas ?? [],
    fecha: row.fecha,
    fechaVencimiento: row.fecha_vencimiento ?? "",
    estado: row.estado,
    subtotalLineas: Number(row.subtotal_lineas ?? 0),
    descuentoGlobal: Number(row.descuento_global ?? 0),
    subtotalConDescuento: Number(row.subtotal_con_descuento ?? 0),
    ivaGlobal: Number(row.iva_global ?? 21),
    totalIva: Number(row.total_iva ?? 0),
    importeTotal: Number(row.importe_total ?? 0),
    urlFirma: row.url_firma ?? undefined,
    estadoFirma: row.estado_firma ?? "pendiente",
    fechaFirma: row.fecha_firma ?? undefined,
    porcentajeAdelanto: Number(row.porcentaje_adelanto ?? 0),
    seguimiento: row.seguimiento ?? [],
    notas: row.notas ?? "",
    creadoEn: row.creado_en,
    modificadoEn: row.modificado_en ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCliente(row: any): Cliente {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombre: row.nombre,
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    direccion: row.direccion ?? "",
    ciudad: row.ciudad ?? "",
    codigoPostal: row.codigo_postal ?? "",
    tipo: row.tipo ?? "particular",
    dniNif: row.dni_nif ?? "",
    notas: row.notas ?? "",
    tags: row.tags ?? [],
    recurrente: row.recurrente ?? false,
    problematico: row.problematico ?? false,
    creadoEn: row.creado_en,
  };
}

export default function AceptarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [estado, setEstado] = useState<"cargando" | "valido" | "invalido" | "aceptado" | "error">("cargando");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!token) {
      setEstado("invalido");
      return;
    }

    async function cargar() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("id", id)
        .eq("url_firma", token)
        .single();

      if (error || !data) {
        setEstado("invalido");
        return;
      }

      const p = mapPresupuesto(data);
      setPresupuesto(p);

      const { data: clienteData } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", p.clienteId)
        .single();

      if (clienteData) setCliente(mapCliente(clienteData));

      if (p.estadoFirma === "aceptado") {
        setEstado("aceptado");
      } else {
        setEstado("valido");
      }
    }

    cargar();
  }, [id, token]);

  const handleAceptar = async () => {
    if (!presupuesto || !token) return;
    setGuardando(true);
    const supabase = createClient();
    const ahora = new Date().toISOString();
    const { error } = await supabase
      .from("presupuestos")
      .update({ estado_firma: "aceptado", fecha_firma: ahora, estado: "aceptado" })
      .eq("url_firma", token);

    if (error) {
      setEstado("error");
    } else {
      setPresupuesto({ ...presupuesto, estadoFirma: "aceptado", fechaFirma: ahora, estado: "aceptado" });
      setEstado("aceptado");
    }
    setGuardando(false);
  };

  if (estado === "cargando") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (estado === "invalido") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Enlace Inválido</h1>
          <p className="text-slate-600 mb-4">
            El enlace de aceptación no es válido o ha expirado. Contacta con el vendedor para obtener un nuevo enlace.
          </p>
          <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (estado === "aceptado") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">¡Presupuesto Aceptado!</h1>
          {presupuesto?.fechaFirma && (
            <p className="text-slate-600 mb-4 text-sm">
              Aceptado el{" "}
              <strong>
                {new Date(presupuesto.fechaFirma).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </p>
          )}
          <p className="text-slate-600 mb-6">
            Gracias por aceptar el presupuesto. Nos pondremos en contacto pronto para confirmar los detalles.
          </p>
          <Link href="/" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600 mb-4">
            Hubo un error al procesar tu aceptación. Por favor intenta de nuevo más tarde.
          </p>
          <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Estado: válido
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Aceptar Presupuesto</h1>
          <p className="text-slate-600">Revisa los detalles antes de aceptar</p>
        </div>

        {presupuesto && cliente && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-2">Cliente</h2>
              <p className="font-medium text-slate-900">{cliente.nombre}</p>
              {cliente.ciudad && <p className="text-sm text-slate-500">{cliente.ciudad}{cliente.codigoPostal ? `, ${cliente.codigoPostal}` : ""}</p>}
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-4">{presupuesto.titulo}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Fecha</p>
                  <p className="font-semibold">{new Date(presupuesto.fecha).toLocaleDateString("es-ES")}</p>
                </div>
                {presupuesto.fechaVencimiento && (
                  <div>
                    <p className="text-slate-500">Vencimiento</p>
                    <p className="font-semibold">{new Date(presupuesto.fechaVencimiento).toLocaleDateString("es-ES")}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Líneas</p>
                  <p className="font-semibold">{presupuesto.lineas.length} partidas</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-900">Importe Total:</span>
                <span className="text-3xl font-bold text-blue-600">
                  {presupuesto.importeTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">IVA incluido ({presupuesto.ivaGlobal}%)</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">⚠️ Importante:</span> Al aceptar confirmas que has revisado todos los detalles y autorizas el inicio de los trabajos según lo presupuestado.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-center"
              >
                Cancelar
              </Link>
              <button
                onClick={handleAceptar}
                disabled={guardando}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
              >
                {guardando ? "Guardando..." : "✓ Aceptar Presupuesto"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

