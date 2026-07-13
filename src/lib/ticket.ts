import { jsPDF } from 'jspdf';
import { Appointment } from '../types';
import { db } from './db';

/**
 * Genera y descarga un comprobante de cita en formato PDF de pre-factura elegante y pulido
 */
export async function downloadTicket(apt: Appointment) {
  let price = 30.00; // Valor base por defecto
  try {
    const services = await db.getServices(apt.business_id);
    const service = services.find(s => s.id === apt.service_id);
    if (service) {
      price = Number(service.price);
    }
  } catch (err) {
    console.error('Error al recuperar precio para la pre-factura:', err);
  }

  const ivaRate = 0.21; // 21% de IVA estándar
  const subtotal = price / (1 + ivaRate);
  const ivaAmount = price - subtotal;

  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const invoiceNum = `PF-${apt.id.slice(0, 8).toUpperCase()}`;

  // Inicializar jsPDF (formato A4: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configuración de colores corporativos
  const COLOR_DARK = [22, 25, 31];     // #16191f
  const COLOR_GOLD = [197, 160, 89];   // #c5a059
  const COLOR_LIGHT_BG = [248, 249, 250]; // Soft off-white
  const COLOR_TEXT = [45, 51, 59];     // #2d333b
  const COLOR_MUTED = [108, 117, 125];  // Gray

  // 1. BANNER CABECERA (Elegante color oscuro con acentos dorados)
  doc.setFillColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.rect(15, 15, 180, 26, 'F');

  // Línea decorativa dorada arriba en el banner
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(15, 15, 180, 1.5, 'F');

  // Título AgendaEC
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AgendaEC', 22, 27);

  // Subtítulo
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('GESTIÓN & RESERVAS INTELIGENTES', 22, 33);

  // Etiqueta de Documento
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(142, 23, 45, 7, 'F');
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PRE-FACTURA PROFORMA', 145, 27.5);

  // 2. METADATOS DE LA FACTURA
  let y = 50;
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DETALLES DEL DOCUMENTO', 15, y);
  
  // Línea gris fina
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.3);
  doc.line(15, y + 2, 195, y + 2);

  y += 8;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('NÚMERO PRE-FACTURA:', 15, y);
  doc.text('FECHA DE EMISIÓN:', 15, y + 5);
  doc.text('CÓDIGO DE RESERVA:', 15, y + 10);
  doc.text('ESTADO DE RESERVA:', 15, y + 15);

  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text(invoiceNum, 60, y);
  doc.text(`${dateStr} a las ${timeStr}`, 60, y + 5);
  doc.setFont('Courier', 'bold');
  doc.text(apt.id, 60, y + 10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.text(apt.status.toUpperCase(), 60, y + 15);

  // 3. BLOQUES EMISOR Y RECEPTOR (Lado a lado con fondos suaves)
  y += 24;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.rect(15, y, 86, 26, 'F');
  doc.setDrawColor(220, 224, 230);
  doc.rect(15, y, 86, 26, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.text('EMISOR (PRESTADOR)', 20, y + 5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text(apt.business_name || 'Establecimiento Colaborador', 20, y + 11);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('AgendaEC Partner Network', 20, y + 16);
  doc.text('AgendaEC Platform proxy', 20, y + 21);

  // Receptor
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.rect(109, y, 86, 26, 'F');
  doc.rect(109, y, 86, 26, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.text('RECEPTOR (CLIENTE)', 114, y + 5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text(apt.client_name || 'Cliente Registrado', 114, y + 11);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('Usuario Registrado en App Móvil', 114, y + 16);
  doc.text('Servicios de Bienestar & Estética', 114, y + 21);

  // 4. DETALLE DE SERVICIOS (Tabla elegante)
  y += 34;
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DETALLE DE LOS SERVICIOS ADQUIRIDOS', 15, y);

  doc.setDrawColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setLineWidth(0.4);
  doc.line(15, y + 2, 195, y + 2);

  y += 7;
  // Encabezados de tabla
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.text('CONCEPTO / DESCRIPCIÓN', 18, y);
  doc.text('CANT.', 125, y);
  doc.text('PRECIO UNIT.', 145, y);
  doc.text('TOTAL', 178, y);

  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.2);
  doc.line(15, y + 2, 195, y + 2);

  // Fila del Servicio
  y += 7;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(apt.service_name || 'Servicio de Bienestar', 18, y);
  doc.setFont('Helvetica', 'normal');
  doc.text('1', 128, y);
  doc.text(`EUR ${price.toFixed(2)}`, 145, y);
  doc.setFont('Helvetica', 'bold');
  doc.text(`EUR ${price.toFixed(2)}`, 175, y);

  // Detalles adicionales abajo de la descripción
  y += 4.5;
  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(`Atendido por: ${apt.professional_name || 'Asignado automáticamente'}`, 18, y);
  
  y += 4;
  doc.text(`Fecha agendada: ${apt.appointment_date} de ${apt.start_time} a ${apt.end_time}`, 18, y);

  doc.setDrawColor(220, 224, 230);
  doc.line(15, y + 3, 195, y + 3);

  // 5. DESGLOSE ECONÓMICO (Alineado a la derecha en bloque elegante)
  y += 12;
  const breakX = 120;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('Subtotal (Base Imponible):', breakX, y);
  doc.text('I.V.A. (21% Incluido):', breakX, y + 5);

  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text(`EUR ${subtotal.toFixed(2)}`, 175, y);
  doc.text(`EUR ${ivaAmount.toFixed(2)}`, 175, y + 5);

  // Línea divisoria de total
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.4);
  doc.line(breakX, y + 8, 195, y + 8);

  y += 13;
  // Total destacado en dorado/oscuro
  doc.setFillColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.rect(breakX, y - 4, 75, 8, 'F');
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL ESTIMADO A PAGAR:', breakX + 3, y + 1);
  doc.setTextColor(255, 255, 255);
  doc.text(`EUR ${price.toFixed(2)}`, 173, y + 1);

  // 6. CONDICIONES Y POLÍTICAS
  y += 16;
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('POLÍTICAS DE ASISTENCIA Y CONDICIONES:', 15, y);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  
  y += 4.5;
  doc.text('1. El abono se efectuará directamente en el centro colaborador una vez concluida su cita programada.', 15, y);
  y += 3.5;
  doc.text('2. Por cortesía profesional y optimización de tiempos, le solicitamos presentarse con 10 minutos de anticipación.', 15, y);
  y += 3.5;
  doc.text('3. Las reprogramaciones o cancelaciones deberán gestionarse con al menos 2 horas de antelación desde su panel de cliente.', 15, y);

  // 7. AVISO LEGAL Y MARCO
  y += 10;
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INFORMACIÓN LEGAL:', 15, y);

  y += 4;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('Este documento es una pre-factura proforma emitida con fines informativos de reserva y control operativo interno.', 15, y);
  y += 3;
  doc.text('No constituye una factura ordinaria, simplificada ni sustitutiva, y carece de efectos fiscales o contables directos.', 15, y);

  // Frase de cierre centrada
  y += 14;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.text('¡Gracias por confiar en los centros de la red AgendaEC!', 105, y, { align: 'center' });

  // Línea decorativa final de pie de página
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(15, 275, 180, 1.5, 'F');

  // Guardar archivo PDF directamente
  const fileName = `prefactura_${invoiceNum}_${apt.appointment_date}.pdf`;
  doc.save(fileName);
}
