import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Star, Sparkles, Building, ArrowRight, BookOpen, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { db } from '../lib/db';
import { Business, Category } from '../types';

interface CatalogProps {
  onSelectBusiness: (slug: string) => void;
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

export default function Catalog({ onSelectBusiness }: CatalogProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalogData = async () => {
      try {
        setLoading(true);
        const bizList = await db.getBusinesses();
        setBusinesses(bizList);

        const catList = await db.getCategories();
        setCategories(catList);
      } catch (err) {
        console.error('Error al cargar catálogo:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalogData();
  }, []);

  // Filtrado lógico
  const filteredBusinesses = businesses.filter((biz) => {
    const isVisible = biz.is_visible !== false;
    const matchesSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          biz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || biz.category === selectedCategory;
    return isVisible && matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="font-mono text-xs text-[#c5a059] animate-pulse">Sincronizando catálogo de empresas...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="catalog-view">
      {/* Hero Banner / Introducción */}
      <div className="bg-gradient-to-br from-[#16191f] to-[#0f1115] text-[#e2e8f0] rounded-2xl p-6 sm:p-10 relative overflow-hidden border border-[#2d333b] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6" id="catalog-hero">
        <div className="space-y-3.5 max-w-3xl text-center md:text-left z-10">
          <h1 className="font-display italic font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-[#c5a059]">
            Agenda tu Cita en los Mejores Negocios de la Ciudad
          </h1>
          <p className="text-[#e2e8f0]/70 text-xs sm:text-sm leading-relaxed">
            Explora de manera segura y transparente los perfiles independientes, certificados oficiales, opiniones verificadas y profesionales de cada establecimiento de la red.
          </p>
        </div>
        <div className="hidden w-full sm:w-auto shrink-0 bg-[#1c2128] border border-[#2d333b] p-6 rounded-2xl text-center sm:text-left z-10">
          <span className="text-[9px] text-[#e2e8f0]/40 uppercase font-bold tracking-wider block">Estatus Global</span>
          <span className="font-display italic font-bold text-lg text-[#c5a059] block mt-1">100% Operativo</span>
          <span className="text-[11px] text-[#e2e8f0]/60 block mt-1">Calendarios sincronizados en tiempo real.</span>
        </div>
        {/* Subtle glow background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Buscador & Filtros */}
      <div className="bg-[#1c2128] rounded-xl border border-[#2d333b] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="catalog-filters">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#c5a059]" />
          <input
            type="text"
            placeholder="Buscar por nombre del negocio o palabras clave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/40 transition-all"
            id="search-input"
          />
        </div>

        {/* Categorías (Pills) */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-none" id="category-filter-list">
          <button
            onClick={() => setSelectedCategory('Todos')}
            className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
              selectedCategory === 'Todos'
                ? 'bg-[#c5a059] border-[#c5a059] text-[#0f1115] shadow-md'
                : 'bg-[#0f1115] border-[#2d333b] text-[#e2e8f0]/70 hover:text-[#e2e8f0] hover:bg-white/5'
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.name)}
              className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                selectedCategory === c.name
                  ? 'bg-[#c5a059] border-[#c5a059] text-[#0f1115] shadow-md'
                  : 'bg-[#0f1115] border-[#2d333b] text-[#e2e8f0]/70 hover:text-[#e2e8f0] hover:bg-white/5'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Negocios en Formato de Tarjetas (Grid) */}
      {filteredBusinesses.length === 0 ? (
        <div className="bg-[#1c2128] border border-[#2d333b] p-16 text-center rounded-2xl shadow-sm" id="empty-catalog">
          <Building className="w-12 h-12 text-[#c5a059]/40 mx-auto mb-3" />
          <span className="text-sm font-semibold text-[#e2e8f0] block">No se encontraron negocios</span>
          <p className="text-xs text-[#e2e8f0]/50 mt-1">Prueba cambiando tu búsqueda o seleccionando otra categoría global.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="businesses-catalog-grid">
          {filteredBusinesses.map((biz) => {
            return (
              <div 
                key={biz.id} 
                onClick={() => onSelectBusiness(biz.slug)}
                className="bg-[#1c2128] border border-[#2d333b] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#c5a059]/40 transition-all flex flex-col justify-between group cursor-pointer"
              >
                {/* Portada Mini */}
                <div className="h-40 relative overflow-hidden bg-[#0f1115] flex items-center justify-center">
                  {biz.cover_url ? (
                    <img 
                      src={biz.cover_url} 
                      alt={biz.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#16191f] to-[#0f1115] flex flex-col items-center justify-center text-[#e2e8f0]/30 p-4">
                      <ImageIcon className="w-7 h-7 text-[#c5a059]/40 mb-1" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#c5a059]/60">Sin foto de portada</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c2128] via-transparent to-transparent" />
                  
                  {/* Logo Superpuesto */}
                  {biz.logo_url ? (
                    <img 
                      src={biz.logo_url} 
                      alt={`${biz.name} logo`}
                      className="absolute bottom-3 left-3 w-10 h-10 rounded-lg object-cover border border-[#2d333b] bg-[#16191f] shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute bottom-3 left-3 w-10 h-10 rounded-lg border border-[#2d333b] bg-[#16191f] shadow-lg flex items-center justify-center text-[#c5a059] text-sm font-extrabold uppercase select-none">
                      {biz.name.charAt(0)}
                    </div>
                  )}

                  {/* Categoría */}
                  <span className="absolute top-3 right-3 bg-[#0f1115]/80 backdrop-blur-sm text-[#c5a059] border border-[#c5a059]/30 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {biz.category}
                  </span>
                </div>

                {/* Info */}
                <div className="p-5 space-y-3.5 flex-1">
                  <div>
                    <h3 className="font-display italic font-bold text-base text-[#e2e8f0] group-hover:text-[#c5a059] transition-colors">
                      {biz.name}
                    </h3>
                    <p className="text-xs text-[#e2e8f0]/60 mt-1.5 line-clamp-2 leading-relaxed">
                      {biz.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-[#e2e8f0]/50 border-t border-[#2d333b] pt-3.5">
                    {biz.google_maps_url ? (
                      <a
                        href={biz.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#e2e8f0]/50 hover:text-[#c5a059] transition-colors cursor-pointer select-none group/map"
                        onClick={(e) => e.stopPropagation()}
                        title="Ver ubicación en Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#c5a059] group-hover/map:scale-110 transition-transform" />
                        <span className="truncate hover:underline">{biz.address}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span className="truncate">{biz.address}</span>
                      </div>
                    )}
                    <a
                      href={getWhatsAppUrl(biz.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#e2e8f0]/50 hover:text-[#c5a059] transition-colors cursor-pointer select-none group/phone"
                      onClick={(e) => e.stopPropagation()}
                      title="Contactar por WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#c5a059] group-hover/phone:scale-110 transition-transform" />
                      <span className="font-mono hover:underline">{biz.phone}</span>
                    </a>
                  </div>
                </div>

                {/* Botón de Acción */}
                <div className="px-5 pb-5 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBusiness(biz.slug);
                    }}
                    className="w-full bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md group-hover:translate-y-[-1px]"
                  >
                    <span>Ver Servicios & Reservar</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Banner para Dueños de Negocio */}
      <div className="bg-gradient-to-r from-[#1c2128] via-[#16191f] to-[#1c2128] border border-[#2d333b] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden" id="business-owner-cta">
        <div className="space-y-2 text-center md:text-left z-10">
          <h2 className="font-display italic font-bold text-xl sm:text-2xl text-[#e2e8f0]">
            ¿Quieres que tu negocio aparezca aquí?
          </h2>
          <p className="text-[#e2e8f0]/60 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Únete a la plataforma líder de reservas online en Ecuador. Digitaliza tus servicios, organiza tu agenda y llega a cientos de nuevos clientes de manera profesional.
          </p>
        </div>
        <div className="shrink-0 z-10 w-full md:w-auto">
          <a
            href="https://wa.me/593984056660?text=tengo%20un%20negocio%20para%20AgendaEC"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-lg hover:translate-y-[-1px] select-none cursor-pointer"
            id="whatsapp-cta-button"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Contáctanos por WhatsApp</span>
          </a>
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#25D366]/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
