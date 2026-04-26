import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Presupuesto, Cliente } from "@/lib/types";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";

/**
 * Genera un PDF profesional del presupuesto
 * Incluye logo, cliente, líneas, totales y QR de firma
 */
export async function generarPdfPresupuesto(
  presupuesto: Presupuesto,
  cliente: Cliente,
  logoUrl?: string
): Promise<Blob> {
  // Crear elemento HTML con el presupuesto
  const htmlContent = crearHtmlPresupuesto(presupuesto, cliente, logoUrl);

  // IMPORTANTE: Insertar temporalmente en el DOM para que html2canvas pueda acceder a estilos
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.appendChild(htmlContent);
  document.body.appendChild(container);

  try {
    // Convertir HTML a canvas
    const canvas = await html2canvas(htmlContent, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });

    // Crear PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // Márgenes de 10mm
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
    // Remover el elemento temporal del DOM
    document.body.removeChild(container);
  }
}

/**
 * Crea el HTML del presupuesto para convertir a PDF
 */
function crearHtmlPresupuesto(
  presupuesto: Presupuesto,
  cliente: Cliente,
  logoUrl?: string
): HTMLElement {
  const div = document.createElement("div");
  const resolvedLogoUrl = logoUrl || "/logo-lucelux.jpg";
  div.style.cssText =
    "width: 210mm; padding: 20px; font-family: Arial, sans-serif; color: #333;";

  const fechaActual = new Date().toLocaleDateString("es-ES");
  const urlFirmaLink = presupuesto.urlFirma
    ? `${window.location.origin}/presupuestos/${presupuesto.id}/aceptar?token=${presupuesto.urlFirma}`
    : "";


  div.innerHTML = `
    <div style="margin-bottom: 30px; border-bottom: 3px solid #1558d4; padding-bottom: 15px; display: flex; align-items: center; gap: 24px;">
      <div style="flex-shrink:0;">
        <img src='${resolvedLogoUrl}' alt='Logo Lucelux' style='height: 80px; border-radius: 8px; box-shadow: 0 2px 8px #0001;'/>
      </div>
      <div style="flex:1;">
        <h1 style="margin: 0; color: #1558d4; font-size: 32px; font-weight: bold; letter-spacing: 1px;">LUCELUX <span style='color:#666;font-weight:normal;'>Carpintería de Aluminio</span></h1>
        <div style="margin-top: 4px; color: #444; font-size: 13px;">
          <span style="font-weight: bold;">Dirección:</span> Piera<br/>
          <span style="font-weight: bold;">Tel:</span> 655 100 964 &nbsp;|&nbsp;
          <span style="font-weight: bold;">Email:</span> lucelux.aluminio@gmail.com
        </div>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-weight: bold; font-size: 18px;">PRESUPUESTO</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 11px;">ID: ${presupuesto.id}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 11px;">Fecha: ${formatearFecha(presupuesto.fecha)}</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
      <div>
        <h3 style="margin: 0 0 10px 0; color: #1558d4; font-size: 13px; font-weight: bold; text-transform: uppercase;">INFORMACIÓN DEL CLIENTE</h3>
        <p style="margin: 0; font-weight: bold; font-size: 13px;">${cliente.nombre}</p>
        <p style="margin: 2px 0; font-size: 11px; color: #666;">${cliente.direccion}</p>
        <p style="margin: 2px 0; font-size: 11px; color: #666;">${cliente.codigoPostal} ${cliente.ciudad}</p>
        <p style="margin: 2px 0; font-size: 11px; color: #666;">Teléfono: ${cliente.telefono}</p>
        ${cliente.email ? `<p style="margin: 2px 0; font-size: 11px; color: #666;">Email: ${cliente.email}</p>` : ""}
        <p style="margin: 8px 0 0 0; font-size: 10px; color: #999;">Tipo: ${cliente.tipo === "empresa" ? "Empresa" : "Particular"}</p>
      </div>

      <div>
        <h3 style="margin: 0 0 10px 0; color: #1558d4; font-size: 13px; font-weight: bold; text-transform: uppercase;">INFORMACIÓN DEL PRESUPUESTO</h3>
        <p style="margin: 2px 0; font-size: 11px;"><span style="font-weight: bold;">Fecha:</span> ${formatearFecha(presupuesto.fecha)}</p>
        <p style="margin: 2px 0; font-size: 11px;"><span style="font-weight: bold;">Vencimiento:</span> ${formatearFecha(presupuesto.fechaVencimiento)}</p>
        <p style="margin: 2px 0; font-size: 11px;"><span style="font-weight: bold;">Estado:</span> ${presupuesto.estado.toUpperCase()}</p>
        <p style="margin: 2px 0; font-size: 11px;"><span style="font-weight: bold;">Generado:</span> ${fechaActual}</p>
        ${presupuesto.estadoFirma === "aceptado" ? `<p style="margin: 8px 0 0 0; font-size: 10px; color: #2ecc71; font-weight: bold;">✓ ACEPTADO EL ${presupuesto.fechaFirma ? formatearFecha(presupuesto.fechaFirma) : "—"}</p>` : ""}
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #1558d4; font-size: 13px; font-weight: bold; text-transform: uppercase;">DESCRIPCIÓN</h3>
      <p style="margin: 0; font-size: 11px; color: #666;">${presupuesto.descripcion}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #1558d4; font-size: 13px; font-weight: bold; text-transform: uppercase;">DETALLE DE MATERIALES</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background-color: #f0f0f0; border-bottom: 2px solid #1558d4;">
            <th style="padding: 8px; text-align: left; font-weight: bold;">Material</th>
            <th style="padding: 8px; text-align: center; font-weight: bold;">Cant.</th>
            <th style="padding: 8px; text-align: right; font-weight: bold;">Precio unit.</th>
            <th style="padding: 8px; text-align: right; font-weight: bold;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${presupuesto.lineas
            .map(
              (linea, idx) => `
            <tr style="border-bottom: 1px solid #ddd; ${idx % 2 === 0 ? "background-color: #fafafa;" : ""}">
              <td style="padding: 8px; text-align: left;">
                <strong>${linea.nombre}</strong>${linea.medidas ? `<br><span style="color: #999;">${linea.medidas}</span>` : ""}
              </td>
              <td style="padding: 8px; text-align: center;">${linea.cantidad} ${linea.unidad}</td>
              <td style="padding: 8px; text-align: right;">${formatearMoneda(linea.costeUnitario * (1 + linea.margenPorcentaje / 100))}</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${formatearMoneda(
                (linea.cantidad * linea.costeUnitario * (1 + linea.margenPorcentaje / 100)) -
                  linea.descuentoLinea
              )}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div>
        ${presupuesto.notas ? `
        <h3 style="margin: 0 0 10px 0; color: #1558d4; font-size: 13px; font-weight: bold; text-transform: uppercase;">NOTAS</h3>
        <p style="margin: 0; font-size: 10px; color: #666; line-height: 1.5;">${presupuesto.notas}</p>
        ` : ""}
      </div>

      <div style="border: 2px solid #1558d4; padding: 15px; border-radius: 8px; background-color: #f9f9f9;">
        <h3 style="margin: 0 0 10px 0; color: #1558d4; font-size: 12px; font-weight: bold; text-transform: uppercase;">RESUMEN FINANCIERO</h3>
        <div style="font-size: 10px;">
          <p style="margin: 3px 0; display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>${formatearMoneda(presupuesto.subtotalLineas)}</span>
          </p>
          ${presupuesto.descuentoGlobal > 0 ? `
          <p style="margin: 3px 0; display: flex; justify-content: space-between; color: #e74c3c;">
            <span>Descuento:</span>
            <span>-${formatearMoneda(presupuesto.descuentoGlobal)}</span>
          </p>
          ` : ""}
          <p style="margin: 3px 0; display: flex; justify-content: space-between;">
            <span>Subtotal con desc.:</span>
            <span>${formatearMoneda(presupuesto.subtotalConDescuento)}</span>
          </p>
          <p style="margin: 3px 0; display: flex; justify-content: space-between;">
            <span>IVA (${presupuesto.ivaGlobal}%):</span>
            <span>${formatearMoneda(presupuesto.totalIva)}</span>
          </p>
          <p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 2px solid #1558d4; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; color: #1558d4;">
            <span>TOTAL:</span>
            <span>${formatearMoneda(presupuesto.importeTotal)}</span>
          </p>
        </div>
      </div>
    </div>

    ${urlFirmaLink ? `
    <div style="border: 2px dashed #2ecc71; padding: 15px; border-radius: 8px; background-color: #f0fdf4; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #2ecc71; font-size: 12px; font-weight: bold; text-transform: uppercase;">ACEPTACIÓN DIGITAL</h3>
      <p style="margin: 0; font-size: 10px; color: #666; line-height: 1.5;">
        Para aceptar este presupuesto, visita el siguiente enlace:<br>
        <strong style="color: #2ecc71;">${urlFirmaLink}</strong><br>
        O escanea el código QR con tu teléfono.
      </p>
    </div>
    ` : ""}

    <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; font-size: 9px; color: #999; text-align: center;">
      <p style="margin: 0;">Generado automáticamente por LUCELUX • ${fechaActual}</p>
      <p style="margin: 5px 0 0 0;">Este presupuesto es válido hasta el ${formatearFecha(presupuesto.fechaVencimiento)}</p>
    </div>
  `;

  return div;
}

/**
 * Descarga el PDF del presupuesto
 */
export async function descargarPdfPresupuesto(
  presupuesto: Presupuesto,
  cliente: Cliente
): Promise<void> {
  try {
    const blob = await generarPdfPresupuesto(presupuesto, cliente, "/logo-lucelux.jpg");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Presupuesto_${presupuesto.id}_${cliente.nombre.replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generando PDF:", error);
    alert("Error al generar el PDF");
  }
}
