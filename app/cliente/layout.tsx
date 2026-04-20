"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

// ── Número de WhatsApp de la empresa ──────────────────────────────────────────
// Formato internacional sin +, sin espacios
const WA_NUMERO = "34624088595";
const WA_MENSAJE = encodeURIComponent(
  "Hola, soy cliente de LUCELUX y necesito ayuda con mi presupuesto."
);
const WA_URL = `https://wa.me/${WA_NUMERO}?text=${WA_MENSAJE}`;

// Páginas donde NO mostrar el botón (ej: login, registro)
const RUTAS_SIN_WHATSAPP = ["/cliente/login", "/cliente/registro"];

export default function ClienteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mostrarWA = !RUTAS_SIN_WHATSAPP.some((r) => pathname.startsWith(r));

  return (
    <div className="min-h-screen relative" style={{ background: "var(--ll-bg, #f1f5f9)" }}>
      {children}

      {/* ── Botón flotante WhatsApp ──────────────────────────────────────── */}
      {mostrarWA && (
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group"
        >
          {/* Tooltip */}
          <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            ¿Necesitas ayuda?
          </span>

          {/* Botón */}
          <div className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 active:scale-95"
            style={{ background: "#25D366" }}>
            {/* WhatsApp official SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 32 32"
              fill="white"
            >
              <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16.003c0 2.355.643 4.657 1.864 6.672L2.667 29.333l6.857-1.802a13.27 13.27 0 0 0 6.479 1.69h.001c7.364 0 13.33-5.97 13.33-13.335 0-3.563-1.387-6.912-3.907-9.432a13.26 13.26 0 0 0-9.424-3.787zm0 24.4a11.06 11.06 0 0 1-5.648-1.551l-.405-.24-4.196 1.104 1.12-4.093-.264-.42A11.06 11.06 0 0 1 4.9 16.003c0-6.12 4.983-11.1 11.103-11.1 2.965 0 5.75 1.156 7.847 3.254A11.04 11.04 0 0 1 27.1 16.003c0 6.12-4.984 11.064-11.097 11.064zm6.09-8.292c-.334-.167-1.975-.975-2.28-1.086-.306-.111-.529-.167-.752.167-.222.334-.862 1.086-1.057 1.308-.195.223-.39.25-.723.084-.334-.167-1.41-.52-2.685-1.658-.992-.885-1.662-1.977-1.857-2.311-.195-.334-.02-.515.147-.681.15-.15.334-.39.501-.585.167-.195.222-.334.334-.557.111-.222.056-.417-.028-.585-.084-.167-.752-1.813-1.03-2.48-.271-.65-.547-.562-.752-.572l-.64-.012c-.222 0-.585.083-.89.417s-1.168 1.141-1.168 2.784 1.196 3.23 1.363 3.453c.167.222 2.353 3.593 5.703 5.04.797.344 1.42.55 1.904.703.8.255 1.528.219 2.104.133.641-.095 1.975-.808 2.254-1.589.278-.78.278-1.449.195-1.589-.084-.138-.306-.222-.64-.389z"/>
            </svg>
          </div>
        </a>
      )}
    </div>
  );
}
