"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    codigoPostal: "",
    dniNif: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || "Error al registrar usuario");
      setLoading(false);
      return;
    }

    // Crear cliente asociado en la tabla clientes
    await supabase.from("clientes").insert({
      usuario_id: data.user.id,
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      direccion: form.direccion,
      ciudad: form.ciudad,
      codigo_postal: form.codigoPostal,
      tipo: "particular",
      dni_nif: form.dniNif,
    });

    setLoading(false);
    setSuccess("Registro exitoso. Revisa tu email para confirmar la cuenta.");
    setForm({ nombre: "", email: "", password: "", telefono: "", direccion: "", ciudad: "", codigoPostal: "", dniNif: "" });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Registro de Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="nombre" placeholder="Nombre" className="input" value={form.nombre} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" className="input" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Contraseña" className="input" value={form.password} onChange={handleChange} required />
        <input name="telefono" placeholder="Teléfono" className="input" value={form.telefono} onChange={handleChange} />
        <input name="direccion" placeholder="Dirección" className="input" value={form.direccion} onChange={handleChange} />
        <input name="ciudad" placeholder="Ciudad" className="input" value={form.ciudad} onChange={handleChange} />
        <input name="codigoPostal" placeholder="Código Postal" className="input" value={form.codigoPostal} onChange={handleChange} />
        <input name="dniNif" placeholder="DNI/NIF" className="input" value={form.dniNif} onChange={handleChange} />
        <button type="submit" className="btn w-full" disabled={loading}>{loading ? "Registrando..." : "Registrarse"}</button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
      </form>
    </div>
  );
}

