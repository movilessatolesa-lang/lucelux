"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";
import type { Presupuesto, Cliente, QuoteStatus } from "@/lib/types";

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

const ESTADO_COLOR: Record<QuoteStatus, string> = {
  borrador: "bg-slate-100 text-slate-600",
  enviado: "bg-sky-100 text-sky-700",
  aceptado: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-600",
};

const FIRMA_COLOR: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  aceptado: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-600",
};

export default function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("id", id)
        .single();

      if (err || !data) {
        setError("Presupuesto no encontrado");
        setCargando(false);
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
      setCargando(false);
    }

    cargar();
  }, [id]);

  const actualizarEstado = async (nuevoEstado: QuoteStatus) => {
    if (!presupuesto) return;
    setGuardando(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("presupuestos")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (!err) setPresupuesto({ ...presupuesto, estado: nuevoEstado });
    setGuardando(false);
  };

  const enlaceCliente = () => {
    if (typeof window === "undefined" || !presupuesto?.urlFirma) return null;
    return `${window.location.origin}/presupuestos/${presupuesto.urlFirma}/cliente`;
  };

  const waUrl = () => {
    if (!cliente?.telefono || !presupuesto) return null;
    const link = enlaceCliente();
    if (!link) return null;
    const nombre = cliente.nombre.split(" ")[0];
    const importe = formatearMoneda(presupuesto.importeTotal);
    const msg = `Hola ${nombre} 👋, le enviamos desde LUCELUX el presupuesto "${presupuesto.titulo}" por importe de ${importe} (IVA incluido). Puede consultarlo y aceptarlo aquí:\n${link}\n\n¡Gracias!`;
    const tel = cliente.telefono.replace(/\s/g, "");
    const numero = tel.startsWith("+") ? tel : `34${tel}`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !presupuesto) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Presupuesto no encontrado</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/presupuestos" className="text-blue-600 hover:underline text-sm">
          ← Volver a presupuestos
        </Link>
      </div>
    );
  }

  const link = enlaceCliente();
  const wa = waUrl();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{presupuesto.titulo}</h1>
          {presupuesto.descripcion && (
            <p className="text-slate-500 text-sm mt-1">{presupuesto.descripcion}</p>
          )}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[presupuesto.estado]}`}>
              {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${FIRMA_COLOR[presupuesto.estadoFirma ?? "pendiente"]}`}>
              Firma: {presupuesto.estadoFirma ?? "pendiente"}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-slate-900">{formatearMoneda(presupuesto.importeTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">IVA incluido ({presupuesto.ivaGlobal}%)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info básica */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Información</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Cliente</p>
                {cliente ? (
                  <Link href={`/clientes/${cliente.id}`} className="font-medium text-blue-600 hover:underline">
                    {cliente.nombre}
                  </Link>
                ) : (
                  <p className="font-medium text-slate-900">—</p>
                )}
              </div>
              <div>
                <p className="text-slate-500">Fecha</p>
                <p className="font-medium text-slate-900">{formatearFecha(presupuesto.fecha)}</p>
              </div>
              {presupuesto.fechaVencimiento && (
                <div>
                  <p className="text-slate-500">Vencimiento</p>
                  <p className="font-medium text-slate-900">{formatearFecha(presupuesto.fechaVencimiento)}</p>
                </div>
              )}
              {presupuesto.fechaFirma && (
                <div>
                  <p className="text-slate-500">Fecha firma</p>
                  <p className="font-medium text-slate-900">
                    {new Date(presupuesto.fechaFirma).toLocaleDateString("es-ES")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Líneas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-semibold text-slate-900 mb-4">
              Líneas ({presupuesto.lineas.length})
            </h2>
            {presupuesto.lineas.length === 0 ? (
              <p className="text-slate-400 text-sm">Sin líneas</p>
            ) : (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {presupuesto.lineas.map((linea: any, i: number) => (
                  <div key={linea.id ?? i} className="border border-slate-100 rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{linea.nombre}</p>
                        {linea.medidas && (
                          <p className="text-xs text-slate-500 mt-0.5">{linea.medidas}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">
                          {linea.cantidad} {linea.unidad} × {formatearMoneda(linea.costeUnitario)} (coste)
                          {linea.margenPorcentaje > 0 && ` + ${linea.margenPorcentaje}% margen`}
                        </p>
                      </div>
                      {linea.descuentoLinea > 0 && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          -{linea.descuentoLinea}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          {presupuesto.notas && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="font-semibold text-slate-900 mb-2">Notas</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{presupuesto.notas}</p>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          {/* Totales */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2 text-sm">
            <h2 className="font-semibold mb-3">Totales</h2>
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal</span>
              <span>{formatearMoneda(presupuesto.subtotalLineas)}</span>
            </div>
            {presupuesto.descuentoGlobal > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Descuento</span>
                <span>-{formatearMoneda(presupuesto.descuentoGlobal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">IVA ({presupuesto.ivaGlobal}%)</span>
              <span>{formatearMoneda(presupuesto.totalIva)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatearMoneda(presupuesto.importeTotal)}</span>
            </div>
            {presupuesto.porcentajeAdelanto > 0 && (
              <div className="flex justify-between text-amber-300 pt-1">
                <span>Adelanto ({presupuesto.porcentajeAdelanto}%)</span>
                <span>{formatearMoneda(presupuesto.importeTotal * (presupuesto.porcentajeAdelanto / 100))}</span>
              </div>
            )}
          </div>

          {/* Acciones de estado */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-slate-900 mb-3">Cambiar estado</h2>
            {(["borrador", "enviado", "aceptado", "rechazado"] as QuoteStatus[]).map((est) => (
              <button
                key={est}
                onClick={() => actualizarEstado(est)}
                disabled={guardando || presupuesto.estado === est}
                className={`w-full text-sm py-2 rounded-lg font-medium transition-colors ${
                  presupuesto.estado === est
                    ? "bg-slate-100 text-slate-400 cursor-default"
                    : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                {presupuesto.estado === est ? `✓ ${est.charAt(0).toUpperCase() + est.slice(1)}` : est.charAt(0).toUpperCase() + est.slice(1)}
              </button>
            ))}
          </div>

          {/* Enlace cliente */}
          {link && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold text-slate-900">Enlace cliente</h2>
              <input
                readOnly
                value={link}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 break-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="w-full text-sm py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                Copiar enlace
              </button>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-sm py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128c3e] rounded-lg font-medium transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Enviar por WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
