import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Phone, Award, Image as ImageIcon, Check, Star, Calendar as CalendarIcon, Briefcase, Clock, DollarSign,
  ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import { db } from '../lib/db';
import { Business, Service, Professional, Profile } from '../types';
import BookingCalendar from './BookingCalendar';
import ReviewList from './ReviewList';

interface BusinessDetailProps {
  slug: string;
  currentUser: Profile | null;
  onBack: () => void;
  onRequireAuth: () => void;
  onSuccessBooking: () => void;
}

const getWhatsAppUrl = (phone: string) => {
  const clean = phone.replace(/[^\d]/g, '');
  let finalPhone = clean;
  if (clean.startsWith('0')) {
    finalPhone = '593' + clean.slice(1);
  } else if (clean.length === 9 && !clean.startsWith('593') && !clean.startsWith('34')) {
    finalPhone = '593' + clean;
  }
  const text = encodeURIComponent('vengo de AgendaEC quisiera mas informacion sobre su negocio');
  return `https://wa.me/${finalPhone}?text=${text}`;
};

export default function BusinessDetail({ 
  slug, 
  currentUser, 
  onBack, 
  onRequireAuth, 
  onSuccessBooking 
}: BusinessDetailProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [activeServiceImages, setActiveServiceImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadBusinessDetail = async () => {
      try {
        setLoading(true);
        const data = await db.getBusinessBySlug(slug);
        if (data) {
          setBusiness(data);
          const srvs = await db.getServices(data.id);
          setServices(srvs);
          const profs = await db.getProfessionals(data.id);
          setProfessionals(profs);
        }
      } catch (err) {
        console.error('Error al cargar detalles de empresa:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBusinessDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="font-mono text-sm text-[#c5a059] animate-pulse">Cargando detalles de la empresa...</span>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h2 className="font-display italic font-bold text-2xl text-[#c5a059]">Empresa no encontrada</h2>
        <button onClick={onBack} className="bg-[#c5a059] text-[#0f1115] font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-lg">
          Volver al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200" id="business-detail">
      
      {/* Botón Volver */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#1c2128] border border-[#2d333b] hover:border-[#c5a059] text-[#e2e8f0]/80 hover:text-[#c5a059] px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer w-fit"
        id="detail-back-btn"
      >
        <ArrowLeft className="w-4 h-4 text-[#c5a059]" />
        <span>Volver al Catálogo</span>
      </button>

      {/* TODAS LAS FOTOS EN LA PARTE SUPERIOR (CARRUSEL UNO POR UNO) */}
      {(() => {
        const allPhotos = [
          business.cover_url,
          ...(business.gallery_urls || [])
        ].filter(Boolean) as string[];

        if (allPhotos.length === 0) return null;

        const safeIndex = currentPhotoIndex % allPhotos.length;

        const handlePrevPhoto = () => {
          setCurrentPhotoIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1));
        };

        const handleNextPhoto = () => {
          setCurrentPhotoIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1));
        };

        return (
          <div className="space-y-3" id="top-gallery-carousel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#c5a059]" />
                <span className="text-[10px] font-bold text-[#c5a059] uppercase tracking-wider block">Galería del Establecimiento</span>
              </div>
              <span className="text-[10px] font-mono text-[#c5a059] font-bold">
                Imagen {safeIndex + 1} de {allPhotos.length}
              </span>
            </div>

            {/* Contenedor Principal del Carrusel */}
            <div className="relative aspect-video sm:aspect-[21/9] w-full rounded-2xl overflow-hidden border border-[#2d333b] bg-[#0f1115] shadow-lg group">
              <img 
                src={allPhotos[safeIndex]} 
                alt={`${business.name} foto ${safeIndex}`} 
                className="w-full h-full object-cover transition-all duration-500 ease-in-out" 
              />
              
              {/* Degradado inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

              {/* Controles de Navegación */}
              {allPhotos.length > 1 && (
                <>
                  {/* Flecha Izquierda */}
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#0f1115]/75 hover:bg-[#c5a059] text-[#e2e8f0] hover:text-[#0f1115] p-2.5 rounded-full border border-[#2d333b] transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-lg"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Flecha Derecha */}
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#0f1115]/75 hover:bg-[#c5a059] text-[#e2e8f0] hover:text-[#0f1115] p-2.5 rounded-full border border-[#2d333b] transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-lg"
                    aria-label="Foto siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Etiqueta de la Foto */}
              <div className="absolute bottom-4 left-6">
                <span className="text-[10px] font-bold text-[#e2e8f0] bg-[#0f1115]/80 border border-[#2d333b] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {safeIndex === 0 ? 'Portada Principal' : `Instalación ${safeIndex}`}
                </span>
              </div>

              {/* Indicadores en forma de puntos (Bullets) */}
              {allPhotos.length > 1 && (
                <div className="absolute bottom-4 right-6 flex gap-1.5 bg-[#0f1115]/60 px-3 py-1.5 rounded-full border border-white/5">
                  {allPhotos.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurrentPhotoIndex(dotIdx)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        dotIdx === safeIndex ? 'bg-[#c5a059] w-4' : 'bg-[#e2e8f0]/40 hover:bg-[#e2e8f0]/70'
                      }`}
                      aria-label={`Ir a foto ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Cabecera del Negocio (Título, Logo, Contacto y Diplomas) */}
      <div className="relative rounded-2xl overflow-hidden border border-[#2d333b] shadow-xl bg-[#1c2128] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={business.logo_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&h=150&fit=crop"} 
              alt={`${business.name} logo`} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-[#2d333b] bg-[#16191f] shadow-2xl shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1.5">
              <span className="bg-[#c5a059] text-[#0f1115] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {business.category}
              </span>
              <h1 className="font-display italic font-bold text-2xl sm:text-3xl tracking-tight leading-tight text-[#c5a059]">{business.name}</h1>
              <p className="text-xs text-[#e2e8f0]/60 max-w-2xl">{business.description}</p>
              
              <div className="flex flex-wrap gap-2.5 pt-2">
                <a
                  href={business.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#16191f] hover:bg-[#2d333b] border border-[#2d333b] hover:border-[#c5a059]/40 text-[#e2e8f0] hover:text-[#c5a059] font-medium text-xs rounded-xl transition-all shadow-sm cursor-pointer select-none group/map-btn"
                  title="Ver ubicación en Google Maps"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#c5a059] group-hover/map-btn:scale-110 transition-transform" />
                  <span>📍 Dirección: {business.address}</span>
                </a>
                <a
                  href={getWhatsAppUrl(business.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#16191f] hover:bg-[#2d333b] border border-[#2d333b] hover:border-[#c5a059]/40 text-[#e2e8f0] hover:text-[#c5a059] font-medium text-xs rounded-xl transition-all shadow-sm cursor-pointer select-none group/phone-btn"
                  title="Contactar por WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5 text-[#c5a059] group-hover/phone-btn:scale-110 transition-transform" />
                  <span>📞 Tel: {business.phone}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Botones de diplomas */}
          <div className="shrink-0">
            <button
              onClick={() => setShowCertModal(true)}
              className="bg-[#c5a059]/10 text-[#c5a059] hover:bg-[#c5a059] hover:text-[#0f1115] border border-[#c5a059]/30 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              id="view-diplomas-btn"
            >
              <Award className="w-4 h-4" />
              <span>Certificados y Diplomas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selección de Servicios (Renderizado en Tarjetas Modernas con Imagen) */}
      <div className="space-y-4">
        <div className="border-b border-[#2d333b] pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-display italic font-bold text-lg text-[#c5a059]">Paso 1: Selecciona un Servicio</h3>
          </div>
          {selectedService && (
            <button
              onClick={() => setSelectedService(null)}
              className="text-xs font-bold text-[#c5a059] hover:bg-[#c5a059]/20 hover:text-[#e2e8f0] bg-[#c5a059]/10 border border-[#c5a059]/30 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              id="change-service-btn"
            >
              Cambiar Servicio
            </button>
          )}
        </div>

        {selectedService ? (
          /* PASO 1 MINIMIZADO */
          <div className="bg-[#0f1115] border border-[#c5a059]/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-in fade-in duration-250">
            <div className="flex items-start sm:items-center gap-4">
              <img 
                src={selectedService.image_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&fit=crop"} 
                alt={selectedService.name}
                className="w-14 h-14 rounded-lg object-cover border border-[#2d333b] shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-[#c5a059] tracking-wider block">✓ Paso 1 Completado — Servicio Seleccionado</span>
                <h4 className="font-display italic font-bold text-base text-[#e2e8f0]">{selectedService.name}</h4>
                <p className="text-xs text-[#e2e8f0]/60 line-clamp-1 max-w-xl">{selectedService.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-start">
              <div className="text-left sm:text-right">
                <span className="block text-[8px] text-[#e2e8f0]/40 font-mono uppercase">Precio / Duración</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-sm text-[#c5a059]">${selectedService.price}</span>
                  <span className="text-xs text-[#e2e8f0]/50">• {selectedService.duration_minutes} min</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-[#2d333b] text-[#e2e8f0] px-3 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          </div>
        ) : (
          /* PASO 1 EXPANDIDO (GRILLA COMPLETA) */
          services.length === 0 ? (
            <div className="text-center py-12 text-[#e2e8f0]/40 bg-[#1c2128] border border-dashed border-[#2d333b] rounded-2xl">
              <Briefcase className="w-10 h-10 mx-auto mb-2 text-[#2d333b]" />
              <span className="text-xs font-semibold">Este negocio aún no tiene servicios publicados.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="detail-services-list">
              {services.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div 
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className={`bg-[#1c2128] border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected 
                        ? 'border-[#c5a059] ring-2 ring-[#c5a059]/20 bg-[#16191f]' 
                        : 'border-[#2d333b]'
                    }`}
                  >
                    <div>
                      {/* Imagen del Servicio */}
                      <div className="h-40 w-full relative bg-[#0f1115] group/img">
                        <img 
                          src={activeServiceImages[srv.id] || srv.image_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&fit=crop"} 
                          alt={srv.name}
                          className="w-full h-full object-cover opacity-80"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-[#c5a059] text-[#0f1115] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide shadow-md">
                            <Check className="w-2.5 h-2.5" /> Seleccionado
                          </div>
                        )}
                        
                        {/* Thumbnails if multiple images exist */}
                        {srv.image_urls && srv.image_urls.length > 0 && (
                          <div className="absolute bottom-2 left-2 right-2 flex gap-1 justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-xs p-1 rounded-lg">
                            {[srv.image_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&fit=crop", ...srv.image_urls].map((url, idx) => {
                              const isCurrent = (activeServiceImages[srv.id] || srv.image_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&fit=crop") === url;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveServiceImages(prev => ({ ...prev, [srv.id]: url }));
                                  }}
                                  className={`w-5 h-5 rounded-md border overflow-hidden shrink-0 transition-all ${
                                    isCurrent 
                                      ? 'border-[#c5a059] scale-110' 
                                      : 'border-slate-600 hover:border-slate-400'
                                  }`}
                                >
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Detalles del Servicio */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-display italic font-bold text-base text-[#e2e8f0] group-hover:text-[#c5a059] transition-colors leading-snug">
                          {srv.name}
                        </h4>
                        <p className="text-xs text-[#e2e8f0]/60 line-clamp-2 leading-relaxed min-h-[32px]">{srv.description}</p>
                      </div>
                    </div>

                    {/* Pie de la Tarjeta con Precio y Duración */}
                    <div className="p-4 border-t border-[#2d333b] bg-[#0f1115]/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-[#e2e8f0]/50 font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#c5a059]/70" />
                          <span>{srv.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-[#c5a059]">
                          ${srv.price}
                        </span>
                        <button
                          type="button"
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#c5a059] border-[#c5a059] text-[#0f1115]' 
                              : 'bg-[#0f1115] border-[#2d333b] text-[#e2e8f0] hover:bg-white/5'
                          }`}
                        >
                          {isSelected ? 'Elegido' : 'Elegir'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* PASO FINAL: CALENDARIO DE RESERVA - SE MUESTRA MUCHO MÁS GRANDE Y DEBAJO */}
      <div className="pt-4 border-t border-[#2d333b]">
        {selectedService ? (
          <div className="bg-[#1c2128] border border-[#c5a059]/30 rounded-2xl p-6 md:p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 space-y-6" id="booking-wizard-step">
            <div className="border-b border-[#2d333b] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Paso Final y Confirmación
                </span>
                <h3 className="font-display italic font-bold text-xl text-[#c5a059] mt-1.5 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#c5a059]" />
                  <span>Reserva tu cita para: {selectedService.name}</span>
                </h3>
                <p className="text-xs text-[#e2e8f0]/60 mt-1">
                  Elige un profesional de la empresa, selecciona tu día de preferencia en el calendario y escoge una hora disponible.
                </p>
              </div>

              <div className="bg-[#0f1115] border border-[#2d333b] px-4 py-2.5 rounded-xl flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-[#e2e8f0]/40 uppercase block">Total a pagar</span>
                  <span className="text-sm font-mono font-bold text-[#c5a059]">${selectedService.price}</span>
                </div>
                <div className="h-6 w-px bg-[#2d333b]" />
                <div>
                  <span className="text-[10px] text-[#e2e8f0]/40 uppercase block">Duración</span>
                  <span className="text-xs font-semibold text-[#e2e8f0]">{selectedService.duration_minutes} minutos</span>
                </div>
              </div>
            </div>

            {/* Calendario de Reserva expandido al 100% de ancho */}
            <div className="w-full">
              <BookingCalendar 
                business={business}
                service={selectedService}
                currentUser={currentUser}
                onRequireAuth={onRequireAuth}
                onSuccess={onSuccessBooking}
              />
            </div>
          </div>
        ) : (
          <div className="bg-[#1c2128] border border-dashed border-[#2d333b] rounded-2xl p-8 text-center flex flex-col justify-center items-center h-48">
            <div className="bg-[#0f1115] text-[#c5a059]/55 p-3 rounded-full border border-[#2d333b] shadow-sm mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h4 className="font-display italic font-bold text-sm text-[#c5a059]/80">Paso 2: Reserva de Agenda</h4>
            <p className="text-xs text-[#e2e8f0]/50 mt-1 max-w-sm leading-relaxed">
              Selecciona primero uno de los servicios en las tarjetas superiores para habilitar el calendario de reservas en tamaño expandido.
            </p>
          </div>
        )}
      </div>

      {/* Sección Inferior: Reseñas Verificadas */}
      <div className="border-t border-[#2d333b] pt-8">
        <ReviewList businessId={business.id} />
      </div>

      {/* VENTANA EMERGENTE DE CERTIFICADOS PROFESIONALES (MODAL) */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16191f] rounded-2xl shadow-2xl border border-[#2d333b] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Cabecera Modal */}
            <div className="bg-[#0f1115] border-b border-[#2d333b] p-6 flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#c5a059] tracking-wider block">Credenciales Oficiales</span>
                <h3 className="font-display italic font-bold text-lg leading-tight mt-1 text-[#c5a059]">Certificaciones Profesionales</h3>
                <p className="text-[#e2e8f0]/60 text-xs mt-0.5">{business.name}</p>
              </div>
              <button 
                onClick={() => setShowCertModal(false)}
                className="text-[#e2e8f0]/60 hover:text-[#e2e8f0] text-xs font-semibold border border-[#2d333b] px-2.5 py-1 rounded-md bg-white/5 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {(!business.certificates || business.certificates.length === 0) ? (
                <div className="text-center py-8 text-[#e2e8f0]/40">
                  <Award className="w-12 h-12 text-[#2d333b] mx-auto mb-2" />
                  <span className="text-xs font-semibold">Este negocio aún no cuenta con certificados registrados por el administrador.</span>
                </div>
              ) : (
                <div className="space-y-4" id="modal-certificates-list">
                  {business.certificates.map((cert: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 border border-[#2d333b] rounded-xl bg-[#0f1115]">
                      <div className="bg-[#c5a059]/10 text-[#c5a059] w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-[#c5a059]/30">
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display italic font-bold text-sm text-[#e2e8f0] leading-tight">
                          {cert.title}
                        </h4>
                        <span className="block text-xs text-[#e2e8f0]/70 mt-1 font-medium">{cert.institution}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Verificado por AgendaEC
                          </span>
                          <span className="text-[10px] text-[#e2e8f0]/40 font-mono font-medium">Año: {cert.year}</span>
                        </div>
                        {cert.file_url && (
                          <div className="mt-3 pt-2.5 border-t border-[#2d333b]/40">
                            <a
                              href={cert.file_url}
                              download={cert.file_name || 'certificado'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#c5a059] hover:text-[#b08d4a] transition-colors font-medium bg-[#1c2128] border border-[#2d333b] px-3 py-1.5 rounded-lg"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="max-w-[200px] truncate">Descargar {cert.file_name || 'Archivo'}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie Modal */}
            <div className="bg-[#0f1115] px-6 py-4 border-t border-[#2d333b] flex justify-end">
              <button
                onClick={() => setShowCertModal(false)}
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                id="modal-close-certs-btn"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
