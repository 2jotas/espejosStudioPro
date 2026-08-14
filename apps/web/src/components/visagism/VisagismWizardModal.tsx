import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Camera, Upload, CheckCircle2, Scissors, ArrowRight, ChevronRight, User, Briefcase, Clock, AlertCircle
} from 'lucide-react';

interface VisagismRecommendation {
  nombre_corte: string;
  justificacion_visagista: string;
  mantenimiento: string;
}

interface VisagismResult {
  id: string;
  forma_rostro: string;
  tipo_cabello: string;
  tono_piel: string;
  recomendaciones: VisagismRecommendation[];
  prompt_edicion_imagen: string;
  cleanImageBase64?: string;
}

interface VisagismWizardProps {
  professionalId?: string;
  onClose: () => void;
  onSelectHaircutForBooking?: (haircutName: string) => void;
}

export default function VisagismWizardModal({ professionalId, onClose, onSelectHaircutForBooking }: VisagismWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Profiling Answers
  const [ageGroup, setAgeGroup] = useState('26-35');
  const [occupation, setOccupation] = useState('Creativo / Urbano');
  const [maintenanceTime, setMaintenanceTime] = useState('5-10 min');

  // Step 2: Camera / Image Capture
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 3 & 4: Results State
  const [analysisResult, setAnalysisResult] = useState<VisagismResult | null>(null);
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'simulated' | 'original'>('simulated');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start Camera WebRTC Stream
  const startCamera = async () => {
    try {
      setErrorMsg(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WEB_RTC_UNSUPPORTED');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (e: any) {
      console.error('Error al acceder a la cámara:', e);
      if (e.message === 'WEB_RTC_UNSUPPORTED' || window.location.protocol === 'http:') {
        setErrorMsg('La cámara en vivo requiere HTTPS. Puedes tomar una foto en el instante usando el botón "Tomar / Subir Foto".');
      } else {
        setErrorMsg('No se pudo acceder a la cámara. Por favor autoriza los permisos en tu navegador o sube una imagen.');
      }
    }
  };

  // Attach WebRTC stream once video element mounts in DOM
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => console.log('Autoplay error:', err));
    }
  }, [cameraActive]);

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Take Snapshot from Video Feed
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedImageBlob(blob);
            setCapturedImagePreview(canvas.toDataURL('image/jpeg'));
            stopCamera();
          }
        },
        'image/jpeg',
        0.9
      );
    }
  };

  // Handle File Input Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedImageBlob(file);
      setCapturedImagePreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  // Submit Image to Backend Visagism API
  const handleRunAnalysis = async () => {
    if (!capturedImageBlob) {
      setErrorMsg('Por favor tómate una foto o sube una imagen.');
      return;
    }

    setStep(3);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', capturedImageBlob, 'visagism_face.jpg');
      formData.append('ageGroup', ageGroup);
      formData.append('occupation', occupation);
      formData.append('maintenanceTime', maintenanceTime);
      if (professionalId) formData.append('professionalId', professionalId);

      const res = await fetch('/api/visagism/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al analizar la imagen.');

      setAnalysisResult(data);
      setStep(4);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al procesar la sesión de visagismo.');
      setStep(2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 text-left my-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Espejo AI — Asesoría Capilar & Visagismo</h2>
                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full">
                  PIVOT POINT
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Paso {step} de 4: {step === 1 ? 'Perfilamiento' : step === 2 ? 'Captura de Imagen' : step === 3 ? 'Procesando Visagismo' : 'Ficha Técnica de Asesoría'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 flex items-center space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: PROFILING QUESTIONS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Perfilamiento de Estilo de Vida</h3>
              <p className="text-slate-400 text-xs">Responde 3 breves preguntas para personalizar la recomendación técnica</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question 1 */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1. Rango Etario</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['18-25 años', '26-35 años', '36-50 años', '50+ años'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAgeGroup(val)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                        ageGroup === val
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  <span>2. Entorno / Ocupación Principal</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Corporativo / Ejecutivo Formal',
                    'Creativo / Urbano / Tecnológico',
                    'Deportivo / Activo',
                    'Casual / Relajado',
                  ].map((val) => (
                    <button
                      key={val}
                      onClick={() => setOccupation(val)}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                        occupation === val
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Tiempo Diario Disponible para Peinado / Mantenimiento</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['< 5 min (Rápido)', '5-10 min (Medio)', '> 10 min (Detallado)'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setMaintenanceTime(val)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                        maintenanceTime === val
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all"
              >
                <span>Siguiente: Capturar Rostro</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CAMERA CAPTURE / FILE UPLOAD */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Captura Facial para Análisis de Visagismo</h3>
              <p className="text-slate-400 text-xs">Usa tu cámara en vivo o sube una fotografía frontal limpia</p>
            </div>

            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden aspect-video flex items-center justify-center">
              {capturedImagePreview ? (
                <img src={capturedImagePreview} alt="Captura facial" className="w-full h-full object-cover" />
              ) : cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                  {/* Oval Facial Overlay Guide */}
                  <div className="absolute inset-0 border-2 border-indigo-400/40 rounded-full max-w-[220px] max-h-[280px] m-auto pointer-events-none border-dashed flex items-center justify-center">
                    <span className="text-[10px] text-indigo-300 font-bold bg-slate-950/70 px-2 py-0.5 rounded-full">Alinea tu rostro</span>
                  </div>
                </>
              ) : (
                <label htmlFor="visagism-file-input" className="text-center space-y-3 p-6 cursor-pointer hover:opacity-80 transition-opacity w-full h-full flex flex-col items-center justify-center">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl inline-block text-indigo-400 shadow-lg">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">Haz clic aquí para Tomar o Subir Foto</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Abre la cámara frontal o la galería de tu dispositivo</p>
                  </div>
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {!cameraActive && !capturedImagePreview && (
                  <button
                    onClick={startCamera}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Activar Cámara WebRTC</span>
                  </button>
                )}

                {cameraActive && (
                  <button
                    onClick={takeSnapshot}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Ahora</span>
                  </button>
                )}

                <label className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-2 transition-colors">
                  <Upload className="w-4 h-4 text-purple-300" />
                  <span>Tomar / Subir Foto</span>
                  <input
                    id="visagism-file-input"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {capturedImagePreview && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setCapturedImagePreview(null);
                      setCapturedImageBlob(null);
                    }}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
                  >
                    Repetir
                  </button>
                  <button
                    onClick={handleRunAnalysis}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all"
                  >
                    <span>Analizar Visagismo</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SCANNING / AI PROCESSING */}
        {step === 3 && (
          <div className="py-12 text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto rounded-3xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20">
              {capturedImagePreview && <img src={capturedImagePreview} alt="Scanning" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-indigo-500/20 animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Escaneando Proporciones Faciales...</h3>
              <p className="text-slate-400 text-xs">
                Analizando geometría craneofacial, mandíbula, tono de piel y corte óptimo mediante reglas Pivot Point...
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: TECHNICAL SHEET & RECOMMENDATIONS */}
        {step === 4 && analysisResult && (
          <div className="space-y-6">
            
            {/* Visual Try-On & Face Preview Showcase */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Visualización en Rostro</span>
                </span>

                <div className="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                  <button
                    onClick={() => setViewMode('simulated')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      viewMode === 'simulated'
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ✂️ Simulación Corte
                  </button>
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      viewMode === 'original'
                        ? 'bg-indigo-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📸 Tu Foto
                  </button>
                </div>
              </div>

              {/* Image Viewport Canvas */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                {capturedImagePreview || analysisResult.cleanImageBase64 ? (
                  <>
                    <img
                      src={capturedImagePreview || analysisResult.cleanImageBase64}
                      alt="Tu rostro"
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        viewMode === 'simulated' ? 'filter brightness-105 contrast-105' : ''
                      }`}
                    />

                    {/* Visagism Grid Lines Overlay for Original View */}
                    {viewMode === 'original' && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                        <div className="w-full h-full border border-indigo-500/30 rounded-full max-w-[200px] max-h-[260px] m-auto border-dashed flex items-center justify-center">
                          <span className="text-[9px] text-indigo-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded-full">
                            Eje Visagista: {analysisResult.forma_rostro}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Simulated Haircut Style Overlay Tag */}
                    {viewMode === 'simulated' && (
                      <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-purple-300 uppercase font-bold block">Simulación Aplicada</span>
                          <span className="font-extrabold text-white">
                            {analysisResult.recomendaciones[selectedRecommendationIndex]?.nombre_corte || 'Corte Sugerido'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
                          Pivot Point 100%
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500 text-xs">Foto no disponible</div>
                )}
              </div>
            </div>
            
            {/* Morphological Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Geometría Facial</span>
                <span className="text-xs font-bold text-indigo-400">{analysisResult.forma_rostro}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Tipo de Cabello</span>
                <span className="text-xs font-bold text-purple-400">{analysisResult.tipo_cabello}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Tono de Piel</span>
                <span className="text-xs font-bold text-emerald-400">{analysisResult.tono_piel}</span>
              </div>
            </div>

            {/* Haircut Recommendations Selector */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cortes Recomendados por el Asesor</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {analysisResult.recomendaciones.map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedRecommendationIndex(idx)}
                    className={`p-3 rounded-2xl border text-left space-y-1 transition-all ${
                      selectedRecommendationIndex === idx
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Corte #{idx + 1}</span>
                      {selectedRecommendationIndex === idx && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <div className="text-xs font-semibold truncate text-white">{rec.nombre_corte}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Haircut Detail Card */}
            {analysisResult.recomendaciones[selectedRecommendationIndex] && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Scissors className="w-4 h-4 text-indigo-400" />
                    <span>{analysisResult.recomendaciones[selectedRecommendationIndex].nombre_corte}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    RECOMENDADO
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">Justificación de Visagismo:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {analysisResult.recomendaciones[selectedRecommendationIndex].justificacion_visagista}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">Mantenimiento y Peinado:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {analysisResult.recomendaciones[selectedRecommendationIndex].mantenimiento}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Analizar Otra Foto
              </button>

              <button
                onClick={() => {
                  const recName = analysisResult.recomendaciones[selectedRecommendationIndex]?.nombre_corte;
                  if (onSelectHaircutForBooking && recName) {
                    onSelectHaircutForBooking(recName);
                  }
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Agendar este Corte Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
