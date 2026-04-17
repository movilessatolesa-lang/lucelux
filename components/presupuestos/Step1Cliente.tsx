"use client";

import type { Cliente } from "@/lib/types";

interface Step1ClienteProps {
  clientes: Cliente[];
  selectedClienteId: string;
  onClienteSelect: (clienteId: string) => void;
  onNewCliente?: (cliente: Cliente) => void;
}

export function Step1Cliente({
  clientes,
  selectedClienteId,
  onClienteSelect,
}: Step1ClienteProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Paso 1: Seleccionar Cliente</h3>

      <label className="block">
        <span className="text-sm font-medium text-slate-700 mb-2 block">Cliente</span>
        <select
          value={selectedClienteId}
          onChange={(e) => onClienteSelect(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">— Selecciona un cliente —</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre} ({cliente.tipo === "empresa" ? "Empresa" : "Particular"})
            </option>
          ))}
        </select>
      </label>

      {selectedClienteId && clientes.find((c) => c.id === selectedClienteId) && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          {(() => {
            const cliente = clientes.find((c) => c.id === selectedClienteId)!;
            return (
              <>
                <h4 className="font-semibold text-slate-900 mb-2">{cliente.nombre}</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>
                    <span className="font-medium">Teléfono:</span> {cliente.telefono}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {cliente.email || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Ciudad:</span> {cliente.ciudad}
                  </p>
                  {cliente.tags.length > 0 && (
                    <p>
                      <span className="font-medium">Tags:</span>{" "}
                      {cliente.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded mr-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
