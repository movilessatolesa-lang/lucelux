"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592M6.53 6.533A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.065 5.33M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [modo, setModo] = useState<"login" | "registro" | "recuperar">("login");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  // Registro
  const [nombre, setNombre] = useState("");
  const [emailRegistro, setEmailRegistro] = useState("");
  const [passwordRegistro, setPasswordRegistro] = useState("");
  const [passwordRegistroConfirm, setPasswordRegistroConfirm] = useState("");
  const [verPasswordReg, setVerPasswordReg] = useState(false);
  const [verPasswordRegConfirm, setVerPasswordRegConfirm] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [telefonoEmpresa, setTelefonoEmpresa] = useState("");

  // Recuperar contraseña
  const [emailRecuperar, setEmailRecuperar] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Email o contraseña incorrectos");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordRegistro !== passwordRegistroConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (passwordRegistro.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: emailRegistro,
        password: passwordRegistro,
        options: {
          data: { nombre, empresa, telefono_empresa: telefonoEmpresa },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailRegistro,
        password: passwordRegistro,
      });

      if (!loginError) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Cuenta creada. Comprueba tu email para confirmar y luego inicia sesión.");
        setModo("login");
      }
    } finally {
      setCargando(false);
    }
  };

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);
    setCargando(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      });
      if (authError) {
        setError("No se pudo enviar el email. Comprueba la dirección.");
      } else {
        setExito("Te hemos enviado un email con el enlace para restablecer tu contraseña.");
      }
    } finally {
      setCargando(false);
    }
  };

  const cambiarModo = (nuevoModo: "login" | "registro" | "recuperar") => {
    setModo(nuevoModo);
    setError(null);
    setExito(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">LUCELUX</h1>
          <p className="text-slate-400">Gestión de Presupuestos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Tabs — solo en login y registro */}
          {modo !== "recuperar" && (
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => cambiarModo("login")}
                className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${
                  modo === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => cambiarModo("registro")}
                className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${
                  modo === "registro"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Registrarse
              </button>
            </div>
          )}

          {/* Error / Éxito */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {exito && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {exito}
            </div>
          )}

          {/* ── LOGIN ── */}
          {modo === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={verPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-11 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <EyeIcon open={verPassword} />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => cambiarModo("recuperar")}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? "Iniciando..." : "Iniciar Sesión"}
              </button>
            </form>
          )}

          {/* ── REGISTRO ── */}
          {modo === "registro" && (
            <form onSubmit={handleRegistro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={emailRegistro}
                  onChange={(e) => setEmailRegistro(e.target.value)}
                  placeholder="usuario@email.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={telefonoEmpresa}
                  onChange={(e) => setTelefonoEmpresa(e.target.value)}
                  placeholder="+34 600 123 456"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Empresa (opcional)</label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Nombre de tu empresa"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={verPasswordReg ? "text" : "password"}
                    value={passwordRegistro}
                    onChange={(e) => setPasswordRegistro(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2.5 pr-11 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerPasswordReg(!verPasswordReg)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <EyeIcon open={verPasswordReg} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={verPasswordRegConfirm ? "text" : "password"}
                    value={passwordRegistroConfirm}
                    onChange={(e) => setPasswordRegistroConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    className={`w-full px-4 py-2.5 pr-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      passwordRegistroConfirm && passwordRegistro !== passwordRegistroConfirm
                        ? "border-red-400 bg-red-50"
                        : "border-slate-300"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerPasswordRegConfirm(!verPasswordRegConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <EyeIcon open={verPasswordRegConfirm} />
                  </button>
                </div>
                {passwordRegistroConfirm && passwordRegistro !== passwordRegistroConfirm && (
                  <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? "Registrando..." : "Crear Cuenta"}
              </button>
            </form>
          )}

          {/* ── RECUPERAR CONTRASEÑA ── */}
          {modo === "recuperar" && (
            <form onSubmit={handleRecuperar} className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-800">Recuperar contraseña</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={emailRecuperar}
                  onChange={(e) => setEmailRecuperar(e.target.value)}
                  placeholder="usuario@email.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? "Enviando..." : "Enviar enlace"}
              </button>

              <button
                type="button"
                onClick={() => cambiarModo("login")}
                className="w-full text-sm text-slate-500 hover:text-slate-700 hover:underline"
              >
                ← Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-8">
          © 2026 LUCELUX • Carpintería de Aluminio
        </p>
      </div>
    </div>
  );
}
