"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Cliente, Trabajo, Presupuesto } from "@/lib/types";

// ── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toISOString();
}

// ── types ────────────────────────────────────────────────────────────────────

interface AppState {
  clientes: Cliente[];
  trabajos: Trabajo[];
  presupuestos: Presupuesto[];
}

interface AppContextValue extends AppState {
  // Clientes
  addCliente: (data: Omit<Cliente, "id" | "creadoEn">) => void;
  updateCliente: (id: string, data: Partial<Omit<Cliente, "id" | "creadoEn">>) => void;
  deleteCliente: (id: string) => void;
  // Trabajos
  addTrabajo: (data: Omit<Trabajo, "id" | "creadoEn">) => void;
  updateTrabajo: (id: string, data: Partial<Omit<Trabajo, "id" | "creadoEn">>) => void;
  deleteTrabajo: (id: string) => void;
  // Presupuestos
  addPresupuesto: (data: Omit<Presupuesto, "id" | "creadoEn">) => void;
  updatePresupuesto: (id: string, data: Partial<Omit<Presupuesto, "id" | "creadoEn">>) => void;
  deletePresupuesto: (id: string) => void;
}

// ── seed data ────────────────────────────────────────────────────────────────

const SEED_CLIENTES: Cliente[] = [
  {
    id: "c1",
    nombre: "Manuel García",
    telefono: "612 345 678",
    direccion: "Calle Mayor 12, Madrid",
    notas: "Prefiere contacto por WhatsApp",
    creadoEn: "2025-01-10T09:00:00.000Z",
  },
  {
    id: "c2",
    nombre: "Lucía Martín",
    telefono: "699 876 543",
    direccion: "Av. del Sol 8, Sevilla",
    notas: "",
    creadoEn: "2025-02-05T10:30:00.000Z",
  },
];

const SEED_TRABAJOS: Trabajo[] = [
  {
    id: "t1",
    clienteId: "c1",
    descripcion: "Ventana corredera aluminio 150×120",
    medidas: "150 cm × 120 cm",
    precio: 480,
    fecha: "2025-03-01",
    notas: "Perfil gris antracita",
    estado: "en_fabricacion",
    estadoCobro: "pendiente",
    creadoEn: "2025-03-01T08:00:00.000Z",
  },
  {
    id: "t2",
    clienteId: "c2",
    descripcion: "Puerta de aluminio exterior",
    medidas: "90 cm × 210 cm",
    precio: 950,
    fecha: "2025-03-15",
    notas: "",
    estado: "pendiente",
    estadoCobro: "pendiente",
    creadoEn: "2025-03-15T09:15:00.000Z",
  },
];

const SEED_PRESUPUESTOS: Presupuesto[] = [
  {
    id: "p1",
    clienteId: "c1",
    descripcion: "Celosías aluminio terraza",
    importe: 1200,
    fecha: "2025-04-01",
    notas: "Medidas pendientes de confirmar",
    estado: "enviado",
    creadoEn: "2025-04-01T11:00:00.000Z",
  },
];

// ── context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(SEED_CLIENTES);
  const [trabajos, setTrabajos] = useState<Trabajo[]>(SEED_TRABAJOS);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(SEED_PRESUPUESTOS);

  // ── clientes ──────────────────────────────────────────────────────────────

  const addCliente = useCallback(
    (data: Omit<Cliente, "id" | "creadoEn">) =>
      setClientes((prev) => [...prev, { ...data, id: uid(), creadoEn: now() }]),
    []
  );

  const updateCliente = useCallback(
    (id: string, data: Partial<Omit<Cliente, "id" | "creadoEn">>) =>
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      ),
    []
  );

  const deleteCliente = useCallback(
    (id: string) => setClientes((prev) => prev.filter((c) => c.id !== id)),
    []
  );

  // ── trabajos ──────────────────────────────────────────────────────────────

  const addTrabajo = useCallback(
    (data: Omit<Trabajo, "id" | "creadoEn">) =>
      setTrabajos((prev) => [...prev, { ...data, id: uid(), creadoEn: now() }]),
    []
  );

  const updateTrabajo = useCallback(
    (id: string, data: Partial<Omit<Trabajo, "id" | "creadoEn">>) =>
      setTrabajos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      ),
    []
  );

  const deleteTrabajo = useCallback(
    (id: string) => setTrabajos((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  // ── presupuestos ──────────────────────────────────────────────────────────

  const addPresupuesto = useCallback(
    (data: Omit<Presupuesto, "id" | "creadoEn">) =>
      setPresupuestos((prev) => [...prev, { ...data, id: uid(), creadoEn: now() }]),
    []
  );

  const updatePresupuesto = useCallback(
    (id: string, data: Partial<Omit<Presupuesto, "id" | "creadoEn">>) =>
      setPresupuestos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      ),
    []
  );

  const deletePresupuesto = useCallback(
    (id: string) => setPresupuestos((prev) => prev.filter((p) => p.id !== id)),
    []
  );

  return (
    <AppContext.Provider
      value={{
        clientes,
        trabajos,
        presupuestos,
        addCliente,
        updateCliente,
        deleteCliente,
        addTrabajo,
        updateTrabajo,
        deleteTrabajo,
        addPresupuesto,
        updatePresupuesto,
        deletePresupuesto,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
