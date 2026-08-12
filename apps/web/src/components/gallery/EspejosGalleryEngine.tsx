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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      {/* Storytelling Manifesto Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Colección de Espejos & Reflejos</span>
        </div>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Cada foto representa una historia única realizada en un cliente: una técnica a la medida, un acabado distintivo y una experiencia diferente proyectada en el reflejo.
        </p>
      </div>

      {/* Gallery Header & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-6 backdrop-blur-xl">
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas las Historias ({images.length})
          </button>
        </div>

        {/* Visual Color Preset Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1.5 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Filtro Óptico:</span>
          </span>
          {(['none', 'monochrome', 'warm', 'cool', 'vivid'] as ColorFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setColorFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all border ${
                colorFilter === f
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {f === 'none' ? 'Original' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Skeleton / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-slate-900/40 rounded-3xl border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm">No hay imágenes publicadas en esta galería todavía.</p>
        </div>
      ) : (
        /* High-Performance Neon Mirror Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {images.map((img, idx) => (
            <div
              key={img.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative cursor-pointer flex flex-col"
            >
              {/* Neon Ambient Backdrop Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-pink-500/25 rounded-[30px] blur-md opacity-40 group-hover:opacity-100 group-hover:blur-lg transition-all duration-500" />

              {/* Main Metallic Neon Mirror Frame */}
              <div className="relative aspect-square rounded-[26px] overflow-hidden bg-slate-950 p-[3px] border border-indigo-500/30 group-hover:border-indigo-400 transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_35px_rgba(129,140,248,0.45)] transform-gpu group-hover:scale-[1.03]">
                {/* Inner Metallic Rim Overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none rounded-[24px] ring-1 ring-inset ring-white/15 group-hover:ring-indigo-300/40 transition-all" />

                <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-slate-950">
                  {/* Lazy-loaded Hardware Accelerated Image */}
                  <img
                    src={img.filePath}
                    alt={img.caption || 'Trabajo Espejos'}
                    loading="lazy"
                    decoding="async"
                    style={{ filter: getFilterStyle(colorFilter) }}
                    className="w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Glassmorphism Hover Overlay */}
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3.5 backdrop-blur-[2px]">
                    <span className="text-[11px] text-slate-200 font-semibold truncate max-w-[75%]">
                      {img.caption || 'Ver reflejo'}
                    </span>
                    <div className="p-1.5 bg-indigo-600/90 text-white rounded-lg shadow-lg">
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
