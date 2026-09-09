import React, { useState } from 'react';
import { FileText, X, Check, ShieldCheck } from 'lucide-react';

export interface TechnicalSheetData {
  corteHabitual: string;
  maquinaGuardia: string;
  barbaNota: string;
  ritmoDias: number;
  alergias: string;
  permisoFoto: boolean;
  origen: string;
  proximaSugerida?: string;
  notas: string;
}

interface TechnicalSheetModalProps {
  clientId: string;
  clientName: string;
  clientPhone: string;
  initialData?: Partial<TechnicalSheetData>;
  onClose: () => void;
  onSaved: (savedData: TechnicalSheetData) => void;
  isMandatoryToClose?: boolean;
}

export default function TechnicalSheetModal({
  clientId,
  clientName,
  clientPhone,
  initialData,
  onClose,
  onSaved,
  isMandatoryToClose = false,
}: TechnicalSheetModalProps) {
  const [corteHabitual, setCorteHabitual] = useState(initialData?.corteHabitual || '');
  const [maquinaGuardia, setMaquinaGuardia] = useState(initialData?.maquinaGuardia || '');
  const [hasBarba, setHasBarba] = useState(Boolean(initialData?.barbaNota));
  const [barbaNota, setBarbaNota] = useState(initialData?.barbaNota || '');
  const [ritmoDias, setRitmoDias] = useState<number>(initialData?.ritmoDias || 21);
  const [alergias, setAlergias] = useState(initialData?.alergias || '');
  const [permisoFoto, setPermisoFoto] = useState(initialData?.permisoFoto ?? true);
  const [origen, setOrigen] = useState(initialData?.origen || 'WhatsApp');
  const [notas, setNotas] = useState(initialData?.notas || '');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calcular fecha sugerida basada en ritmo en días
  const calcNextDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMandatoryToClose && (!corteHabitual.trim() && !maquinaGuardia.trim() && !notas.trim())) {
      setErrorMsg('Por favor ingresa al menos el tipo de corte o notas de la sesión para cerrar la ficha.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const sheetPayload: TechnicalSheetData = {
      corteHabitual: corteHabitual.trim(),
      maquinaGuardia: maquinaGuardia.trim(),
      barbaNota: hasBarba ? barbaNota.trim() : '',
      ritmoDias,
      alergias: alergias.trim(),
      permisoFoto,
      origen,
      proximaSugerida: new Date(Date.now() + ritmoDias * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notas: notas.trim(),
    };

    try {
      const res = await fetch(`/api/clients/${clientId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: sheetPayload.notas || sheetPayload.corteHabitual,
          preferences: sheetPayload,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar la ficha técnica');

      onSaved(sheetPayload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo guardar la ficha');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Ficha Técnica v1 · {clientName}</h3>
              <span className="text-[11px] text-slate-400 font-mono">{clientPhone}</span>
            </div>
          </div>

          {!isMandatoryToClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isMandatoryToClose && (
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Cierre rápido en 20 segundos: guarda la fórmula para recordar su corte exacto en su próxima visita.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          
          {/* 1. Corte Habitual */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Corte Habitual *
            </label>
            <input
              type="text"
              value={corteHabitual}
              onChange={(e) => setCorteHabitual(e.target.value)}
              placeholder="Ej: Fade medio, texturizado arriba con tijera"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 2. Máquina / Guardia / Tijera */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Fórmula de Máquinas & Tijera
            </label>
            <input
              type="text"
              value={maquinaGuardia}
              onChange={(e) => setMaquinaGuardia(e.target.value)}
              placeholder="Ej: Guardia 0.5 a 2 a los lados, tijera 2 dedos arriba, patillas en punta"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 3. Barba */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">¿Lleva Barba / Perfilado?</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setHasBarba(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    hasBarba ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setHasBarba(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    !hasBarba ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {hasBarba && (
              <input
                type="text"
                value={barbaNota}
                onChange={(e) => setBarbaNota(e.target.value)}
                placeholder="Ej: Rebaje con guardia 2, perfilado con navaja en mejillas y cuello"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* 4. Ritmo de Visitas */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-300">Ritmo de Corte Habitual</label>
              <span className="text-[11px] text-indigo-400">
                Próxima sugerida: <strong>{calcNextDate(ritmoDias)}</strong>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[14, 21, 28].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRitmoDias(days)}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    ritmoDias === days
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Cada {days} días
                </button>
              ))}
            </div>
          </div>

          {/* 5. Alergias & Origen */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Alergias / Piel sensible</label>
              <input
                type="text"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                placeholder="Ej: Sin aftershave alcohol"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Origen del Cliente</label>
              <select
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Referido">Referido</option>
                <option value="Google">Google Maps</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* 6. Permiso de Foto */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-300">¿Acepta fotos para Instagram / Portafolio?</span>
            <input
              type="checkbox"
              checked={permisoFoto}
              onChange={(e) => setPermisoFoto(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {/* 7. Notas Libres */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notas Adicionales</label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Conversador, le gusta café con poca azúcar, prefiere música baja..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {errorMsg && (
            <p className="text-rose-400 text-xs">{errorMsg}</p>
          )}

          {/* Botones de acción */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Guardando Ficha...' : 'Guardar Ficha Técnica (20s)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
