"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginCliente() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
      return;
    }

    router.push("/cliente/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-1 tracking-tight">Portal de Cliente</h1>
          <p className="text-gray-500 text-sm">Accede a tus presupuestos, firma y haz seguimiento</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-blue-700">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25V6.75Zm0 0 9 7.5 9-7.5"/></svg>
              </span>
              <input name="email" type="email" autoComplete="username" placeholder="tu@email.com" className="pl-10 pr-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-blue-700">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6-6V7a6 6 0 1 0-12 0v4m-2 0h16v7.25A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25V11Z"/></svg>
              </span>
              <input name="password" type="password" autoComplete="current-password" placeholder="Contraseña" className="pl-10 pr-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.password} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-700 hover:bg-blue-900 text-white font-semibold py-2 rounded transition" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
        </form>
        <div className="mt-6 text-xs text-gray-400">&copy; {new Date().getFullYear()} LUCELUX</div>
      </div>
    </div>
  );
}
