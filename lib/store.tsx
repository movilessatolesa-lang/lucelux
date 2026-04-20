"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Cliente, Trabajo, Presupuesto, Material, PlantillaPresupuesto, Usuario, HistorialEntrada } from "@/lib/types";
import { obtenerUsuarioActual, crearUsariosDemo } from "@/lib/auth";
import { generarHitosSeguimientoDefecto } from "@/lib/presupuesto-utils";

// ── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toISOString();
}

// ── types ────────────────────────────────────────────────────────────────────

interface AppState {
  usuarioActual: Usuario | null;
  clientes: Cliente[];
  trabajos: Trabajo[];
  presupuestos: Presupuesto[];
  materiales: Material[];
  plantillas: PlantillaPresupuesto[];
  historial: HistorialEntrada[];
}

interface AppContextValue extends AppState {
  // Usuario
  setUsuarioActual: (usuario: Usuario | null) => void;
  
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
  
  // Materiales
  getMateriales: () => Material[];
  addMaterial: (data: Omit<Material, "id">) => void;
  updateMaterial: (id: string, data: Partial<Omit<Material, "id">>) => void;
  deleteMaterial: (id: string) => void;
  
  // Plantillas
  getPlantillas: () => PlantillaPresupuesto[];
  addPlantilla: (data: Omit<PlantillaPresupuesto, "id" | "creadoEn">) => void;
  updatePlantilla: (id: string, data: Partial<Omit<PlantillaPresupuesto, "id" | "creadoEn">>) => void;
  deletePlantilla: (id: string) => void;
  
  
  // Historial
  getHistorial: () => HistorialEntrada[];
}

// ── seed data ────────────────────────────────────────────────────────────────

const DEMO_USUARIO_ID = "usr_demo_001";

const SEED_MATERIALES: Material[] = [
  // Marcos
  { id: "mat1", nombre: "Marco Aluminio Plata 25mm", categoria: "marcos", costeUnitario: 45, unidad: "m" },
  { id: "mat2", nombre: "Marco Aluminio Gris Antracita 25mm", categoria: "marcos", costeUnitario: 48, unidad: "m" },
  { id: "mat3", nombre: "Marco Aluminio Negro 30mm", categoria: "marcos", costeUnitario: 52, unidad: "m" },
  // Vidrio
  { id: "mat4", nombre: "Vidrio Templado 6mm", categoria: "vidrio", costeUnitario: 20, unidad: "m²" },
  { id: "mat5", nombre: "Vidrio Templado 8mm", categoria: "vidrio", costeUnitario: 25, unidad: "m²" },
  { id: "mat6", nombre: "Vidrio Aislante 4+4+6mm", categoria: "vidrio", costeUnitario: 35, unidad: "m²" },
  // Accesorios
  { id: "mat7", nombre: "Cierre Magnético", categoria: "accesorios", costeUnitario: 8.5, unidad: "ud" },
  { id: "mat8", nombre: "Bisagra Aluminio", categoria: "accesorios", costeUnitario: 12, unidad: "ud" },
  { id: "mat9", nombre: "Manilla Cromada", categoria: "accesorios", costeUnitario: 6.5, unidad: "ud" },
  // Mano de obra
  { id: "mat10", nombre: "Mano de obra por metro", categoria: "mano_de_obra", costeUnitario: 25, unidad: "h" },
  { id: "mat11", nombre: "Instalación puerta", categoria: "mano_de_obra", costeUnitario: 80, unidad: "ud" },
];

