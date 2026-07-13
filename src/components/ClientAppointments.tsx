import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Trash2, X, Check, ArrowLeft, RefreshCw, MessageSquare, Download } from 'lucide-react';
import { db } from '../lib/db';
import { Appointment, Profile } from '../types';
import { downloadTicket } from '../lib/ticket';

interface ClientAppointmentsProps {
  currentUser: Profile;
  onNavigateBack: () => void;
}

export default function ClientAppointments({ currentUser, onNavigateBack }: ClientAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await db.getAppointments(currentUser.id, 'client', undefined);
      setAppointments(data);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentUser.id]);

  const handleCancelBooking = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    
    try {
      setLoading(true);
      await db.updateAppointmentStatus(id, 'cancelled');
      await loadAppointments();
    } catch (err) {
      console.error('Error al cancelar reserva:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <span className="font-mono text-xs text-[#e2e8f0]/60">Sincronizando historial de reservas...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200 text-[#e2e8f0]" id="client-appointments-view">
      {/* Botón Volver al Catálogo con fondo y borde de color */}
      <div className="flex justify-start">
        <button 
          onClick={onNavigateBack} 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c5a059]/10 border border-[#c5a059]/40 hover:bg-[#c5a059] hover:text-[#0f1115] text-[#c5a059] hover:border-[#c5a059] text-xs font-bold rounded-xl transition-all shadow-md group/back-btn cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover/back-btn:-translate-x-0.5 transition-transform" />
          <span>Volver al Catálogo</span>
        </button>
      </div>

      {/* Contenedor para Mis Reservas, Historial de reservas y Botón Actualizar */}
      <div className="bg-[#1c2128] border border-[#2d333b] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="appointments-header-card">
        <div className="space-y-1.5">
          <h1 className="font-display italic font-bold text-2xl text-[#c5a059] tracking-tight">Mis Reservas</h1>
          <p className="text-[#e2e8f0]/60 text-xs leading-relaxed">
            Historial personal seguro de reservas y preferencias sincronizadas.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={loadAppointments}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:translate-y-[-1px] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Listado */}
      {appointments.length === 0 ? (
        <div className="bg-[#1c2128] border border-[#2d333b] p-12 text-center rounded-2xl shadow-xl">
          <Calendar className="w-12 h-12 text-[#2d333b] mx-auto mb-3" />
          <span className="text-sm font-semibold text-[#e2e8f0]">No has agendado ninguna cita todavía</span>
          <p className="text-xs text-[#e2e8f0]/40 mt-1">Navega por nuestro catálogo de empresas para agendar tu primera cita.</p>
          <button
            onClick={onNavigateBack}
            className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg mt-4 shadow-md transition-colors"
          >
            Explorar Catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-4" id="appointments-history-list">
          {appointments.map((apt) => {
            const isCancellable = apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'reserved';
            const statusLabel = 
              apt.status === 'confirmed' || apt.status === 'reserved' ? 'RESERVADO' :
              apt.status === 'completed' || apt.status === 'attended' ? 'ATENDIDO' :
              apt.status === 'pending' ? 'PENDIENTE' : 'CANCELADO';

            const statusColorClass = 
              apt.status === 'confirmed' || apt.status === 'reserved'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : apt.status === 'completed' || apt.status === 'attended'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : apt.status === 'cancelled'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20';

            return (
              <div 
                key={apt.id} 
                className="bg-[#1c2128] border border-[#2d333b] rounded-xl overflow-hidden shadow-xl flex flex-col sm:flex-row justify-between sm:items-center p-5 gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#0f1115] text-[#c5a059] border border-[#2d333b] font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {apt.business_name}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColorClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  
                  <h3 className="font-display italic font-bold text-sm text-[#e2e8f0] leading-tight">
                    {apt.service_name}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#e2e8f0]/60 font-medium">
                    <span className="text-[#e2e8f0]/80">Profesional: <strong className="text-[#c5a059]">{apt.professional_name}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[#c5a059]/90">📅 {apt.appointment_date} a las {apt.start_time}</span>
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-[#e2e8f0]/60 bg-[#0f1115] p-2.5 rounded-lg border border-[#2d333b] leading-relaxed">
                      📝 <strong className="text-[#e2e8f0]">Tus notas:</strong> "{apt.notes}"
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-end items-stretch sm:items-center sm:border-l sm:border-[#2d333b] sm:pl-5 shrink-0">
                  <button
                    onClick={() => downloadTicket(apt)}
                    className="bg-[#c5a059]/10 hover:bg-[#c5a059] hover:text-[#0f1115] text-[#c5a059] border border-[#c5a059]/30 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Descargar Comprobante Oficial de Cita"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ticket</span>
                  </button>

                  {isCancellable ? (
                    <button
                      onClick={() => handleCancelBooking(apt.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#e2e8f0]/40 font-semibold font-mono text-center">
                      {apt.status === 'completed' || apt.status === 'attended' ? 'Cita Finalizada' : 'Cita Cancelada'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
