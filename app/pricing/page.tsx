import Link from "next/link";

const WHATSAPP_CONTACTO = "https://wa.me/34600000000?text=Hola%2C%20quiero%20contratar%20el%20plan%20de%20Lucelux%20App";

const PLANES = [
  {
    nombre: "Prueba Gratuita",
    precio: "0 €",
    periodo: "30 días",
    descripcion: "Acceso completo durante un mes. Sin tarjeta de crédito.",
    color: "border-slate-200",
    badge: null,
    destacado: false,
    cta: "Registrarse gratis",
    ctaHref: "/login",
    ctaStyle: "bg-slate-800 hover:bg-slate-700 text-white",
    features: [
      "Clientes ilimitados",
      "Presupuestos ilimitados",
      "Facturas ilimitadas",
      "PDF profesionales",
      "WhatsApp automático",
      "Analítica completa",
      "Seguimiento de obra",
      "1 usuario",
    ],
    noFeatures: ["Equipo de trabajo", "Soporte prioritario"],
  },
  {
    nombre: "Pro",
    precio: "29 €",
    periodo: "/mes",
    descripcion: "Para carpinteros y autónomos. Todo lo que necesitas para crecer.",
    color: "border-blue-500",
    badge: "Más popular",
    destacado: true,
    cta: "Contratar Pro",
    ctaHref: WHATSAPP_CONTACTO,
    ctaStyle: "bg-blue-600 hover:bg-blue-700 text-white",
    features: [
      "Clientes ilimitados",
      "Presupuestos ilimitados",
      "Facturas ilimitadas",
      "PDF profesionales",
      "WhatsApp automático",
      "Analítica completa",
      "Seguimiento de obra",
      "1 usuario",
      "Soporte prioritario",
    ],
    noFeatures: ["Equipo de trabajo"],
  },
  {
    nombre: "Business",
    precio: "59 €",
    periodo: "/mes",
    descripcion: "Para empresas con equipo. Hasta 5 usuarios con acceso compartido.",
    color: "border-purple-500",
    badge: "Equipos",
    destacado: false,
    cta: "Contratar Business",
    ctaHref: WHATSAPP_CONTACTO,
    ctaStyle: "bg-purple-600 hover:bg-purple-700 text-white",
    features: [
      "Todo lo del plan Pro",
      "Hasta 5 usuarios en equipo",
      "Roles admin / miembro",
      "Datos compartidos entre equipo",
      "Soporte prioritario",
    ],
    noFeatures: [],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-8 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          ← Volver al inicio
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">
          Planes y precios
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Empieza gratis 30 días con acceso completo. Sin tarjeta de crédito.
          Cancela cuando quieras.
        </p>
      </div>

      {/* Plans grid */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANES.map((plan) => (
            <div
              key={plan.nombre}
              className={`relative rounded-2xl border-2 ${plan.color} bg-white/5 backdrop-blur p-6 flex flex-col gap-5 ${
                plan.destacado ? "ring-2 ring-blue-500/40 shadow-xl shadow-blue-500/10 scale-[1.02]" : ""
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${
                    plan.destacado ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div>
                <h2 className="text-white font-bold text-lg">{plan.nombre}</h2>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">{plan.precio}</span>
                  <span className="text-slate-400 text-sm mb-1">{plan.periodo}</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">{plan.descripcion}</p>
              </div>

              <Link
                href={plan.ctaHref}
                target={plan.ctaHref.startsWith("http") ? "_blank" : undefined}
                className={`w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
                {plan.noFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 line-through">
                    <span className="mt-0.5 shrink-0">✗</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-white font-bold text-xl text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[
              {
                q: "¿Necesito tarjeta de crédito para el trial?",
                a: "No. El período de prueba de 30 días es completamente gratuito y no requiere datos de pago.",
              },
              {
                q: "¿Qué pasa cuando termina el trial?",
                a: "Tu cuenta pasa a modo restringido. Tus datos se conservan. Puedes contratar un plan en cualquier momento para recuperar el acceso completo.",
              },
              {
                q: "¿Puedo cambiar de plan?",
                a: "Sí. Contacta por WhatsApp y cambiamos tu plan inmediatamente.",
              },
              {
                q: "¿Cómo funciona el equipo en Business?",
                a: "Puedes invitar hasta 4 colaboradores. Todos acceden a los mismos clientes, presupuestos y trabajos de tu empresa.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">{q}</p>
                <p className="text-slate-400 text-sm mt-1">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm mb-4">
            ¿Tienes dudas? Escríbenos por WhatsApp.
          </p>
          <Link
            href={WHATSAPP_CONTACTO}
            target="_blank"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            💬 Contactar por WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
