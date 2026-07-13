import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Inicialización de cliente Supabase de forma segura
let rawSupabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uypldnumxstagpjgifou.supabase.co';
if (rawSupabaseUrl.endsWith('/rest/v1/')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 9);
} else if (rawSupabaseUrl.endsWith('/rest/v1')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 8);
}
const supabaseUrl = rawSupabaseUrl;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5cGxkbnVteHN0YWdwamdpZm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDYyNDMsImV4cCI6MjA5OTQ4MjI0M30.QmF4sdTSO2neH7EUJZ1VG5H4dHLJbttfVDHj5WfMQ0k';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para obtener el transportador SMTP de Google/Gmail
function getSMTPTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!user || !pass) {
    console.warn("⚠️ SMTP_USER y/o SMTP_PASS no están configurados en el .env. Los correos se imprimirán en los logs del servidor.");
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT !== '587', // true para 465 (SSL), false para 587 (TLS)
    auth: {
      user: user,
      pass: pass
    }
  });
}

// ==========================================
// API ENDPOINTS - PRIMERO QUE TODO
// ==========================================

// Endpoint para el envío de correos de bienvenida (Producción Real)
app.post('/api/notify-welcome', async (req, res) => {
  const { email, full_name, role } = req.body;
  
  if (!email) {
    res.status(400).json({ success: false, error: 'Email es requerido' });
    return;
  }
  
  try {
    const name = full_name || email.split('@')[0];
    const roleName = role === 'superadmin' ? 'Super Administrador' : role === 'admin' ? 'Administrador de Negocio' : 'Cliente';
    const subject = '¡Bienvenido a AgendaEC!';
    
    const mailHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #0f1115; border-bottom: 3px solid #c5a059; padding: 25px; text-align: center; color: #fff;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #c5a059; font-style: italic;">AgendaEC</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #e2e8f0/60;">Sincronización de Citas en Producción Real</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hola <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #4a5568; margin-bottom: 20px;">
            Te damos una cálida bienvenida a <strong>AgendaEC</strong>, tu ecosistema seguro para el agendamiento y la sincronización de citas operacionales en tiempo real.
          </p>
          <div style="background-color: #f7fafc; border-left: 4px solid #c5a059; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; font-size: 13px; color: #718096;"><strong>Detalles de tu cuenta:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #2d3748;"><strong>Usuario:</strong> ${email}</p>
            <p style="margin: 3px 0 0 0; font-size: 14px; color: #2d3748;"><strong>Rol asignado:</strong> ${roleName}</p>
          </div>
          <p style="font-size: 14px; color: #4a5568;">
            A partir de este instante, podrás administrar y reservar citas con facilidad. Se te notificará de forma automatizada por este medio ante cada confirmación o cambio de estado.
          </p>
          <p style="font-size: 12px; color: #a0aec0; margin-top: 35px; border-top: 1px solid #edf2f7; padding-top: 15px; text-align: center;">
            Este es un correo electrónico automatizado de AgendaEC. Por favor no responder.
          </p>
        </div>
      </div>
    `;
    
    const transporter = getSMTPTransporter();
    
    if (transporter) {
      await transporter.sendMail({
        from: `"AgendaEC" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: mailHTML
      });
      console.log(`[Google SMTP] Correo de bienvenida enviado exitosamente a: ${email}`);
      res.json({ success: true, method: 'smtp', message: 'Correo de bienvenida enviado exitosamente' });
    } else {
      console.log('==================================================');
      console.log('💬 [NOTIFICACIÓN DE BIENVENIDA REGISTRADA EN LOGS]');
      console.log(`Para: ${name} <${email}>`);
      console.log(`Rol: ${roleName}`);
      console.log('==================================================');
      res.json({ success: true, method: 'log', message: 'Bienvenida registrada con éxito en servidor' });
    }
  } catch (error: any) {
    console.error('Error al enviar correo de bienvenida:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para el envío de notificaciones de citas (Producción Real)
app.post('/api/notify-appointment', async (req, res) => {
  const { appointmentId, appointment, isLocalFallback, statusUpdate } = req.body;
  
  try {
    let finalApt = appointment;
    let clientEmail = '';
    let adminEmail = '';
    
    // Consultar datos reales de Supabase si tenemos ID de la cita
    if (!finalApt && appointmentId) {
      try {
        const { data: aptData, error: aptError } = await supabase
          .from('appointments')
          .select(`
            *,
            client:profiles(email, full_name),
            service:services(name, price),
            professional:professionals(name),
            business:businesses(name, phone, address)
          `)
          .eq('id', appointmentId)
          .maybeSingle();

        if (aptError) throw aptError;

        if (aptData) {
          clientEmail = aptData.client?.email || '';
          const client_name = aptData.client?.full_name || 'Cliente';
          const service_name = aptData.service?.name || 'Servicio contratado';
          const professional_name = aptData.professional?.name || 'Profesional asignado';
          const business_name = aptData.business?.name || 'Negocio';
          const appointment_date = aptData.appointment_date || 'Fecha por confirmar';
          const start_time = aptData.start_time || 'Hora por confirmar';
          const notes = aptData.notes || '';
          
          finalApt = {
            client_name,
            client_email: clientEmail,
            service_name,
            professional_name,
            business_name,
            appointment_date,
            start_time,
            notes,
            business_id: aptData.business_id,
            price: aptData.service?.price || 0
          };

          // Buscar el correo del administrador de este negocio específico
          const { data: admins } = await supabase
            .from('profiles')
            .select('email')
            .eq('business_id', aptData.business_id)
            .eq('role', 'admin');

          if (admins && admins.length > 0) {
            adminEmail = admins[0].email;
          }
        }
      } catch (errDb) {
        console.error('Error recuperando datos adicionales desde Supabase:', errDb);
      }
    }

    if (!finalApt) {
      res.status(400).json({ success: false, error: 'Detalles de la cita no proporcionados' });
      return;
    }

    const { 
      client_name = 'Cliente', 
      service_name = 'Servicio contratado', 
      professional_name = 'Profesional asignado', 
      business_name = 'Negocio', 
      appointment_date = 'Fecha por confirmar', 
      start_time = 'Hora por confirmar',
      notes = '',
      price = '0.00'
    } = finalApt;

    if (!clientEmail) {
      clientEmail = finalApt.client_email || 'roomia.admincontact@gmail.com';
    }

    const subject = statusUpdate 
      ? `Actualización de Cita en ${business_name}: Estado ${statusUpdate.toUpperCase()}`
      : `Nueva Cita Registrada: ${service_name} en ${business_name}`;

    const mailHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #0f1115; border-bottom: 3px solid #c5a059; padding: 25px; text-align: center; color: #fff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #c5a059; font-style: italic;">AgendaEC</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #e2e8f0/60;">Notificación Operacional Sincronizada</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Estimados,</p>
          <p style="font-size: 14px; color: #4a5568; margin-bottom: 20px;">
            Se ha registrado una actualización respecto a la cita en el establecimiento <strong>${business_name}</strong>. A continuación, los detalles operacionales sincronizados:
          </p>
          <div style="background-color: #f8fafc; border-left: 4px solid #c5a059; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #2d3748;">
              <li style="margin-bottom: 10px;"><strong>Establecimiento:</strong> ${business_name}</li>
              <li style="margin-bottom: 10px;"><strong>Cliente:</strong> ${client_name} (${clientEmail})</li>
              <li style="margin-bottom: 10px;"><strong>Servicio:</strong> ${service_name} ($${price})</li>
              <li style="margin-bottom: 10px;"><strong>Profesional:</strong> ${professional_name}</li>
              <li style="margin-bottom: 10px;"><strong>Fecha de Reserva:</strong> ${appointment_date}</li>
              <li style="margin-bottom: 10px;"><strong>Hora de Inicio:</strong> ${start_time}</li>
              ${notes ? `<li style="margin-bottom: 10px;"><strong>Notas adicionales:</strong> ${notes}</li>` : ''}
              <li style="margin-top: 15px; font-size: 15px;"><strong>Estado actual:</strong> <span style="background-color: ${statusUpdate === 'cancelled' ? '#fecaca' : '#dcfce7'}; color: ${statusUpdate === 'cancelled' ? '#991b1b' : '#166534'}; padding: 5px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; border: 1px solid ${statusUpdate === 'cancelled' ? '#fca5a5' : '#86efac'};">${(statusUpdate || 'confirmada').toUpperCase()}</span></li>
            </ul>
          </div>
          <p style="font-size: 13px; color: #718096; margin-top: 25px;">
            * El cliente y el administrador del establecimiento han recibido esta copia de manera sincronizada.
          </p>
          <p style="font-size: 12px; color: #a0aec0; margin-top: 35px; border-top: 1px solid #edf2f7; padding-top: 15px; text-align: center;">
            Este es un correo automatizado de producción enviado por AgendaEC.
          </p>
        </div>
      </div>
    `;

    const transporter = getSMTPTransporter();
    
    // Construir lista de destinatarios únicos sin duplicados
    const recipientList = Array.from(new Set([
      clientEmail,
      adminEmail,
      'roomia.admincontact@gmail.com'
    ].filter(Boolean)));

    if (transporter && recipientList.length > 0) {
      await transporter.sendMail({
        from: `"AgendaEC" <${process.env.SMTP_USER}>`,
        to: recipientList.join(', '),
        subject: subject,
        html: mailHTML
      });
      console.log(`[Google SMTP] Notificación de cita enviada exitosamente a: ${recipientList.join(', ')}`);
      res.json({ 
        success: true, 
        method: 'smtp',
        message: 'Notificaciones automáticas por correo electrónico enviadas con éxito.',
        recipients: recipientList
      });
    } else {
      console.log('==================================================');
      console.log('💬 [NOTIFICACIÓN POR CORREO EN PRODUCTION LOGS]');
      console.log(`Sujeto: ${subject}`);
      console.log(`Para el Cliente: ${client_name} <${clientEmail}>`);
      if (adminEmail) console.log(`Para el Admin de: ${business_name} <${adminEmail}>`);
      console.log(`Cita: ${service_name} con ${professional_name} el ${appointment_date} a las ${start_time}`);
      console.log('==================================================');
      res.json({ 
        success: true, 
        method: 'log',
        message: 'Notificación de cita guardada exitosamente en logs de producción.',
        loggedToTerminal: true 
      });
    }
  } catch (error: any) {
    console.error('Error al enviar la notificación de correo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de prueba de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// INTEGRACIÓN VITE DE DESARROLLO / PRODUCCIÓN
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // Fallback de desarrollo para SPA (Evita 404 en refrescos de rutas dinámicas)
    app.get('*', async (req, res, next) => {
      // Ignorar llamadas de API y archivos con extensión (ej. .js, .css, .png, .ico, etc.)
      if (req.originalUrl.startsWith('/api') || req.originalUrl.includes('.')) {
        return next();
      }
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
    console.log('Vite middleware y SPA fallback montados en Express.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Sirviendo archivos estáticos de producción desde dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Citas Server] Servidor corriendo en puerto ${PORT}`);
  });
}

startServer();
