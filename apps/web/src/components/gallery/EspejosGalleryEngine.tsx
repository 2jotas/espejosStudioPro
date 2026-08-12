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
            Todas las Fotos ({images.length})
          </button>
        </div>

        {/* Visual Color Preset Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1.5 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Tono Visual:</span>
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
        /* High-Performance Mirror Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {images.map((img, idx) => (
            <div key={img.id} className="group relative flex flex-col">
              {/* Main Beveled Mirror Frame */}
              <div
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-square rounded-3xl overflow-hidden cursor-pointer border border-white/10 shadow-2xl bg-slate-950 transform-gpu transition-all duration-500 group-hover:scale-[1.03] group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/20"
              >
                {/* Metallic Bevel Inner Overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/10 group-hover:ring-indigo-400/30 transition-all" />

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
                <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 backdrop-blur-[2px]">
                  <span className="text-xs text-white font-medium truncate max-w-[70%]">
                    {img.caption || 'Ver en alta definición'}
                  </span>
                  <div className="p-2 bg-indigo-600/90 text-white rounded-xl shadow-lg">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Admin Mode Delete Button */}
                {mode === 'admin' && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(img.id);
                    }}
                    className="absolute top-3 right-3 z-30 p-2.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl shadow-xl transition-all"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Ultra-smooth Hardware Accelerated Mirror Reflection */}
              <div className="relative aspect-[1/0.3] overflow-hidden rounded-b-3xl opacity-35 scale-y-[-1] pointer-events-none mt-1 select-none transform-gpu transition-opacity group-hover:opacity-60">
                <img
                  src={img.filePath}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ filter: getFilterStyle(colorFilter) }}
                  className="w-full h-full object-cover blur-[2px]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/70 to-slate-950" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activeImage && lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8">
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-3 bg-slate-900/80 text-slate-300 hover:text-white rounded-2xl border border-slate-800 z-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Image */}
          {lightboxIndex > 0 && (
            <button
              onClick={() => setLightboxIndex(lightboxIndex - 1)}
              className="absolute left-4 sm:left-8 p-3 bg-slate-900/80 text-white rounded-2xl border border-slate-800 z-50 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Image */}
          {lightboxIndex < images.length - 1 && (
            <button
              onClick={() => setLightboxIndex(lightboxIndex + 1)}
              className="absolute right-4 sm:right-8 p-3 bg-slate-900/80 text-white rounded-2xl border border-slate-800 z-50 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Modal Content */}
          <div className="max-w-4xl w-full flex flex-col items-center space-y-4 text-center">
            <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl max-h-[75vh]">
              <img
                src={activeImage.filePath}
                alt={activeImage.caption || 'Foto Espejos'}
                style={{ filter: getFilterStyle(colorFilter) }}
                className="max-h-[75vh] w-auto object-contain rounded-3xl"
              />
            </div>

            {activeImage.caption && (
              <p className="text-white text-base font-semibold bg-slate-900/80 px-6 py-2.5 rounded-2xl border border-slate-800">
                {activeImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
