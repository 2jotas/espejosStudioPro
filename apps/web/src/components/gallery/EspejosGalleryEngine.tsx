import { useState, useEffect } from 'react';
import { Sparkles, Maximize2, Trash2, X, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryItem } from '../admin/GalleryManager';

export interface EspejosGalleryEngineProps {
  slug: string;
  mode?: 'public' | 'admin';
  images?: GalleryItem[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

type ColorFilter = 'none' | 'monochrome' | 'warm' | 'cool' | 'vivid';

export default function EspejosGalleryEngine({
  slug,
  mode = 'public',
  images: initialImages,
  onDelete,
  isLoading: externalLoading = false,
}: EspejosGalleryEngineProps) {
  const [images, setImages] = useState<GalleryItem[]>(initialImages || []);
  const [isLoading, setIsLoading] = useState<boolean>(externalLoading);
  const [colorFilter, setColorFilter] = useState<ColorFilter>('none');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Sync external loading state
  useEffect(() => {
    setIsLoading(externalLoading);
  }, [externalLoading]);

  // Sync external images if provided
  useEffect(() => {
    if (initialImages) {
      setImages(initialImages);
    }
  }, [initialImages]);

  // Fetch images automatically if not passed as prop
  useEffect(() => {
    if (initialImages) return;

    const fetchGallery = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/professionals/${slug}/gallery`);
        if (res.ok) {
          const data = await res.json();
          setImages(data.images);
        }
      } catch (e) {
        console.error('Error cargando la galería:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [slug, initialImages]);

  // CSS Filter Mapping (Pure CSS GPU accelerated)
  const getFilterStyle = (filter: ColorFilter) => {
    switch (filter) {
      case 'monochrome':
        return 'grayscale(100%) contrast(110%)';
      case 'warm':
        return 'sepia(25%) saturate(120%) hue-rotate(-10deg)';
      case 'cool':
        return 'saturate(110%) hue-rotate(10deg) brightness(102%)';
      case 'vivid':
        return 'saturate(150%) contrast(105%)';
      default:
        return 'none';
    }
  };

  const activeImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <div className="space-y-6 text-left">
      {/* Dimmed Soft White Wall Gallery Container */}
      <div className="bg-gradient-to-b from-stone-100 via-zinc-200/90 to-stone-200 border border-stone-300/80 rounded-[32px] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative overflow-hidden">
        {/* Gallery Header & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 border border-stone-300/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-sm mb-8">
          {/* Title with Intermittent Sparkling Glow */}
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
            <h3 className="text-base font-extrabold uppercase tracking-widest text-slate-900">
              Espejos
            </h3>
            <span className="text-xs text-slate-500 font-mono">({images.length})</span>
          </div>

          {/* Visual Color Preset Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-600 font-semibold flex items-center space-x-1.5 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Filtro Óptico:</span>
            </span>
            {(['none', 'monochrome', 'warm', 'cool', 'vivid'] as ColorFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setColorFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all border ${
                  colorFilter === f
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white/80 text-slate-700 border-stone-300 hover:bg-white hover:text-slate-900 shadow-xs'
                }`}
              >
                {f === 'none' ? 'Original' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Skeleton / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-stone-300/50 rounded-3xl border border-stone-300 animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="bg-white/60 border border-stone-300/80 rounded-3xl p-12 text-center text-slate-500">
            <Sparkles className="w-10 h-10 text-amber-500/60 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-medium">No hay cuadros exhibidos en esta galería todavía.</p>
          </div>
        ) : (
          /* Minimalist White Wall Grid with Top Spotlight Lamps */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-10">
            {images.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative cursor-pointer flex flex-col items-center"
              >
                {/* Top Spotlight Lamp Fixture Bar */}
                <div className="w-14 h-1.5 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 rounded-full mx-auto shadow-[0_2px_8px_rgba(245,158,11,0.5)] z-20 relative mb-2" />

                {/* Soft Warm Spotlight Cone / Beam Radiating Downwards */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-44 h-52 bg-gradient-to-b from-amber-300/40 via-amber-200/15 to-transparent blur-md pointer-events-none rounded-t-full opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Museum Mirror Frame (Dimmed White Wall Hanging Frame) */}
                <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-slate-950 p-[3px] border-4 border-slate-950 ring-1 ring-amber-400/30 group-hover:ring-amber-400/80 group-hover:border-slate-800 transition-all duration-500 shadow-[0_15px_30px_rgba(0,0,0,0.18)] group-hover:shadow-[0_25px_45px_rgba(0,0,0,0.28)] transform-gpu group-hover:scale-[1.02]">
                  {/* Inner Frame Rim Overlay */}
                  <div className="absolute inset-0 z-10 pointer-events-none rounded-[20px] ring-1 ring-inset ring-white/15 group-hover:ring-amber-200/40 transition-all" />

                  <div className="relative w-full h-full rounded-[18px] overflow-hidden bg-slate-950">
                    {/* Lazy-loaded Image */}
                    <img
                      src={img.filePath}
                      alt={img.caption || 'Trabajo del día'}
                      loading="lazy"
                      decoding="async"
                      style={{ filter: getFilterStyle(colorFilter) }}
                      className="w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Glassmorphism Hover Overlay */}
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3.5 backdrop-blur-[2px]">
                      <span className="text-[11px] text-slate-100 font-semibold truncate max-w-[75%]">
                        {img.caption || 'Ver cuadro'}
                      </span>
                      <div className="p-1.5 bg-amber-500/90 text-slate-950 rounded-lg shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Admin Mode Delete Button */}
                  {mode === 'admin' && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(img.id);
                      }}
                      className="absolute top-3 right-3 z-30 p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl shadow-xl transition-all"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtle Lightbox Inspection Modal */}
      {activeImage && lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(99,102,241,0.25)] relative text-center flex flex-col items-center space-y-4">
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/80 text-slate-400 hover:text-white rounded-xl border border-slate-800 z-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Previous Image */}
            {lightboxIndex > 0 && (
              <button
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/80 text-white rounded-xl border border-slate-800 z-50 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next Image */}
            {lightboxIndex < images.length - 1 && (
              <button
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/80 text-white rounded-xl border border-slate-800 z-50 hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Frame & Image */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-h-[50vh] bg-slate-950 p-1">
              <img
                src={activeImage.filePath}
                alt={activeImage.caption || 'Foto Espejos'}
                style={{ filter: getFilterStyle(colorFilter) }}
                className="max-h-[50vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Espejo de Historia #{lightboxIndex + 1}
              </h4>
              {activeImage.caption && (
                <p className="text-slate-200 text-xs font-medium">
                  {activeImage.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
