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
    nombre: "Manuel García López",
    telefono: "612 345 678",
    email: "mgarcia@gmail.com",
    direccion: "Calle Mayor 12, 2ºB",
    ciudad: "Madrid",
    codigoPostal: "28001",
    tipo: "particular",
    dniNif: "12345678A",
    notas: "Prefiere contacto por WhatsApp. Puntual con los pagos.",
    tags: ["VIP", "urgente"],
    recurrente: true,
    problematico: false,
    creadoEn: "2025-01-10T09:00:00.000Z",
  },
  {
    id: "c2",
    nombre: "Lucía Martín Ruiz",
    telefono: "699 876 543",
    email: "lucia.martin@hotmail.com",
    direccion: "Av. del Sol 8, 4ºA",
    ciudad: "Sevilla",
    codigoPostal: "41001",
    tipo: "particular",
    dniNif: "87654321B",
    notas: "Suele pedir descuentos. Aclarar precios desde el principio.",
    tags: ["descuento"],
    recurrente: false,
    problematico: true,
    creadoEn: "2025-02-05T10:30:00.000Z",
  },
  {
    id: "c3",
    nombre: "Construcciones Hermanos Vega S.L.",
    telefono: "914 567 890",
    email: "info@vega-construcciones.es",
    direccion: "Polígono Industrial Norte, Nave 7",
    ciudad: "Toledo",
    codigoPostal: "45001",
    tipo: "empresa",
    dniNif: "B12345678",
    notas: "Pagan a 30 días. Hablar siempre con Paco.",
    tags: ["empresa", "obra"],
    recurrente: true,
    problematico: false,
    creadoEn: "2024-11-20T08:00:00.000Z",
  },
  {
    id: "c4",
    nombre: "Rosa Fernández Díaz",
    telefono: "678 901 234",
    email: "",
    direccion: "C/ Rosal 3",
    ciudad: "Granada",
    codigoPostal: "18001",
    tipo: "particular",
    dniNif: "",
    notas: "",
    tags: [],
    recurrente: false,
    problematico: false,
    creadoEn: "2025-04-01T09:00:00.000Z",
  },
];

const SEED_TRABAJOS: Trabajo[] = [
  {
    id: "t1",
    clienteId: "c1",
    descripcion: "Ventana corredera aluminio 150×120",
    medidas: "150 cm × 120 cm",
    precio: 480,
    adelanto: 150,
    fechaAdelanto: "2025-02-28",
    metodoPagoAdelanto: "transferencia",
    fecha: "2025-03-01",
    notas: "Perfil gris antracita",
    estado: "en_fabricacion",
    estadoCobro: "adelanto_recibido",
    creadoEn: "2025-03-01T08:00:00.000Z",
  },
  {
    id: "t3",
    clienteId: "c1",
    descripcion: "Puerta balconera aluminio",
    medidas: "80 cm × 200 cm",
    precio: 720,
    adelanto: 720,
    fechaAdelanto: "2025-01-15",
    metodoPagoAdelanto: "transferencia",
    fecha: "2025-01-20",
    notas: "",
    estado: "terminado",
    estadoCobro: "pagado",
    creadoEn: "2025-01-20T08:00:00.000Z",
  },
  {
    id: "t2",
    clienteId: "c2",
    descripcion: "Puerta de aluminio exterior",
    medidas: "90 cm × 210 cm",
    precio: 950,
    adelanto: 0,
    fechaAdelanto: "",
    metodoPagoAdelanto: "",
    fecha: "2025-03-15",
    notas: "",
    estado: "pendiente",
    estadoCobro: "sin_adelanto",
    creadoEn: "2025-03-15T09:15:00.000Z",
  },
  {
    id: "t4",
    clienteId: "c3",
    descripcion: "Celosías aluminio fachada bloque A",
    medidas: "10 m × 3 m",
    precio: 4800,
    adelanto: 2000,
    fechaAdelanto: "2025-01-10",
    metodoPagoAdelanto: "transferencia",
    fecha: "2025-01-15",
    notas: "Obra nueva polígono",
    estado: "terminado",
    estadoCobro: "parcial",
    creadoEn: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "t5",
    clienteId: "c3",
    descripcion: "Ventanas oficina bloque B — 12 uds.",
    medidas: "120×100 cm c/u",
    precio: 3200,
    adelanto: 0,
    fechaAdelanto: "",
    metodoPagoAdelanto: "",
    fecha: "2025-03-01",
    notas: "Entrega urgente",
    estado: "en_fabricacion",
    estadoCobro: "sin_adelanto",
    creadoEn: "2025-03-01T08:00:00.000Z",
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
  {
    id: "p2",
    clienteId: "c1",
    descripcion: "Persiana motorizada dormitorio",
    importe: 340,
    fecha: "2025-02-10",
    notas: "",
    estado: "aceptado",
    creadoEn: "2025-02-10T09:00:00.000Z",
  },
  {
    id: "p3",
    clienteId: "c2",
    descripcion: "Ventana doble hoja aluminio",
    importe: 580,
    fecha: "2025-03-20",
    notas: "",
    estado: "rechazado",
    creadoEn: "2025-03-20T10:00:00.000Z",
  },
  {
    id: "p4",
    clienteId: "c3",
    descripcion: "Lucernario aluminio bloque C",
    importe: 8500,
    fecha: "2025-04-05",
    notas: "Pendiente aprobación dirección",
    estado: "enviado",
    creadoEn: "2025-04-05T11:00:00.000Z",
  },
  {
    id: "p5",
    clienteId: "c3",
    descripcion: "Mamparas baño — 3 uds.",
    importe: 1800,
    fecha: "2025-04-10",
    notas: "Borrador inicial",
    estado: "borrador",
    creadoEn: "2025-04-10T09:00:00.000Z",
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