const SEED_CLIENTES: Cliente[] = [
  {
    id: "c1",
    usuarioId: DEMO_USUARIO_ID,
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
    usuarioId: DEMO_USUARIO_ID,
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
    usuarioId: DEMO_USUARIO_ID,
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
    usuarioId: DEMO_USUARIO_ID,
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
  {
    id: "c5",
    usuarioId: DEMO_USUARIO_ID,
    nombre: "Carlos Rodríguez Martínez",
    telefono: "665 432 109",
    email: "crodriguez@outlook.com",
    direccion: "Calle Príncipe 25, 3ºC",
    ciudad: "Barcelona",
    codigoPostal: "08001",
    tipo: "particular",
    dniNif: "45678901C",
    notas: "Proyecto reforma integral. Presupuestos amplios.",
    tags: ["reforma", "VIP"],
    recurrente: false,
    problematico: false,
    creadoEn: "2025-04-05T11:00:00.000Z",
  },
  {
    id: "c6",
    usuarioId: DEMO_USUARIO_ID,
    nombre: "Inmobiliaria Plaza Central",
    telefono: "933 456 789",
    email: "gestoria@plazacentral.com",
    direccion: "Paseo de Gracia 50, 12ª planta",
    ciudad: "Barcelona",
    codigoPostal: "08007",
    tipo: "empresa",
    dniNif: "A87654321",
    notas: "Presupuestos para múltiples propiedades. Contactar con Directora.",
    tags: ["empresa", "múltiples"],
    recurrente: true,
    problematico: false,
    creadoEn: "2025-03-15T14:30:00.000Z",
  },
  {
    id: "c7",
    usuarioId: DEMO_USUARIO_ID,
    nombre: "María Isabel Gómez García",
    telefono: "644 333 222",
    email: "migarcia2024@gmail.com",
    direccion: "Av. Andrés Blas 18, átic",
    ciudad: "Valencia",
    codigoPostal: "46003",
    tipo: "particular",
    dniNif: "98765432D",
    notas: "Pendiente de confirmación de presupuesto de ventanas.",
    tags: ["pendiente"],
    recurrente: false,
    problematico: false,
    creadoEn: "2025-04-08T09:30:00.000Z",
  },
  // ── Cliente demo (portal cliente) ────────────────────────────────────────
  {
    id: "cli_demo_001",
    usuarioId: "usr_cliente_demo_001",
    nombre: "Cliente Demo",
    telefono: "600 000 000",
    email: "cliente@demo.com",
    direccion: "Calle Falsa 123",
    ciudad: "Madrid",
    codigoPostal: "28000",
    tipo: "particular",
    dniNif: "00000000A",
    notas: "Cliente de pruebas para el portal de cliente.",
    tags: ["demo"],
    recurrente: false,
    problematico: false,
    creadoEn: "2026-01-01T09:00:00.000Z",
  },
];

const SEED_TRABAJOS: Trabajo[] = [
  {
    id: "t1",
    usuarioId: DEMO_USUARIO_ID,
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
    usuarioId: DEMO_USUARIO_ID,
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
    id: "t4",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c5",
    descripcion: "Carpintería aluminio reforma integral",
    medidas: "Múltiples medidas",
    precio: 3500,
    adelanto: 1750,
    fechaAdelanto: "2025-04-06",
    metodoPagoAdelanto: "transferencia",
    fecha: "2025-05-10",
    notas: "Reforma completa de ventanas y puertas. Incluye instalación.",
    estado: "pendiente",
    estadoCobro: "adelanto_recibido",
    creadoEn: "2025-04-06T10:00:00.000Z",
  },
  {
    id: "t5",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c6",
    descripcion: "Cerramientos cristal 3 locales",
    medidas: "Según plano",
    precio: 5200,
    adelanto: 2600,
    fechaAdelanto: "2025-04-03",
    metodoPagoAdelanto: "transferencia",
    fecha: "2025-04-25",
    notas: "Proyecto para 3 locales comerciales en Barcelona.",
    estado: "en_fabricacion",
    estadoCobro: "adelanto_recibido",
    creadoEn: "2025-04-03T09:15:00.000Z",
  },
  {
    id: "t6",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c7",
    descripcion: "Ventanas corredera ático con protección solar",
    medidas: "180 cm × 90 cm",
    precio: 890,
    adelanto: 0,
    fechaAdelanto: "",
    metodoPagoAdelanto: "",
    fecha: "2025-05-15",
    notas: "Pendiente de aprobación del cliente. Incluye instalación.",
    estado: "pendiente",
    estadoCobro: "sin_adelanto",
    creadoEn: "2025-04-08T14:20:00.000Z",
  },
];

const SEED_PRESUPUESTOS: Presupuesto[] = [
  {
    id: "p1",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c1",
    titulo: "Celosías aluminio terraza",
    descripcion: "Celosías para terraza exterior",
    lineas: [
      {
        id: "lin1",
        materialId: "mat1",
        nombre: "Marco Aluminio Plata 25mm",
        cantidad: 10,
        unidad: "m",
        medidas: "2.5m × 1.5m",
        costeUnitario: 45,
        margenPorcentaje: 30,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin2",
        materialId: "mat4",
        nombre: "Vidrio Templado 6mm",
        cantidad: 3.75,
        unidad: "m²",
        medidas: "2.5m × 1.5m",
        costeUnitario: 20,
        margenPorcentaje: 30,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
    ],
    fecha: "2025-04-01",
    fechaVencimiento: "2025-05-01",
    estado: "enviado",
    subtotalLineas: 2077.5,
    descuentoGlobal: 0,
    subtotalConDescuento: 2077.5,
    ivaGlobal: 21,
    totalIva: 436.28,
    importeTotal: 2513.78,
    estadoFirma: "pendiente",
    porcentajeAdelanto: 50,
    notas: "Medidas pendientes de confirmar",
    creadoEn: "2025-04-01T11:00:00.000Z",
  },
  {
    id: "p2",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c1",
    titulo: "Persiana motorizada dormitorio",
    descripcion: "Persiana con motor reversible",
    lineas: [
      {
        id: "lin3",
        nombre: "Persiana Motorizada 1.2m × 1m",
        cantidad: 1,
        unidad: "ud",
        medidas: "1.2m × 1m",
        costeUnitario: 200,
        margenPorcentaje: 40,
        descuentoLinea: 20,
        ivaLinea: 21,
      },
    ],
    fecha: "2025-02-10",
    fechaVencimiento: "2025-03-10",
    estado: "aceptado",
    subtotalLineas: 280,
    descuentoGlobal: 0,
    subtotalConDescuento: 280,
    ivaGlobal: 21,
    totalIva: 58.8,
    importeTotal: 338.8,
    estadoFirma: "aceptado",
    fechaFirma: "2025-02-12T10:00:00.000Z",
    porcentajeAdelanto: 50,
    notas: "",
    seguimiento: [
      {
        id: "seg1",
        estado: "aceptado",
        descripcion: "Presupuesto aceptado por el cliente",
        fecha: "2025-02-12",
        completado: true,
        notas: "Cliente confirmó la aceptación",
      },
      {
        id: "seg2",
        estado: "pendiente_material",
        descripcion: "Esperando disponibilidad de materiales",
        completado: true,
        notas: "Motor en stock, vidrio en taller",
      },
      {
        id: "seg3",
        estado: "material_disponible",
        descripcion: "Todos los materiales disponibles",
        fecha: "2025-02-20",
        completado: true,
      },
      {
        id: "seg4",
        estado: "en_fabricacion",
        descripcion: "Fabricación en proceso",
        fecha: "2025-02-21",
        completado: true,
        notas: "Corte y curvado completado",
      },
      {
        id: "seg5",
        estado: "fabricacion_lista",
        descripcion: "Fabricación terminada",
        fecha: "2025-02-28",
        completado: true,
      },
      {
        id: "seg6",
        estado: "pendiente_cita",
        descripcion: "Pendiente confirmar cita de instalación",
        completado: false,
        notas: "Se enviará propuesta de fechas disponibles",
      },
      {
        id: "seg7",
        estado: "cita_confirmada",
        descripcion: "Cita de instalación confirmada",
        completado: false,
      },
      {
        id: "seg8",
        estado: "en_instalacion",
        descripcion: "Instalación en curso",
        completado: false,
      },
      {
        id: "seg9",
        estado: "entregado",
        descripcion: "Obra finalizada y entregada",
        completado: false,
      },
    ],
    creadoEn: "2025-02-10T09:00:00.000Z",
  },
  {
    id: "p3",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c5",
    titulo: "Reforma integral de carpintería - Presupuesto",
    descripcion: "Reformas de todas las ventanas y puertas de la vivienda",
    lineas: [
      {
        id: "lin4",
        materialId: "mat1",
        nombre: "Marco Aluminio Gris Antracita 30mm",
        cantidad: 25,
        unidad: "m",
        medidas: "Múltiples tamaños",
        costeUnitario: 55,
        margenPorcentaje: 35,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin5",
        materialId: "mat4",
        nombre: "Vidrio Templado Doble 6+6mm",
        cantidad: 12,
        unidad: "m²",
        medidas: "Según medidas",
        costeUnitario: 35,
        margenPorcentaje: 35,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin6",
        materialId: "mat6",
        nombre: "Cierres y accesorios",
        cantidad: 1,
        unidad: "ud",
        medidas: "Juego completo",
        costeUnitario: 400,
        margenPorcentaje: 40,
        descuentoLinea: 50,
        ivaLinea: 21,
      },
      {
        id: "lin7",
        materialId: "mat10",
        nombre: "Instalación",
        cantidad: 16,
        unidad: "h",
        medidas: "Incluye limpieza",
        costeUnitario: 45,
        margenPorcentaje: 30,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
    ],
    fecha: "2025-04-05",
    fechaVencimiento: "2025-05-05",
    estado: "enviado",
    subtotalLineas: 3978.75,
    descuentoGlobal: 100,
    subtotalConDescuento: 3878.75,
    ivaGlobal: 21,
    totalIva: 814.54,
    importeTotal: 4693.29,
    estadoFirma: "pendiente",
    porcentajeAdelanto: 50,
    notas: "Presupuesto válido por 30 días. Incluye demolición de sistema anterior.",
    creadoEn: "2025-04-05T13:00:00.000Z",
  },
  {
    id: "p4",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c6",
    titulo: "Cerramientos cristal locales comerciales",
    descripcion: "Cerramientos para 3 locales comerciales en Barcelona",
    lineas: [
      {
        id: "lin8",
        materialId: "mat1",
        nombre: "Perfil Aluminio Plata 35mm",
        cantidad: 40,
        unidad: "m",
        medidas: "Para 3 locales",
        costeUnitario: 65,
        margenPorcentaje: 32,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin9",
        materialId: "mat5",
        nombre: "Vidrio de Seguridad Laminado 8mm",
        cantidad: 18,
        unidad: "m²",
        medidas: "Vidrio de seguridad",
        costeUnitario: 45,
        margenPorcentaje: 32,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin10",
        materialId: "mat10",
        nombre: "Instalación profesional",
        cantidad: 24,
        unidad: "h",
        medidas: "Incluye remates y limpieza",
        costeUnitario: 50,
        margenPorcentaje: 25,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
    ],
    fecha: "2025-04-02",
    fechaVencimiento: "2025-05-02",
    estado: "borrador",
    subtotalLineas: 5383.5,
    descuentoGlobal: 250,
    subtotalConDescuento: 5133.5,
    ivaGlobal: 21,
    totalIva: 1078.04,
    importeTotal: 6211.54,
    estadoFirma: "pendiente",
    porcentajeAdelanto: 50,
    notas: "Borrador pendiente de confirmación de medidas finales.",
    creadoEn: "2025-04-02T10:30:00.000Z",
  },
  {
    id: "p5",
    usuarioId: DEMO_USUARIO_ID,
    clienteId: "c7",
    titulo: "Ventanas corredera con protección solar",
    descripcion: "Ventanas para ático con control solar integrado",
    lineas: [
      {
        id: "lin11",
        materialId: "mat1",
        nombre: "Marco Aluminio Gris Plata 25mm",
        cantidad: 6,
        unidad: "m",
        medidas: "3 ventanas × 2m cada una",
        costeUnitario: 50,
        margenPorcentaje: 33,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin12",
        materialId: "mat4",
        nombre: "Vidrio Templado Control Solar",
        cantidad: 3,
        unidad: "m²",
        medidas: "Con cristal tintado",
        costeUnitario: 60,
        margenPorcentaje: 33,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "lin13",
        materialId: "mat10",
        nombre: "Instalación con garantía",
        cantidad: 4,
        unidad: "h",
        medidas: "Incluye pruebas",
        costeUnitario: 50,
        margenPorcentaje: 30,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
    ],
    fecha: "2025-04-08",
    fechaVencimiento: "2025-05-08",
    estado: "borrador",
    subtotalLineas: 905.25,
    descuentoGlobal: 0,
    subtotalConDescuento: 905.25,
    ivaGlobal: 21,
    totalIva: 190.10,
    importeTotal: 1095.35,
    estadoFirma: "pendiente",
    porcentajeAdelanto: 50,
    notas: "Cliente solicitó opciones con control solar. Presupuesto a la espera de confirmación.",
    creadoEn: "2025-04-08T15:45:00.000Z",
  },
  // ── Presupuesto demo (portal cliente) ────────────────────────────────────
  {
    id: "presu_demo_001",
    usuarioId: "usr_cliente_demo_001",
    clienteId: "cli_demo_001",
    titulo: "Ventana corredera aluminio + persiana motorizada",
    descripcion: "Instalación de ventana corredera de aluminio con cristal Climalit 4+12+4, persiana motorizada y retirada de ventana antigua. Incluye transporte y limpieza.",
    lineas: [
      {
        id: "pdlin1",
        nombre: "Ventana corredera aluminio 120×100 cm",
        cantidad: 1,
        unidad: "ud",
        medidas: "120×100 cm",
        costeUnitario: 300,
        margenPorcentaje: 30,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "pdlin2",
        nombre: "Persiana motorizada 120×100 cm",
        cantidad: 1,
        unidad: "ud",
        medidas: "120×100 cm",
        costeUnitario: 120,
        margenPorcentaje: 25,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
      {
        id: "pdlin3",
        nombre: "Instalación, retirada y limpieza",
        cantidad: 1,
        unidad: "serv",
        medidas: "",
        costeUnitario: 80,
        margenPorcentaje: 20,
        descuentoLinea: 0,
        ivaLinea: 21,
      },
    ],
    fecha: "2026-04-19",
    fechaVencimiento: "2026-12-31",
    estado: "enviado",
    subtotalLineas: 500,
    descuentoGlobal: 0,
    subtotalConDescuento: 500,
    ivaGlobal: 21,
    totalIva: 105,
    importeTotal: 605,
    estadoFirma: "pendiente",
    porcentajeAdelanto: 50,
    notas: "Presupuesto de prueba para el portal de cliente. Puedes firmar, pagar y ver el seguimiento.",
    seguimiento: [
      { id: "pdseg1", estado: "aceptado", descripcion: "Presupuesto aceptado por el cliente", fecha: "", completado: false, notas: "Pendiente de firma del cliente." },
      { id: "pdseg2", estado: "pendiente_material", descripcion: "Esperando disponibilidad de materiales", completado: false },
      { id: "pdseg3", estado: "material_disponible", descripcion: "Materiales disponibles en taller", completado: false },
      { id: "pdseg4", estado: "en_fabricacion", descripcion: "Fabricación en proceso", completado: false },
      { id: "pdseg5", estado: "fabricacion_lista", descripcion: "Fabricación terminada", completado: false },
      { id: "pdseg6", estado: "pendiente_cita", descripcion: "Pendiente de confirmar cita de instalación", completado: false },
      { id: "pdseg7", estado: "cita_confirmada", descripcion: "Cita de instalación confirmada", completado: false },
      { id: "pdseg8", estado: "en_instalacion", descripcion: "Instalación en curso", completado: false },
      { id: "pdseg9", estado: "entregado", descripcion: "Obra finalizada y entregada", completado: false },
    ],
    creadoEn: "2026-04-19T09:00:00.000Z",
  },
];

// ── context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => {
    return obtenerUsuarioActual();
  });

  // Inicializar estados: primero intenta cargar de localStorage, si no hay datos, usa SEED
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    if (typeof window === "undefined") return SEED_CLIENTES;
    const guardados = localStorage.getItem("lucelux_clientes");
    return guardados ? JSON.parse(guardados) : SEED_CLIENTES;
  });

  const [trabajos, setTrabajos] = useState<Trabajo[]>(() => {
    if (typeof window === "undefined") return SEED_TRABAJOS;
    const guardados = localStorage.getItem("lucelux_trabajos");
    return guardados ? JSON.parse(guardados) : SEED_TRABAJOS;
  });

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => {
    if (typeof window === "undefined") return SEED_PRESUPUESTOS;
    const guardados = localStorage.getItem("lucelux_presupuestos");
    return guardados ? JSON.parse(guardados) : SEED_PRESUPUESTOS;
  });

  const [materiales, setMateriales] = useState<Material[]>(() => {
    if (typeof window === "undefined") return SEED_MATERIALES;
    const guardados = localStorage.getItem("lucelux_materiales");
    return guardados ? JSON.parse(guardados) : SEED_MATERIALES;
  });

  const [plantillas, setPlantillas] = useState<PlantillaPresupuesto[]>(() => {
    if (typeof window === "undefined") return [];
    const guardados = localStorage.getItem("lucelux_plantillas");
    return guardados ? JSON.parse(guardados) : [];
  });

  const [historial, setHistorial] = useState<HistorialEntrada[]>(() => {
    if (typeof window === "undefined") return [];
    const guardados = localStorage.getItem("lucelux_historial");
    return guardados ? JSON.parse(guardados) : [];
  });

  // Sincronizar clientes con localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lucelux_clientes", JSON.stringify(clientes));
    }
  }, [clientes]);

  // Sincronizar trabajos con localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lucelux_trabajos", JSON.stringify(trabajos));
    }
  }, [trabajos]);

  // Sincronizar presupuestos con localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lucelux_presupuestos", JSON.stringify(presupuestos));
    }
  }, [presupuestos]);

  // Sincronizar materiales con localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lucelux_materiales", JSON.stringify(materiales));
    }
  }, [materiales]);

  // Sincronizar plantillas con localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lucelux_plantillas", JSON.stringify(plantillas));
    }
  }, [plantillas]);

  // Sincronizar historial con localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lucelux_historial", JSON.stringify(historial));
    }
  }, [historial]);

  // Inicializar usuarios demo y admin al montar
  useEffect(() => {
    crearUsariosDemo();

    // Garantizar que el cliente demo siempre existe en clientes
    setClientes((prev) => {
      if (prev.find((c) => c.id === "cli_demo_001")) return prev;
      const demoCliente = SEED_CLIENTES.find((c) => c.id === "cli_demo_001");
      return demoCliente ? [...prev, demoCliente] : prev;
    });

    // Garantizar que el presupuesto demo siempre existe
    setPresupuestos((prev) => {
      if (prev.find((p) => p.id === "presu_demo_001")) return prev;
      const demoPresu = SEED_PRESUPUESTOS.find((p) => p.id === "presu_demo_001");
      return demoPresu ? [...prev, demoPresu] : prev;
    });
  }, []);

  // Escuchar cambios de sesión en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const usuarioActualizado = obtenerUsuarioActual();
      setUsuarioActual(usuarioActualizado);
    };

    // Escuchar cambios en el storage
    window.addEventListener("storage", handleStorageChange);

    // También revisar periódicamente (para cambios en la misma pestaña)
    const interval = setInterval(() => {
      const usuarioActualizado = obtenerUsuarioActual();
      if (usuarioActualizado?.id !== usuarioActual?.id) {
        setUsuarioActual(usuarioActualizado);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [usuarioActual?.id]);

  // Registrar en historial
  const registrarHistorial = useCallback(
    (
      tipo: HistorialEntrada["tipo"],
      entidadId: string,
      entidadNombre: string,
      accion: HistorialEntrada["accion"],
      cambios?: HistorialEntrada["cambios"]
    ) => {
      if (!usuarioActual) return;
      
      const entrada: HistorialEntrada = {
        id: uid(),
        usuarioId: usuarioActual.id,
        tipo,
        entidadId,
        entidadNombre,
        accion,
        cambios,
        creadoEn: now(),
      };
      
      setHistorial((prev) => [entrada, ...prev]);
    },
    [usuarioActual]
  );

  // ── clientes ──────────────────────────────────────────────────────────────

  const addCliente = useCallback(
    (data: Omit<Cliente, "id" | "creadoEn">) => {
      if (!usuarioActual) return;
      const nuevoCliente = { ...data, id: uid(), usuarioId: usuarioActual.id, creadoEn: now() };
      setClientes((prev) => [...prev, nuevoCliente]);
      registrarHistorial("cliente", nuevoCliente.id, nuevoCliente.nombre, "crear");
    },
    [usuarioActual, registrarHistorial]
  );

  const updateCliente = useCallback(
    (id: string, data: Partial<Omit<Cliente, "id" | "creadoEn">>) => {
      const clienteAnterior = clientes.find((c) => c.id === id);
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      if (clienteAnterior) {
        registrarHistorial("cliente", id, data.nombre || clienteAnterior.nombre, "actualizar", {
          nombre: { anterior: clienteAnterior.nombre, nuevo: data.nombre },
          email: { anterior: clienteAnterior.email, nuevo: data.email },
        });
      }
    },
    [clientes, registrarHistorial]
  );

  const deleteCliente = useCallback(
    (id: string) => {
      const cliente = clientes.find((c) => c.id === id);
      setClientes((prev) => prev.filter((c) => c.id !== id));
      if (cliente) {
        registrarHistorial("cliente", id, cliente.nombre, "eliminar");
      }
    },
    [clientes, registrarHistorial]
  );

  // ── trabajos ──────────────────────────────────────────────────────────────

  const addTrabajo = useCallback(
    (data: Omit<Trabajo, "id" | "creadoEn">) => {
      if (!usuarioActual) return;
      const nuevoTrabajo = { ...data, id: uid(), usuarioId: usuarioActual.id, creadoEn: now() };
      setTrabajos((prev) => [...prev, nuevoTrabajo]);
      registrarHistorial("trabajo", nuevoTrabajo.id, nuevoTrabajo.descripcion, "crear");
    },
    [usuarioActual, registrarHistorial]
  );

  const updateTrabajo = useCallback(
    (id: string, data: Partial<Omit<Trabajo, "id" | "creadoEn">>) => {
      const trabajoAnterior = trabajos.find((t) => t.id === id);
      setTrabajos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      if (trabajoAnterior) {
        registrarHistorial("trabajo", id, data.descripcion || trabajoAnterior.descripcion, "actualizar");
      }
    },
    [trabajos, registrarHistorial]
  );

  const deleteTrabajo = useCallback(
    (id: string) => {
      const trabajo = trabajos.find((t) => t.id === id);
      setTrabajos((prev) => prev.filter((t) => t.id !== id));
      if (trabajo) {
        registrarHistorial("trabajo", id, trabajo.descripcion, "eliminar");
      }
    },
    [trabajos, registrarHistorial]
  );

  // ── presupuestos ──────────────────────────────────────────────────────────

  const addPresupuesto = useCallback(
    (data: Omit<Presupuesto, "id" | "creadoEn">) => {
      if (!usuarioActual) return;
      const nuevoPresupuesto = { ...data, id: uid(), usuarioId: usuarioActual.id, creadoEn: now() };
      setPresupuestos((prev) => [...prev, nuevoPresupuesto]);
      registrarHistorial("presupuesto", nuevoPresupuesto.id, nuevoPresupuesto.titulo, "crear");
    },
    [usuarioActual, registrarHistorial]
  );

  const updatePresupuesto = useCallback(
    (id: string, data: Partial<Omit<Presupuesto, "id" | "creadoEn">>) => {
      const presupuestoAnterior = presupuestos.find((p) => p.id === id);
      
      // Si se marca como aceptado y no tiene seguimiento, generar hitos automáticamente
      let dataFinal = data;
      if (data.estadoFirma === "aceptado" && presupuestoAnterior && !presupuestoAnterior.seguimiento?.length) {
        dataFinal = {
          ...data,
          seguimiento: generarHitosSeguimientoDefecto(),
        };
      }
      
      setPresupuestos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...dataFinal } : p))
      );
      if (presupuestoAnterior) {
        registrarHistorial("presupuesto", id, data.titulo || presupuestoAnterior.titulo, "actualizar", {
          estado: { anterior: presupuestoAnterior.estado, nuevo: data.estado },
          estadoFirma: { anterior: presupuestoAnterior.estadoFirma, nuevo: data.estadoFirma },
        });
      }
    },
    [presupuestos, registrarHistorial]
  );

  const deletePresupuesto = useCallback(
    (id: string) => {
      const presupuesto = presupuestos.find((p) => p.id === id);
      setPresupuestos((prev) => prev.filter((p) => p.id !== id));
      if (presupuesto) {
        registrarHistorial("presupuesto", id, presupuesto.titulo, "eliminar");
      }
    },
    [presupuestos, registrarHistorial]
  );

  // ── materiales ────────────────────────────────────────────────────────────

  const getMateriales = useCallback(() => materiales, [materiales]);

  const addMaterial = useCallback(
    (data: Omit<Material, "id">) =>
      setMateriales((prev) => [...prev, { ...data, id: uid() }]),
    []
  );

  const updateMaterial = useCallback(
    (id: string, data: Partial<Omit<Material, "id">>) =>
      setMateriales((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data } : m))
      ),
    []
  );

  const deleteMaterial = useCallback(
    (id: string) => setMateriales((prev) => prev.filter((m) => m.id !== id)),
    []
  );

  // ── plantillas ────────────────────────────────────────────────────────────

  const getPlantillas = useCallback(() => plantillas, [plantillas]);

  const addPlantilla = useCallback(
    (data: Omit<PlantillaPresupuesto, "id" | "creadoEn">) => {
      if (!usuarioActual) return;
      const nuevoPlantilla = { ...data, id: uid(), creadoEn: now() };
      setPlantillas((prev) => [...prev, nuevoPlantilla]);
      registrarHistorial("plantilla", nuevoPlantilla.id, nuevoPlantilla.nombre, "crear");
    },
    [usuarioActual, registrarHistorial]
  );

  const updatePlantilla = useCallback(
    (id: string, data: Partial<Omit<PlantillaPresupuesto, "id" | "creadoEn">>) =>
      setPlantillas((prev) =>
        prev.map((pl) => (pl.id === id ? { ...pl, ...data } : pl))
      ),
    []
  );

  const deletePlantilla = useCallback(
    (id: string) => setPlantillas((prev) => prev.filter((pl) => pl.id !== id)),
    []
  );

  // ── historial ─────────────────────────────────────────────────────────────

  const getHistorial = useCallback(() => {
    if (!usuarioActual) return [];
    return historial.filter((h) => h.usuarioId === usuarioActual.id).slice(0, 50);
  }, [historial, usuarioActual]);

  return (
    <AppContext.Provider
      value={{
        usuarioActual,
        clientes: clientes.filter((c) => c.usuarioId === usuarioActual?.id),
        trabajos: trabajos.filter((t) => t.usuarioId === usuarioActual?.id),
        presupuestos: presupuestos.filter((p) => p.usuarioId === usuarioActual?.id),
        materiales,
        plantillas,
        historial,
        setUsuarioActual,
        addCliente,
        updateCliente,
        deleteCliente,
        addTrabajo,
        updateTrabajo,
        deleteTrabajo,
        addPresupuesto,
        updatePresupuesto,
        deletePresupuesto,
        getMateriales,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        getPlantillas,
        addPlantilla,
        updatePlantilla,
        deletePlantilla,
        getHistorial,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * Resetear todos los datos a los seed originales
 * Limpia localStorage y recarga la página
 */
export function resetearDatosDemo(): void {
  if (typeof window === "undefined") return;
  
  // Limpiar localStorage completamente
  localStorage.removeItem("lucelux_clientes");
  localStorage.removeItem("lucelux_trabajos");
  localStorage.removeItem("lucelux_presupuestos");
  localStorage.removeItem("lucelux_materiales");
  localStorage.removeItem("lucelux_plantillas");
  localStorage.removeItem("lucelux_historial");
  
  // Recargar página para reinicializar con datos seed
  window.location.reload();
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
