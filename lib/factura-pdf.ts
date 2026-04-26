import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Factura, Cliente, ConfiguracionEmpresa, LineaPresupuesto } from "@/lib/types";

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtFecha(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export async function generarPdfFactura(
  factura: Factura,
  cliente: Cliente,
  empresa: ConfiguracionEmpresa | null,
  logoUrl?: string
): Promise<Blob> {
  const html = crearHtmlFactura(factura, cliente, empresa, logoUrl);

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.appendChild(html);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(html, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

function crearHtmlFactura(
  factura: Factura,
  cliente: Cliente,
  empresa: ConfiguracionEmpresa | null,
  logoUrl?: string
): HTMLElement {
  const div = document.createElement("div");
  div.style.cssText = "width: 210mm; padding: 24px; font-family: Arial, sans-serif; color: #222;";

  const nombreEmpresa = empresa?.nombreEmpresa || "Lucelux Carpintería de Aluminio";
  const nifEmpresa = empresa?.dniNif || "";
  const telefonoEmpresa = empresa?.telefono || "655 100 964";
  const emailEmpresa = empresa?.email || "lucelux.aluminio@gmail.com";
  const direccionEmpresa = empresa?.direccion ? `${empresa.direccion}, ${empresa.ciudad}` : "Piera, Barcelona";
  const ibanEmpresa = empresa?.iban || "";
  const resolvedLogo = logoUrl || "/logo-lucelux.jpg";

  const estaPagada = factura.estado === "pagada";
  const estaVencida = factura.estado === "vencida";

  const lineasHtml = (factura.lineas as LineaPresupuesto[])
    .map((l, i) => {
      const precioVenta = l.costeUnitario * (1 + l.margenPorcentaje / 100);
      const total = (l.cantidad * precioVenta) - l.descuentoLinea;
      return `
      <tr style="border-bottom:1px solid #e2e8f0;${i % 2 === 0 ? "background:#f8fafc;" : ""}">
        <td style="padding:8px 10px;font-size:11px;">
          <strong>${l.nombre}</strong>
          ${l.medidas ? `<br><span style="color:#94a3b8;font-size:10px;">${l.medidas}</span>` : ""}
          ${l.descripcion ? `<br><span style="color:#64748b;font-size:10px;">${l.descripcion}</span>` : ""}
        </td>
        <td style="padding:8px 10px;text-align:center;font-size:11px;">${l.cantidad} ${l.unidad}</td>
        <td style="padding:8px 10px;text-align:right;font-size:11px;">${fmt(precioVenta)}</td>
        ${l.descuentoLinea > 0 ? `<td style="padding:8px 10px;text-align:right;font-size:11px;color:#ef4444;">-${fmt(l.descuentoLinea)}</td>` : `<td style="padding:8px 10px;text-align:right;font-size:11px;">—</td>`}
        <td style="padding:8px 10px;text-align:right;font-size:11px;font-weight:bold;">${fmt(total)}</td>
      </tr>`;
    })
    .join("");

  div.innerHTML = `
    <!-- CABECERA -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:16px;border-bottom:3px solid #1558d4;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <img src="${resolvedLogo}" alt="Logo" style="height:70px;border-radius:8px;"/>
        <div>
          <h1 style="margin:0;font-size:20px;font-weight:bold;color:#1558d4;">${nombreEmpresa}</h1>
          ${nifEmpresa ? `<p style="margin:2px 0;font-size:11px;color:#64748b;">NIF: ${nifEmpresa}</p>` : ""}
          <p style="margin:2px 0;font-size:11px;color:#64748b;">${direccionEmpresa}</p>
          <p style="margin:2px 0;font-size:11px;color:#64748b;">Tel: ${telefonoEmpresa} · ${emailEmpresa}</p>
        </div>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:22px;font-weight:bold;color:#1e293b;letter-spacing:1px;">FACTURA</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:#1558d4;">${factura.numero}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#64748b;">Emisión: ${fmtFecha(factura.fechaEmision)}</p>
        ${factura.fechaVencimiento ? `<p style="margin:2px 0;font-size:11px;color:${estaVencida ? "#ef4444" : "#64748b"};">Vence: ${fmtFecha(factura.fechaVencimiento)}</p>` : ""}
        ${estaPagada ? `<p style="margin:6px 0 0;font-size:12px;font-weight:bold;color:#16a34a;border:2px solid #16a34a;padding:2px 8px;border-radius:6px;display:inline-block;">✓ PAGADA ${factura.fechaPago ? fmtFecha(factura.fechaPago) : ""}</p>` : ""}
        ${estaVencida ? `<p style="margin:6px 0 0;font-size:12px;font-weight:bold;color:#ef4444;border:2px solid #ef4444;padding:2px 8px;border-radius:6px;display:inline-block;">VENCIDA</p>` : ""}
      </div>
    </div>

    <!-- CLIENTE -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;color:#1558d4;text-transform:uppercase;letter-spacing:0.5px;">FACTURAR A</p>
      <p style="margin:0;font-size:13px;font-weight:bold;">${cliente.nombre}</p>
      ${cliente.dniNif ? `<p style="margin:2px 0;font-size:11px;color:#64748b;">NIF/DNI: ${cliente.dniNif}</p>` : ""}
      ${cliente.direccion ? `<p style="margin:2px 0;font-size:11px;color:#64748b;">${cliente.direccion}${cliente.ciudad ? `, ${cliente.ciudad}` : ""}${cliente.codigoPostal ? ` ${cliente.codigoPostal}` : ""}</p>` : ""}
      ${cliente.telefono ? `<p style="margin:2px 0;font-size:11px;color:#64748b;">Tel: ${cliente.telefono}</p>` : ""}
      ${cliente.email ? `<p style="margin:2px 0;font-size:11px;color:#64748b;">${cliente.email}</p>` : ""}
    </div>

    <!-- TABLA DE LÍNEAS -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#1558d4;color:#fff;">
          <th style="padding:10px;text-align:left;font-size:11px;border-radius:4px 0 0 0;">Descripción</th>
          <th style="padding:10px;text-align:center;font-size:11px;width:80px;">Cantidad</th>
          <th style="padding:10px;text-align:right;font-size:11px;width:100px;">P. Unitario</th>
          <th style="padding:10px;text-align:right;font-size:11px;width:90px;">Descuento</th>
          <th style="padding:10px;text-align:right;font-size:11px;width:100px;border-radius:0 4px 0 0;">Total</th>
        </tr>
      </thead>
      <tbody>${lineasHtml}</tbody>
    </table>

    <!-- TOTALES -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
      <div style="width:260px;border:2px solid #1558d4;border-radius:10px;padding:14px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px;">
          <span style="color:#64748b;">Subtotal:</span>
          <span>${fmt(factura.subtotal)}</span>
        </div>
        ${factura.descuento > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px;color:#ef4444;"><span>Descuento:</span><span>-${fmt(factura.descuento)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:8px;">
          <span style="color:#64748b;">IVA (${factura.iva}%):</span>
          <span>${fmt((factura.subtotal - factura.descuento) * factura.iva / 100)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:bold;color:#1558d4;border-top:2px solid #1558d4;padding-top:8px;">
          <span>TOTAL:</span>
          <span>${fmt(factura.total)}</span>
        </div>
      </div>
    </div>

    <!-- PAGO -->
    ${ibanEmpresa ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;color:#1558d4;text-transform:uppercase;">DATOS DE PAGO</p>
      <p style="margin:2px 0;font-size:11px;">IBAN: <strong>${ibanEmpresa}</strong></p>
      <p style="margin:2px 0;font-size:11px;color:#64748b;">Concepto: ${factura.numero}</p>
    </div>` : ""}

    <!-- PIE -->
    <div style="border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;">
      <p style="margin:0;font-size:10px;color:#94a3b8;">${nombreEmpresa} · ${nifEmpresa ? `NIF: ${nifEmpresa} · ` : ""}${emailEmpresa}</p>
    </div>
  `;

  return div;
}
