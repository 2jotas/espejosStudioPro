import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface GalleryItem {
  id: string;
  professionalId: string;
  url: string;
  thumbUrl: string | null;
  title: string | null;
  sort: number;
  published: boolean;
  hasFaceConsent: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface TodayQuota {
  isPublishedToday: boolean;
  todayPublishedId: string | null;
  todayPublishedTitle: string | null;
  todaySantiago: string;
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

// Format date to YYYY-MM-DD input value
function toDateInputValue(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export default function GalleryManager() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [todayQuota, setTodayQuota] = useState<TodayQuota | null>(null);
  const [bulkImportEnabled, setBulkImportEnabled] = useState<boolean>(false);
  const [galleryLook, setGalleryLook] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string>('');
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error('Error al cargar la galería.');
      const data = await res.json();
      setImages(data.images || []);
      setBulkImportEnabled(Boolean(data.bulkImportEnabled));
      setGalleryLook(data.galleryLook || 'none');
      if (data.todayQuota) {
        setTodayQuota(data.todayQuota);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // Sequential multi-file upload handler with real-time progress & error protection
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    let uploadedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Subiendo y optimizando foto ${i + 1} de ${files.length} (${file.name})...`);

      // Client-side file size check (25MB)
      if (file.size > 25 * 1024 * 1024) {
        errors.push(`"${file.name}" supera los 25 MB permitidos (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/gallery/upload', {
          method: 'POST',
          body: formData,
        });

        let data: any = {};
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (!res.ok) {
            throw new Error(
              res.status === 413
                ? `"${file.name}" supera el límite de tamaño permitido por el servidor.`
                : `Error del servidor (${res.status}) al procesar "${file.name}".`
            );
          }
        }

        if (!res.ok) {
          throw new Error(data.message || `Error al subir "${file.name}".`);
        }

        uploadedCount++;
      } catch (err: any) {
        errors.push(err.message || `Fallo al procesar "${file.name}".`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';

    if (uploadedCount > 0) {
      setSuccessMsg(`✅ ${uploadedCount} foto(s) subida(s) correctamente como borrador.`);
      fetchGallery();
    }
    if (errors.length > 0) {
      setError(errors.join(' | '));
    }

    setIsUploading(false);
    setUploadProgress(null);
  };

  // Toggle Publish Status
  const handleTogglePublish = async (img: GalleryItem) => {
    setError(null);
    setSuccessMsg(null);

    // If trying to publish without consent
    if (!img.published && !img.hasFaceConsent) {
      setError('Debes marcar la casilla de consentimiento del cliente ("Tengo permiso del cliente") antes de publicar.');
      return;
    }

    const payload: { published: boolean; publishedAt?: string } = {
      published: !img.published,
    };

    // If publishing in Bulk mode, send haircut date
    if (!img.published && bulkImportEnabled) {
      const selectedDate = dateDrafts[img.id] || toDateInputValue(img.publishedAt) || toDateInputValue(img.createdAt);
      if (!selectedDate) {
        setError('En modo archivo debes especificar la fecha del corte antes de publicar.');
        return;
      }
      payload.publishedAt = selectedDate;
    }

    try {
      const res = await fetch(`/api/gallery/${img.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.message || 'Hoy ya publicaste tu Espejo. Mañana puedes subir otro.');
        }
        throw new Error(data.message || 'Error al actualizar estado.');
      }

      setSuccessMsg(img.published ? 'Foto pasada a borrador.' : '✨ ¡Foto publicada exitosamente en tu vitrina pública!');
      fetchGallery();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Toggle Face Consent Checkbox
  const handleToggleConsent = async (img: GalleryItem, value: boolean) => {
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${img.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hasFaceConsent: value,
          // If unchecking consent, automatically unpublish
          published: value ? img.published : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar consentimiento.');

      setImages((prev) =>
        prev.map((item) =>
          item.id === img.id
            ? { ...item, hasFaceConsent: value, published: value ? img.published : false }
            : item
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Save Haircut Date
  const handleSaveHaircutDate = async (id: string, dateStr: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishedAt: dateStr }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar fecha.');

      setImages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, publishedAt: dateStr } : item))
      );
      setSuccessMsg('Fecha de corte actualizada.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Save Title
  const handleSaveTitle = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleDraft.trim() || null }),
      });

      if (!res.ok) throw new Error('Error al guardar título.');

      setImages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title: titleDraft.trim() || null } : item))
      );
      setEditingTitleId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reorder Item Up/Down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(targetIndex, 0, moved);

    setImages(newImages);

    try {
      const orderedIds = newImages.map((img) => img.id);
      await fetch('/api/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (e) {
      console.error('Error guardando reordenamiento:', e);
      fetchGallery();
    }
  };

  // Delete Image
  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.')) return;

    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        setSuccessMsg('Foto eliminada correctamente.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Copy Direct Public URL for Meta Ads
  const handleCopyUrl = (img: GalleryItem) => {
    const baseUrl = window.location.origin;
    const fullPublicUrl = `${baseUrl}${img.url}`;
    navigator.clipboard.writeText(fullPublicUrl);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Reprocess existing images with active look
  const handleReprocess = async () => {
    if (!window.confirm('¿Reprocesar todas las fotos de tu galería con el look actual ("Espejos Neutral+")?')) return;
    try {
      setIsUploading(true);
      setUploadProgress('Reprocesando fotos con el grade Espejos Neutral+...');
      const res = await fetch('/api/gallery/reprocess', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✨ ${data.message}`);
        fetchGallery();
      } else {
        throw new Error(data.message || 'Error al reprocesar.');
      }
    } catch (e: any) {
      setError(e.message || 'Error al reprocesar fotos.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const publishedCount = images.filter((img) => img.published).length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-extrabold text-white">Galería Espejos</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {publishedCount} / 12 publicadas
            </span>
            {galleryLook === 'espejos_neutral' && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-[#8B7CFF] border border-[#8B7CFF]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Look: Espejos Neutral+
              </span>
            )}
            {bulkImportEnabled && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Modo Archivo (Bulk)
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Muestra tus mejores cortes y visagismos en tu página pública (<span className="text-indigo-400 font-mono">espejosstudio.cl/{user?.slug}</span>). Un Espejo por día. Elige la mejor toma.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {images.length > 0 && galleryLook === 'espejos_neutral' && (
            <button
              onClick={handleReprocess}
              disabled={isUploading}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Aplica el look Espejos Neutral+ a todas las fotos existentes"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
              <span>Reprocesar Look</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
            disabled={isUploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadProgress || 'Procesando...'}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Subir Fotos (JPG, PNG, WebP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner de Régimen de Publicación */}
      {bulkImportEnabled ? (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                Modo archivo activo
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Modo archivo: carga el álbum atrasado con la fecha de cada corte. El cupo diario se activa cuando se apague este modo.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-2xl border transition-all ${
          todayQuota?.isPublishedToday 
            ? 'bg-indigo-950/40 border-[#8B7CFF]/40 shadow-[0_0_15px_rgba(139,124,255,0.12)]' 
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-3">
              <div className={`p-2 rounded-xl ${todayQuota?.isPublishedToday ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Espejo de hoy:
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    todayQuota?.isPublishedToday 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {todayQuota?.isPublishedToday ? '✅ Publicado' : '⏳ Pendiente'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {todayQuota?.isPublishedToday
                    ? `Hoy ya publicaste tu Espejo ("${todayQuota.todayPublishedTitle || 'Corte del día'}"). Mañana puedes subir otro.`
                    : 'Un Espejo por día. Elige tu mejor toma y publícala en tu vitrina pública.'}
                </p>
              </div>
            </div>
            {todayQuota?.isPublishedToday && todayQuota.todayPublishedId && (
              <button
                onClick={() => {
                  const todayImg = images.find(i => i.id === todayQuota.todayPublishedId);
                  if (todayImg) handleTogglePublish(todayImg);
                }}
                className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                Reemplazar la de hoy (Despublicar)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 text-xs flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Gallery List / Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Cargando fotos de tu espacio...</span>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 space-y-3">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-300 text-sm">Tu Galería Espejos está vacía</h3>
          <p className="text-xs max-w-sm mx-auto text-slate-500">
            Sube fotos de tus cortes o perfilados para que tus clientes puedan ver la calidad de tu trabajo antes de agendar.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl transition-colors inline-flex items-center space-x-2 mt-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Seleccionar fotos desde tu dispositivo</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {images.map((img, idx) => {
            const isThisPublishedToday = todayQuota?.todayPublishedId === img.id;
            const canPublish = bulkImportEnabled || img.published || !todayQuota?.isPublishedToday || isThisPublishedToday;
            const currentHaircutDate = dateDrafts[img.id] !== undefined ? dateDrafts[img.id] : (toDateInputValue(img.publishedAt) || toDateInputValue(img.createdAt));

            return (
              <div
                key={img.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  img.published
                    ? 'bg-slate-900/90 border-[#8B7CFF]/40 shadow-lg shadow-indigo-950/20'
                    : 'bg-slate-950/70 border-slate-800/60 opacity-90'
                }`}
              >
                {/* Left: Thumbnail Preview & Details */}
                <div className="flex items-start sm:items-center space-x-4 flex-1">
                  {/* Order & Drag position */}
                  <div className="flex flex-col items-center justify-center space-y-1 text-slate-500">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === images.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Photo Thumbnail / Frame 4:5 Preview */}
                  <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                    <div className="w-18 sm:w-20 aspect-[4/5] rounded-xl overflow-hidden bg-slate-950 border-2 border-[#8B7CFF]/45 shadow-[0_0_10px_rgba(139,124,255,0.18)] flex-shrink-0 relative group">
                      <div className="absolute inset-0 ring-1 ring-white/10 ring-inset rounded-xl pointer-events-none z-10" />
                      <img
                        src={img.thumbUrl || img.url}
                        alt={img.title || 'Foto de galería'}
                        className="w-full h-full object-cover object-center"
                      />
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity z-20"
                      >
                        Ver HD
                      </a>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatShortDate(img.publishedAt || currentHaircutDate)}
                    </span>
                  </div>

                  {/* Info & Inputs */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          img.published
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {img.published ? 'Publicada en web' : 'Borrador'}
                      </span>
                      {img.publishedAt && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Fecha corte: {formatShortDate(img.publishedAt)}
                        </span>
                      )}
                    </div>

                    {/* Title editor */}
                    {editingTitleId === img.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          placeholder="Ej: Skin Fade + Barba perfilada"
                          className="bg-slate-950 border border-indigo-500/50 text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full max-w-sm"
                          maxLength={60}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTitle(img.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingTitleId(null)}
                          className="text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-slate-200 font-semibold truncate max-w-xs">
                          {img.title || <span className="text-slate-500 italic font-normal">Sin título (haz clic para agregar)</span>}
                        </p>
                        <button
                          onClick={() => {
                            setEditingTitleId(img.id);
                            setTitleDraft(img.title || '');
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                        >
                          Editar título
                        </button>
                      </div>
                    )}

                    {/* Date Picker (Fecha del corte para Modo Archivo o Edición) */}
                    <div className="flex items-center space-x-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-400 text-[11px]">Fecha del corte:</span>
                      <input
                        type="date"
                        value={currentHaircutDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDateDrafts(prev => ({ ...prev, [img.id]: val }));
                          if (img.published) {
                            handleSaveHaircutDate(img.id, val);
                          }
                        }}
                        className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded-md focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Mandatory Face Consent Checkbox */}
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={img.hasFaceConsent}
                        onChange={(e) => handleToggleConsent(img, e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="flex items-center space-x-1 text-[11px] text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 inline" />
                        <span>Tengo permiso del cliente para exhibir esta foto</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {/* Meta Ads Link Copy */}
                  <button
                    onClick={() => handleCopyUrl(img)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
                    title="Copiar URL directa para anuncios de Meta / Instagram"
                  >
                    {copiedId === img.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">¡URL Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>URL para Ads</span>
                      </>
                    )}
                  </button>

                  {/* Publish Toggle Button */}
                  <button
                    onClick={() => {
                      if (!img.published && !canPublish) {
                        setError('Hoy ya publicaste tu Espejo. Mañana puedes subir otro.');
                        return;
                      }
                      handleTogglePublish(img);
                    }}
                    disabled={!img.published && !canPublish}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      img.published
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    }`}
                  >
                    {img.published ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Pasar a Borrador</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Publicar</span>
                      </>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
