import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { GalleryItem } from '../admin/GalleryManager';

export default function MirrorGallery({ slug }: { slug: string }) {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/professionals/${slug}/gallery`);
        if (res.ok) {
          const data = await res.json();
          setImages(data.images);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [slug]);

  if (isLoading || images.length === 0) return null;

  return (
    <section className="mt-12 text-left space-y-6">
      <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
        <Sparkles className="w-4 h-4" />
        <span>Galería de Trabajos "Espejos"</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="relative group">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
              <img
                src={img.filePath}
                alt={img.caption || 'Trabajo Espejos'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Inverted Reflection Effect (CSS Mirror Reflection) */}
            <div className="relative aspect-[1/0.35] overflow-hidden rounded-b-2xl opacity-40 scale-y-[-1] pointer-events-none mt-1 select-none">
              <img
                src={img.filePath}
                alt=""
                className="w-full h-full object-cover blur-[1px]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/70 to-slate-950" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
