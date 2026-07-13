import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Check, AlertCircle, Sparkles, User, FileText, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { db } from '../lib/db';
import { Business, Service, Professional, Appointment, Profile } from '../types';

interface BookingCalendarProps {
  business: Business;
  service: Service;
  currentUser: Profile | null;
  onSuccess: () => void;
  onRequireAuth: () => void;
}

export default function BookingCalendar({ 
  business, 
  service, 
  currentUser, 
  onSuccess, 
  onRequireAuth 
}: BookingCalendarProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Navegación del minicalendario interactivo
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const data = await db.getProfessionals(business.id);
        // Filtrar profesionales para mostrar solo aquellos vinculados a este servicio (si tienen alguno configurado)
        const filtered = data.filter(p => !p.service_ids || p.service_ids.length === 0 || p.service_ids.includes(service.id));
        setProfessionals(filtered);
        if (filtered.length > 0) {
          setSelectedProfessional(filtered[0]);
        } else {
          setSelectedProfessional(null);
        }
      } catch (err) {
        console.error('Error al cargar profesionales:', err);
      }
    };
    loadProfessionals();
  }, [business.id, service.id]);

  useEffect(() => {
    if (!selectedProfessional || !selectedDate) return;

    const fetchSlotsAndAppointments = async () => {
      try {
        setLoading(true);
        // Cargar citas del negocio
        const appointments = await db.getAppointments(undefined, undefined, undefined);
        const filtered = appointments.filter(apt => 
          apt.professional_id === selectedProfessional.id && 
          apt.appointment_date === selectedDate &&
          apt.status !== 'cancelled'
        );
        setExistingAppointments(filtered);

        // Calcular intervalos disponibles
        calculateSlots(selectedProfessional, filtered);
      } catch (err) {
        console.error('Error al calcular horarios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlotsAndAppointments();
  }, [selectedProfessional, selectedDate]);

  const calculateSlots = (prof: Professional, booked: Appointment[]) => {
    const slots: string[] = [];
    const [startHour, startMin] = prof.work_start_time.split(':').map(Number);
    const [endHour, endMin] = prof.work_end_time.split(':').map(Number);
    const duration = service.duration_minutes;

    // Crear objetos de fecha de inicio y fin para calcular iterativamente
    const current = new Date();
    current.setHours(startHour, startMin, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    while (current.getTime() + duration * 60 * 1000 <= end.getTime()) {
      const h = String(current.getHours()).padStart(2, '0');
      const m = String(current.getMinutes()).padStart(2, '0');
      const slotTime = `${h}:${m}`;

      // Verificar si este intervalo se solapa con una cita agendada
      const isBooked = booked.some(apt => {
        const [aptH, aptM] = apt.start_time.split(':').map(Number);
        const [aptEndH, aptEndM] = apt.end_time.split(':').map(Number);

        const aptStartMs = (aptH * 60 + aptM) * 60 * 1000;
        const aptEndMs = (aptEndH * 60 + aptEndM) * 60 * 1000;
        const slotStartMs = (current.getHours() * 60 + current.getMinutes()) * 60 * 1000;
        const slotEndMs = slotStartMs + duration * 60 * 1000;

        // Hay solapamiento si:
        return (slotStartMs < aptEndMs && slotEndMs > aptStartMs);
      });

      if (!isBooked) {
        slots.push(slotTime);
      }

      // Avanzar el reloj
      current.setTime(current.getTime() + duration * 60 * 1000);
    }

    setAvailableSlots(slots);
    setSelectedSlot('');
  };

  const handleBookingSubmit = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!selectedProfessional || !selectedDate || !selectedSlot) {
      setError('Por favor selecciona un profesional, fecha y hora disponible.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Calcular hora de finalización
      const [sh, sm] = selectedSlot.split(':').map(Number);
      const totalMin = sh * 60 + sm + service.duration_minutes;
      const eh = String(Math.floor(totalMin / 60)).padStart(2, '0');
      const em = String(totalMin % 60).padStart(2, '0');
      const endTime = `${eh}:${em}`;

      await db.createAppointment({
        business_id: business.id,
        client_id: currentUser.id,
        service_id: service.id,
        professional_id: selectedProfessional.id,
        appointment_date: selectedDate,
        start_time: selectedSlot,
        end_time: endTime,
        status: 'pending',
        notes: notes
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la reserva. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Generar cuadrícula de días para el calendario mensual interactivo
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Rellenar días del mes anterior para cuadrar la cuadrícula (Lunes a Domingo)
    let startOffset = firstDay.getDay() - 1; // 0 = Lunes, 6 = Domingo
    if (startOffset < 0) startOffset = 6;

    for (let i = startOffset; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const daysGrid = getDaysInMonth(currentMonth);
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (success) {
    return (
      <div className="bg-[#1c2128] rounded-xl border border-[#2d333b] shadow-2xl p-8 text-center max-w-lg mx-auto" id="booking-success-box">
        <div className="bg-emerald-500/10 text-emerald-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="font-display italic font-bold text-2xl text-[#c5a059]">¡Cita Solicitada con Éxito!</h3>
        <p className="text-[#e2e8f0]/80 text-sm mt-3 leading-relaxed">
          Se ha agendado tu cita de <strong>{service.name}</strong> para el día <strong>{selectedDate}</strong> a las <strong>{selectedSlot}</strong>.
        </p>
        <p className="text-[#e2e8f0]/60 text-xs mt-2 bg-[#0f1115] border border-[#2d333b] p-3 rounded-lg leading-relaxed">
          📧 Se ha enviado una notificación automática de confirmación por correo electrónico tanto a ti como al administrador del negocio para su sincronización de calendario.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            onSuccess();
          }}
          className="mt-6 w-full bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold uppercase tracking-wider text-xs py-2.5 rounded-lg transition-colors"
          id="success-done-btn"
        >
          Ver Mis Reservas
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1c2128] rounded-xl border border-[#2d333b] shadow-2xl overflow-hidden" id="booking-wizard">
      {/* Cabecera del Servicio */}
      <div className="bg-[#0f1115] border-b border-[#2d333b] p-5 flex justify-between items-center">
        <div>
          <span className="block text-[9px] uppercase font-bold tracking-widest text-[#c5a059]">Paso Final</span>
          <h3 className="font-display italic font-bold text-lg leading-tight text-[#e2e8f0]">{service.name}</h3>
          <span className="text-[#e2e8f0]/60 text-xs">{service.duration_minutes} minutos • ${service.price}</span>
        </div>
        <div className="bg-[#1c2128] border border-[#2d333b] px-3 py-1.5 rounded-lg text-right">
          <span className="block text-[8px] text-[#e2e8f0]/40 font-mono uppercase font-bold">VALOR</span>
          <span className="font-mono font-bold text-sm text-[#c5a059]">${service.price}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. SELECCIÓN DE PROFESIONAL */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase tracking-widest flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>1. Seleccionar Profesional</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="professional-list">
            {professionals.map((prof) => {
              const isSelected = selectedProfessional?.id === prof.id;
              // Formatear días de trabajo de forma legible
              const daysName = prof.work_days.map(d => weekDays[d-1]).join(', ');
              
              return (
                <button
                  type="button"
                  key={prof.id}
                  onClick={() => {
                    setSelectedProfessional(prof);
                    setSelectedDate('');
                    setSelectedSlot('');
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected 
                      ? 'bg-[#c5a059] border-[#c5a059] text-[#0f1115] shadow-lg scale-[1.01]' 
                      : 'bg-[#0f1115] border-[#2d333b] text-[#e2e8f0] hover:border-[#c5a059]/40 hover:bg-white/5'
                  }`}
                >
                  <img 
                    src={prof.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop"} 
                    alt={prof.name} 
                    className="w-10 h-10 rounded-full object-cover border border-[#2d333b]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs block truncate">{prof.name}</span>
                    <span className={`text-[10px] block truncate ${isSelected ? 'text-[#0f1115]/80' : 'text-[#e2e8f0]/60'}`}>{prof.specialty}</span>
                    <span className={`text-[9px] block mt-1 font-medium ${isSelected ? 'text-[#0f1115]/60' : 'text-[#e2e8f0]/40'}`}>
                      📅 {daysName} ({prof.work_start_time} - {prof.work_end_time})
                    </span>
                  </div>
                </button>
              );
            })}
            {professionals.length === 0 && (
              <div className="col-span-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 text-amber-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold">Servicio No Disponible</h5>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">Actualmente no hay ningún profesional habilitado para realizar este servicio. Por favor, contacta con el negocio o selecciona otro servicio.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedProfessional && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2d333b]">
            {/* 2. CALENDARIO MENSUAL INTERACTIVO */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>2. Escoger Fecha de Cita</span>
              </label>

              {/* Controles de Navegación del Mes */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">
                  {formatMonthYear(currentMonth)}
                </span>
                <div className="flex gap-1">
                  <button 
                    type="button" 
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded bg-[#0f1115] border border-[#2d333b] hover:bg-white/5 text-[#e2e8f0]/70 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNextMonth}
                    className="p-1.5 rounded bg-[#0f1115] border border-[#2d333b] hover:bg-white/5 text-[#e2e8f0]/70 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cuadrícula de Calendario */}
              <div className="bg-[#0f1115] border border-[#2d333b] rounded-xl p-3">
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {weekDays.map((day) => (
                    <span key={day} className="text-[10px] font-bold text-[#e2e8f0]/40 uppercase py-1">{day}</span>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {daysGrid.map((date, idx) => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    
                    const isPast = date < today;
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    
                    // Supabase almacena el día de la semana (1 = Lunes, 7 = Domingo)
                    // JavaScript getDay() devuelve (0 = Domingo, 1 = Lunes, etc.)
                    let dayOfWeek = date.getDay();
                    if (dayOfWeek === 0) dayOfWeek = 7;

                    const worksThisDay = selectedProfessional.work_days.includes(dayOfWeek);
                    const isEnabled = !isPast && isCurrentMonth && worksThisDay;

                    // Formato para comparar "YYYY-MM-DD" en UTC/Local exacto
                    const offset = date.getTimezoneOffset();
                    const localDateStr = new Date(date.getTime() - (offset*60*1000)).toISOString().split('T')[0];
                    const isSelected = selectedDate === localDateStr;

                    return (
                      <button
                        type="button"
                        key={idx}
                        disabled={!isEnabled}
                        onClick={() => {
                          setSelectedDate(localDateStr);
                          setSelectedSlot('');
                        }}
                        className={`aspect-square text-xs font-semibold rounded-lg flex flex-col items-center justify-center transition-all ${
                          !isCurrentMonth 
                            ? 'text-[#e2e8f0]/20' 
                            : !isEnabled
                            ? 'text-[#e2e8f0]/20 bg-transparent cursor-not-allowed line-through' 
                            : isSelected
                            ? 'bg-[#c5a059] text-[#0f1115] font-bold shadow-md'
                            : 'bg-[#1c2128] border border-[#2d333b] text-[#e2e8f0] hover:bg-white/5'
                        }`}
                      >
                        <span>{date.getDate()}</span>
                        {isEnabled && !isSelected && (
                          <span className="w-1.5 h-1.5 bg-[#c5a059] rounded-full mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. SELECCIÓN DE HORA DISPONIBLE */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>3. Horas Disponibles</span>
              </label>

              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#2d333b] rounded-xl bg-[#0f1115]/50 text-center p-4">
                  <CalendarIcon className="w-8 h-8 text-[#c5a059]/40 mb-2" />
                  <span className="text-xs font-medium text-[#e2e8f0]/40">Selecciona un día habilitado en el calendario para calcular su disponibilidad</span>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-48 bg-[#0f1115] rounded-xl border border-[#2d333b]">
                  <span className="text-xs font-mono text-[#c5a059] animate-pulse">Analizando agenda operacional...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-red-900/30 rounded-xl bg-red-950/20 text-center p-4">
                  <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                  <span className="text-xs font-bold text-red-400">Sin Horas Disponibles</span>
                  <p className="text-[10px] text-red-400/60 mt-1">El profesional se encuentra completamente agendado o fuera de su jornada este día.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1.5 border border-[#2d333b]/60 bg-[#0f1115]/30 rounded-xl" id="available-slots">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg border text-center font-mono font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#c5a059] border-[#c5a059] text-[#0f1115] shadow-md scale-[1.03]'
                            : 'bg-[#0f1115] border-[#2d333b] text-[#e2e8f0] hover:border-[#c5a059]/40 hover:bg-white/5'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Notas de la Cita */}
              {selectedSlot && (
                <div className="space-y-1.5 pt-3 border-t border-[#2d333b]">
                  <label className="block text-[10px] font-bold text-[#e2e8f0]/60 uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#c5a059]" />
                    <span>Notas especiales o requerimientos:</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Alergias, indicaciones específicas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notificación de Error */}
        {error && (
          <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-xs p-3.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Acciones de Booking */}
        {selectedSlot && (
          <div className="pt-4 border-t border-[#2d333b] flex items-center justify-between bg-[#0f1115] p-4 -mx-6 -mb-6">
            <div className="text-left">
              <span className="block text-[8px] font-bold text-[#e2e8f0]/40 uppercase tracking-widest">Notas especiales o requerimientos</span>
              <span className="block text-xs font-semibold text-[#e2e8f0]">
                📅 {selectedDate} a las {selectedSlot} • {selectedProfessional?.name}
              </span>
            </div>
            
            {currentUser ? (
              <button
                type="button"
                onClick={handleBookingSubmit}
                disabled={loading}
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                id="booking-confirm-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0f1115] animate-pulse" />
                <span>Confirmar Reserva</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequireAuth}
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1 shadow-md"
                id="booking-auth-required-btn"
              >
                <span>Ingresar para Reservar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
