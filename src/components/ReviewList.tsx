import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../lib/db';
import { Review } from '../types';

interface ReviewListProps {
  businessId: string;
}

export default function ReviewList({ businessId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  const loadReviews = async () => {
    try {
      const data = await db.getReviews(businessId);
      setReviews(data);
    } catch (err) {
      console.error('Error al cargar reseñas:', err);
    }
  };

  useEffect(() => {
    loadReviews();
    setCarouselIndex(0);
  }, [businessId]);

  // Calcular estadísticas de reseñas
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 5.0;

  // Manejadores carrusel
  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-6" id="reviews-section">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[#c5a059]" />
        <h3 className="font-display italic font-bold text-xl text-[#c5a059]">Reseñas de Clientes Verificados</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estadísticas de Calificaciones */}
        <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] font-bold text-[#e2e8f0]/40 uppercase tracking-wider">Calificación Promedio</span>
          <span className="text-5xl font-display font-extrabold text-[#c5a059] mt-2 font-mono">{averageRating}</span>
          
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`w-4 h-4 ${
                  s <= Math.round(averageRating) 
                    ? 'text-[#c5a059] fill-[#c5a059]' 
                    : 'text-[#2d333b]'
                }`} 
              />
            ))}
          </div>

          <span className="text-xs text-[#e2e8f0]/60 mt-2 font-medium">{totalReviews} opiniones verificadas</span>
        </div>

        {/* Carrusel de Comentarios Verificados */}
        <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl md:col-span-2 flex flex-col justify-between min-h-[160px] relative">
          <span className="text-[10px] font-bold text-[#e2e8f0]/40 uppercase tracking-wider mb-2 block">Carrusel de Experiencias</span>
          
          {reviews.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-center py-6">
              <span className="text-xs text-[#e2e8f0]/40">Este negocio aún no tiene opiniones verificadas.</span>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-xs text-[#e2e8f0] block">
                      {reviews[carouselIndex]?.client_name || 'Anónimo'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Cita Atendida</span>
                      </span>
                      <span className="text-[9px] text-[#e2e8f0]/40 font-medium">
                        {reviews[carouselIndex]?.created_at 
                          ? new Date(reviews[carouselIndex].created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-3.5 h-3.5 ${
                          s <= (reviews[carouselIndex]?.rating || 5) 
                            ? 'text-[#c5a059] fill-[#c5a059]' 
                            : 'text-[#2d333b]'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#e2e8f0]/80 leading-relaxed italic pr-6 pt-1">
                  "{reviews[carouselIndex]?.comment || 'Excelente atención.'}"
                </p>
              </div>

              {/* Controles del Carrusel */}
              <div className="flex justify-between items-center pt-3 border-t border-[#2d333b]">
                <span className="text-[10px] text-[#e2e8f0]/40 font-semibold font-mono">
                  {carouselIndex + 1} de {reviews.length} opiniones
                </span>
                <div className="flex gap-1">
                  <button 
                    type="button"
                    onClick={handlePrevCarousel}
                    className="p-1 rounded bg-[#0f1115] border border-[#2d333b] hover:border-[#c5a059]/50 text-[#e2e8f0] transition-colors cursor-pointer"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleNextCarousel}
                    className="p-1 rounded bg-[#0f1115] border border-[#2d333b] hover:border-[#c5a059]/50 text-[#e2e8f0] transition-colors cursor-pointer"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

