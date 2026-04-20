import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-4xl font-extrabold mb-2 text-blue-900">LUCELUX</h1>
        <p className="mb-6 text-gray-600 text-lg">Gestión de Presupuestos</p>
        <div className="flex flex-col gap-4">
          <Link href="/login" className="btn bg-blue-700 hover:bg-blue-900 text-white px-6 py-3 rounded font-semibold transition">Entrar como Administrador</Link>
          <div className="border-t border-gray-200 my-2"></div>
          <div className="text-gray-500 text-sm mb-1">¿Eres cliente?</div>
          <Link href="/cliente/login" className="btn bg-gray-100 hover:bg-blue-100 text-blue-900 px-6 py-3 rounded font-semibold border border-blue-200 transition">Acceso Cliente</Link>
        </div>
        <div className="mt-8 text-xs text-gray-400">&copy; {new Date().getFullYear()} LUCELUX • Carpintería de Aluminio</div>
      </div>
    </div>
  );
}