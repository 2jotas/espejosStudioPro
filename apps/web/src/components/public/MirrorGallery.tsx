import { Sparkles } from 'lucide-react';
import EspejosGalleryEngine from '../gallery/EspejosGalleryEngine';

export default function MirrorGallery({ slug }: { slug: string }) {
  return (
    <section className="mt-12 text-left space-y-6">
      <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
        <Sparkles className="w-4 h-4" />
        <span>Galería de Trabajos "Espejos"</span>
      </div>

      <EspejosGalleryEngine slug={slug} mode="public" />
    </section>
  );
}
