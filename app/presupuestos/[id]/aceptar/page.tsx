"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useSearchParams } from "next/navigation";

export default function AceptarPresupuestoPage({
  params,
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { presupuestos, clientes, updatePresupuesto } = useApp();
  const [estado, setEstado] = useState<"cargando" | "valido" | "invalido" | "aceptado" | "error">(
    "cargando"
  );

  const presupuesto = presupuestos.find((p) => p.id === params.id);
  const cliente = presupuesto ? clientes.find((c) => c.id === presupuesto.clienteId) : null;

  useEffect(() => {
    // Validar token
    if (!token || !presupuesto || presupuesto.urlFirma !== token) {
      setEstado("invalido");
      return;
    }

    // Verificar si ya fue aceptado
    if (presupuesto.estadoFirma === "aceptado") {
      setEstado("aceptado");
      return;
    }

    setEstado("valido");
  }, [token, presupuesto]);

  const handleAceptar = () => {
    if (!presupuesto) return;

    try {
      updatePresupuesto(presupuesto.id, {
        estadoFirma: "aceptado",
        fechaFirma: new Date().toISOString(),
        estado: "aceptado",
      });
      setEstado("aceptado");
    } catch (error) {
      console.error("Error aceptando presupuesto:", error);
      setEstado("error");
    }
  };

  if (estado === "cargando") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
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
            El enlace de aceptación no es válido o ha expirado. Por favor, contacta con el vendedor
            para obtener un nuevo presupuesto.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }

  if (estado === "aceptado") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4 animate-bounce">✓</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">¡Presupuesto Aceptado!</h1>
          <p className="text-slate-600 mb-2">
            Presupuesto ID: <strong>{presupuesto?.id}</strong>
          </p>
          {presupuesto?.fechaFirma && (
            <p className="text-slate-600 mb-4 text-sm">
              Aceptado el:{" "}
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
            Gracias por aceptar nuestro presupuesto. Nos pondremos en contacto pronto para confirmar
            los detalles de los trabajos.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Ir al inicio
          </a>
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
            Hubo un error al procesar tu aceptación. Por favor, intenta de nuevo más tarde.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Ir al inicio
          </a>
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
          <p className="text-slate-600">
            Revisa los detalles antes de aceptar
          </p>
        </div>

        {presupuesto && cliente && (
          <div className="space-y-6">
            {/* Cliente */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-2">Información del Cliente</h2>
              <p className="text-slate-600">
                <span className="font-medium">{cliente.nombre}</span>
              </p>
              <p className="text-sm text-slate-500">{cliente.ciudad}, {cliente.codigoPostal}</p>
            </div>

            {/* Presupuesto */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-900 mb-4">Detalles del Presupuesto</h2>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-slate-600">Referencia</p>
                  <p className="font-semibold text-slate-900">{presupuesto.id}</p>
                </div>
                <div>
                  <p className="text-slate-600">Materiales</p>
                  <p className="font-semibold text-slate-900">{presupuesto.lineas.length} líneas</p>
                </div>
                <div>
                  <p className="text-slate-600">Fecha</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(presupuesto.fecha).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Vencimiento</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(presupuesto.fechaVencimiento).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            </div>

            {/* Importe */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-900">Importe Total:</span>
                <span className="text-3xl font-bold text-blue-600">
                  €{presupuesto.importeTotal.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">IVA incluido ({presupuesto.ivaGlobal}%)</p>
            </div>

            {/* Aviso legal */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">⚠️ Importante:</span> Al aceptar este presupuesto,
                confirmas que has revisado todos los detalles y autorizas el inicio de los trabajos
                según lo presupuestado.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <a
                href="/"
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-center"
              >
                Cancelar
              </a>
              <button
                onClick={handleAceptar}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
              >
                ✓ Aceptar Presupuesto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
