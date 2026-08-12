import EspejosGalleryEngine from '../gallery/EspejosGalleryEngine';

export default function MirrorGallery({ slug }: { slug: string }) {
  return (
    <section className="mt-12 text-left">
      <EspejosGalleryEngine slug={slug} mode="public" />
    </section>
  );
}
