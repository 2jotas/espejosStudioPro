import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FolderSync, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface GalleryItem {
  id: string;
  filePath: string;
  source: 'upload' | 'watched_folder';
  caption: string | null;
  createdAt: string;
}

export default function GalleryManager() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error('Error al cargar la galería');
      const data = await res.json();
      setImages(data.images);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al subir imagen');

      fetchGallery();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta imagen de tu galería?')) return;

    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Galería de Trabajos "Espejos"</h2>
          <p className="text-slate-400 text-sm">Muestra tus mejores cortes y tratamientos a tus clientes</p>
        </div>

        <label className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2 w-fit cursor-pointer">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Subir Foto</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
        </label>
      </div>

      {/* Auto-Watch Folder Banner for Pro Users */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-start space-x-4">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <FolderSync className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-white text-sm">Auto-Publicación desde Carpeta</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Plan Pro
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-2">
              Copia o guarda tus fotos en la carpeta asignada a tu espacio y se auto-publicarán con reflejo visual automáticamente:
            </p>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-400 w-fit">
              ./uploads/gallery-watch/{user?.id}/
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="mb-4 text-sm">Aún no has subido fotos a tu galería.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              {/* Photo with Mirror Effect */}
              <div className="relative aspect-square overflow-hidden bg-slate-950">
                <img
                  src={img.filePath}
                  alt={img.caption || 'Galería Espejos'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Source Tag Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 border border-slate-800 backdrop-blur-md rounded-md text-[10px] font-semibold text-slate-300 uppercase">
                {img.source === 'watched_folder' ? 'Auto-Watch' : 'Manual'}
              </div>

              {/* Delete Hover Overlay */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="p-3 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl shadow-lg transition-colors"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
