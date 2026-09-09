import { useState, useEffect } from 'react';
import { Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbUrl?: string | null;
  title?: string | null;
  sort: number;
  publishedAt?: string | null;
  createdAt?: string;
}

// Format short date in America/Santiago (e.g. "9 sep 2026")
function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function MirrorGallery({ 
  slug, 
  displayName 
}: { 
  slug: string; 
  displayName?: string; 
}) {
  const [images, setImages] = useState<GalleryPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 1. Fetch Gallery Data
  useEffect(() => {
    if (!slug) return;
    const fetchGallery = async () => {
      try {
        const res = await fetch(`/api/professionals/${slug}/gallery`);
        if (res.ok) {
          const data = await res.json();
          setImages(data.images || []);
        }
      } catch (e) {
        console.error('Error cargando galería:', e);
      }
    };

    fetchGallery();
  }, [slug]);

  // 2. Keyboard Navigation for Lightbox (Unconditional Hook)
  useEffect(() => {
    if (lightboxIndex === null || images.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev !== null && images.length > 0 ? (prev - 1 + images.length) % images.length : null));
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev !== null && images.length > 0 ? (prev + 1) % images.length : null));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, images.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && images.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && images.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  // 3. Early Return ONLY after all hooks are executed
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  const activePhoto = (lightboxIndex !== null && images[lightboxIndex]) ? images[lightboxIndex] : null;

  return (
    <section className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 text-left space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Galería Espejos
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono font-medium">
          {images.length} {images.length === 1 ? 'espejo' : 'espejos'}
        </span>
      </div>

      {/* Grid: 2 cols on mobile, 3 cols on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {images.map((img, idx) => {
          const dateLabel = formatShortDate(img.publishedAt || img.createdAt);
          const altText = `${img.title || 'Corte de Autor'} · Espejos Studio · ${displayName || 'John'}`;
          
          return (
            <div
              key={img.id}
              onClick={() => setLightboxIndex(idx)}
              className="group cursor-pointer flex flex-col space-y-1.5"
            >
              {/* Marco "Espejo Neón" (4:5 Retrato, sutil glow, bisel interno de vidrio) */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-950 border-2 border-[#8B7CFF]/45 shadow-[0_0_14px_rgba(139,124,255,0.18)] hover:border-[#8B7CFF]/85 hover:shadow-[0_0_22px_rgba(139,124,255,0.28)] transition-all duration-300 transform-gpu hover:scale-[1.015]">
                {/* Bisel interno efecto vidrio */}
                <div className="absolute inset-0 ring-1 ring-white/15 ring-inset rounded-2xl pointer-events-none z-10" />
                
                {/* Fotografía Nítida (Sin filtros de color, crop center) */}
                <img
                  src={img.thumbUrl || img.url}
                  alt={altText}
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                />

                {/* Título flotante sutil si existe (al fondo de la foto) */}
                {img.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-2 pt-4 z-10 pointer-events-none">
                    <p className="text-[11px] text-white font-medium truncate">{img.title}</p>
                  </div>
                )}
              </div>

              {/* Placa limpia de fecha DEBAJO del marco (no tapa la cara) */}
              {dateLabel && (
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-mono">
                  <span>{dateLabel}</span>
                  <span className="text-[10px] text-slate-600">Espejos</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal con Marco "Espejo Neón" */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 sm:left-6 z-50 p-3 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-3 sm:right-6 z-50 p-3 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Active Image Container */}
          <div 
            className="max-w-md w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Marco Espejo Neón en Lightbox */}
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-slate-950 border-2 border-[#8B7CFF]/60 shadow-[0_0_28px_rgba(139,124,255,0.25)]">
              <div className="absolute inset-0 ring-1 ring-white/20 ring-inset rounded-3xl pointer-events-none z-10" />
              <img
                src={activePhoto.url}
                alt={`${activePhoto.title || 'Corte'} · Espejos Studio`}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Placa de Detalles al Pie */}
            <div className="mt-3.5 w-full flex items-center justify-between px-2 text-xs">
              <div className="text-left">
                {activePhoto.title && (
                  <p className="font-semibold text-white text-sm">{activePhoto.title}</p>
                )}
                <p className="text-slate-400 text-xs">
                  {formatShortDate(activePhoto.publishedAt || activePhoto.createdAt)} · {displayName || 'John'}
                </p>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                {(lightboxIndex ?? 0) + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
