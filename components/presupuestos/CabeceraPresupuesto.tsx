import Image from "next/image";

interface CabeceraPresupuestoProps {
  numero: string;
  fecha: string;
}

export function CabeceraPresupuesto({ numero, fecha }: CabeceraPresupuestoProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-6 mb-8">
      {/* Logotipo */}
      <div className="flex-shrink-0">
        <Image
          src="/logo-lucelux.jpg" // Cambia a .png si lo prefieres
          alt="LUCELUX Carpintería de Aluminio"
          width={120}
          height={120}
          className="rounded-lg shadow"
        />
      </div>
      {/* Datos empresa y presupuesto */}
      <div className="flex-1 w-full">
        <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight">
          LUCELUX <span className="text-slate-600">Carpintería de Aluminio</span>
        </h1>
        <div className="mt-2 text-slate-700 text-sm space-y-0.5">
          <div>
            <span className="font-semibold">Dirección:</span> Piera
          </div>
          <div>
            <span className="font-semibold">Tel:</span> 655 100 964 &nbsp;|&nbsp;
            <span className="font-semibold">Email:</span> lucelux.aluminio@gmail.com
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-base font-medium text-slate-800">
          <div>
            <span className="font-semibold">Presupuesto Nº:</span> {numero}
          </div>
          <div>
            <span className="font-semibold">Fecha:</span> {fecha}
          </div>
        </div>
      </div>
    </div>
  );
}
