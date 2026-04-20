// Configuración de métodos de pago de la empresa
// Se guarda en localStorage bajo "lucelux_config_pago"

export interface ConfigPago {
  bizumNumero: string;       // ej: "612 345 678"
  bizumNombre: string;       // ej: "Juan García - LUCELUX"
  iban: string;              // ej: "ES91 2100 0418 4502 0005 1332"
  titular: string;           // titular de la cuenta
  banco: string;             // nombre del banco
  concepto: string;          // texto sugerido para la transferencia
  telefono: string;          // teléfono empresa para consultas
}

const KEY = "lucelux_config_pago";

const DEFAULT: ConfigPago = {
  bizumNumero: "",
  bizumNombre: "",
  iban: "",
  titular: "",
  banco: "",
  concepto: "Adelanto presupuesto",
  telefono: "",
};

export function getConfigPago(): ConfigPago {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function saveConfigPago(cfg: ConfigPago): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cfg));
}
