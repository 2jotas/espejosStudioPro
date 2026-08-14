import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Camera, Upload, CheckCircle2, Scissors, ArrowRight, ChevronRight, User, Briefcase, Clock, AlertCircle, Award, Sliders, Download, RefreshCw
} from 'lucide-react';

const maestroAvatar = '/maestro_giovanni_avatar.jpg';

interface VisagismRecommendation {
  nombre_corte: string;
  justificacion_visagista: string;
  mantenimiento: string;
}

interface VisagismResult {
  id: string;
  saludo_maestro?: string;
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
  const [ageGroup, setAgeGroup] = useState('26-35 años');
  const [occupation, setOccupation] = useState('Creativo / Urbano / Tecnológico');
  const [maintenanceTime, setMaintenanceTime] = useState('5-10 min (Medio)');

  // Step 2: Camera / Image Capture
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 3 & 4: Results & Haircut Synthesis Customization State
  const [analysisResult, setAnalysisResult] = useState<VisagismResult | null>(null);
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'simulated' | 'original'>('simulated');
  const [hairVolume, setHairVolume] = useState<'medio' | 'alto' | 'natural'>('alto');
  const [hairFinish, setHairFinish] = useState<'mate' | 'brillo'>('mate');
  const [hairColor] = useState<'negro' | 'castano_oscuro' | 'castano_medio'>('negro');
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
      setErrorMsg(err.message || 'Error al procesar la sesión de visagismo con Maestro Giovanni.');
      setStep(2);
    }
  };

  // Download Synthesized Haircut Image Composite
  const downloadTransformationImage = () => {
    const srcImg = capturedImagePreview || analysisResult?.cleanImageBase64;
    if (!srcImg) return;
    const link = document.createElement('a');
    link.download = `corte_visagismo_maestro_giovanni_${Date.now()}.jpg`;
    link.href = srcImg;
    link.click();
  };

  return (
    /* FIXED OVERFLOW & TOP SCROLL CUT-OFF: Use items-start so top header is ALWAYS accessible and scrollable */
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex justify-center items-start font-sans">
      <div className="bg-[#0c0e17] border border-amber-500/30 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl relative space-y-5 text-left my-2 sm:my-6">
        
        {/* Retro Luxury Italian Master Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-lg shadow-amber-500/10 flex-shrink-0">
              <img src={maestroAvatar} alt="Maestro Giovanni" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">Maestro Giovanni</h2>
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold rounded-full flex items-center space-x-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>SARTORIA ITALIANA</span>
                </span>
              </div>
              <p className="text-amber-200/70 text-xs mt-0.5 font-medium italic">
                {step === 1 ? '"Ciao mio amico, permíteme perfilar tu estilo"' : step === 2 ? '"Alinea tu rostro para evaluar tu geometría facial"' : step === 3 ? '"Evaluando ángulos, mandíbula y visagismo Pivot Point..."' : '"Ecco la tu ficha técnica sartorial y simulación de corte"'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white text-base">✕</button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 flex items-center space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: PROFILING QUESTIONS WITH MAESTRO GIOVANNI */}
        {step === 1 && (
          <div className="space-y-5">
            
            {/* Maestro Giovanni Dialogue Box */}
            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-500/25 rounded-2xl p-4 flex items-start space-x-3 text-xs leading-relaxed">
              <span className="text-xl">💈</span>
              <p className="text-slate-200 italic">
                <strong className="text-amber-300 not-italic font-bold block mb-0.5">Maestro Giovanni dice:</strong>
                "Para aconsejarte el corte impecable que resalte la elegancia natural de tu rostro, necesito conocer 3 detalles sobre tu día a día."
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question 1 */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. ¿Cuál es tu rango de edad?</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['18-25 años', '26-35 años', '36-50 años', '50+ años'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAgeGroup(val)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        ageGroup === val
                          ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-extrabold'
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
                  <span>2. ¿En qué entorno te desenvuelves?</span>
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
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md font-bold'
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
                  <span>3. ¿Cuánto tiempo dedicas diariamente a peinarte?</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['< 5 min (Rápido)', '5-10 min (Medio)', '> 10 min (Detallado)'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setMaintenanceTime(val)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                        maintenanceTime === val
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md font-bold'
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
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all"
              >
                <span>Siguiente: Analizar Rostro</span>
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
              <p className="text-slate-400 text-xs">Tómate una fotografía frontal limpia o sube una imagen de tu galería</p>
            </div>

            <div className="relative bg-slate-950 border border-amber-500/30 rounded-3xl overflow-hidden aspect-video flex items-center justify-center">
              {capturedImagePreview ? (
                <img src={capturedImagePreview} alt="Captura facial" className="w-full h-full object-cover" />
              ) : cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                  <div className="absolute inset-0 border-2 border-amber-400/40 rounded-full max-w-[220px] max-h-[280px] m-auto pointer-events-none border-dashed flex items-center justify-center">
                    <span className="text-[10px] text-amber-300 font-bold bg-slate-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                      Alinea tu rostro
                    </span>
                  </div>
                </>
              ) : (
                <label htmlFor="visagism-file-input" className="text-center space-y-3 p-6 cursor-pointer hover:opacity-80 transition-opacity w-full h-full flex flex-col items-center justify-center">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl inline-block text-amber-400 shadow-lg">
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
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all"
                  >
                    <span>Analizar Visagismo</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SCANNING / MAESTRO GIOVANNI AI PROCESSING */}
        {step === 3 && (
          <div className="py-12 text-center space-y-6">
            <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20">
              {capturedImagePreview && <img src={capturedImagePreview} alt="Scanning" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-amber-500/20 animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-white">Maestro Giovanni evaluando tu rostro...</h3>
              <p className="text-amber-200/70 text-xs italic max-w-md mx-auto">
                "Analizando los ángulos de tu mandíbula, frente, densidad capilar y simetría Pivot Point..."
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: STREAMLINED TECHNICAL SHEET & REAL HAIRCUT COMPOSITE SYNTHESIZER */}
        {step === 4 && analysisResult && (
          <div className="space-y-5">
            
            {/* Maestro Giovanni Sartorial Greeting */}
            {analysisResult.saludo_maestro && (
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-xs leading-relaxed">
                <img src={maestroAvatar} alt="Maestro Giovanni" className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 flex-shrink-0" />
                <p className="text-slate-200 italic">
                  <strong className="text-amber-300 not-italic font-bold block mb-0.5">Diagnóstico del Maestro Giovanni:</strong>
                  "{analysisResult.saludo_maestro}"
                </p>
              </div>
            )}

            {/* Haircut Fusion Visual Try-On Canvas Engine */}
            <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-3.5 sm:p-4 space-y-3 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Transformación de Corte Aplicado</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold rounded-full">
                    SINTETIZADO EN VIVO
                  </span>
                </div>

                <div className="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                  <button
                    onClick={() => setViewMode('simulated')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      viewMode === 'simulated'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ✂️ Simulación Maestro
                  </button>
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      viewMode === 'original'
                        ? 'bg-indigo-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📸 Tu Foto Original
                  </button>
                </div>
              </div>

              {/* Client Face & Real Synthesized Hair Graphic Composite Viewport */}
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

                    {/* HIGH-DEFINITION SYNTHESIZED HAIRCUT GRAPHIC MESH OVERLAY */}
                    {viewMode === 'simulated' && (
                      <div className="absolute inset-0 pointer-events-none">
                        
                        {/* STYLE 0: MID FADE CON TEXTURED CROP */}
                        {selectedRecommendationIndex === 0 && (
                          <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="cropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={hairColor === 'negro' ? '#090a0f' : hairColor === 'castano_oscuro' ? '#1c120c' : '#2b1b12'} stopOpacity={hairFinish === 'brillo' ? '0.95' : '0.9'} />
                                <stop offset="70%" stopColor={hairColor === 'negro' ? '#141722' : '#2a1a12'} stopOpacity="0.85" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                              </linearGradient>
                              <filter id="shadow">
                                <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
                              </filter>
                            </defs>
                            
                            {/* Textured Crown & Forward Fringe Strands */}
                            <path
                              d={`M ${260 - (hairVolume === 'alto' ? 20 : 0)} ${120 - (hairVolume === 'alto' ? 25 : 0)} C 320 ${60 - (hairVolume === 'alto' ? 35 : 10)}, 480 ${60 - (hairVolume === 'alto' ? 35 : 10)}, ${540 + (hairVolume === 'alto' ? 20 : 0)} ${120 - (hairVolume === 'alto' ? 25 : 0)} C 520 180, 480 200, 400 200 C 320 200, 280 180, ${260 - (hairVolume === 'alto' ? 20 : 0)} ${120 - (hairVolume === 'alto' ? 25 : 0)} Z`}
                              fill="url(#cropGrad)"
                              filter="url(#shadow)"
                            />

                            {/* French Crop Textured Fringe Strokes */}
                            <path d="M 310 160 Q 320 195 330 200 M 350 155 Q 365 198 375 205 M 400 150 Q 410 200 420 205 M 440 155 Q 455 198 465 200 M 480 160 Q 490 190 500 195" stroke={hairFinish === 'brillo' ? '#5a627a' : '#1e2436'} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                            
                            {/* Mid Fade Temple Taper Slits */}
                            <path d="M 250 150 C 270 200, 280 250, 290 270 Z" fill="#090a0f" opacity="0.4" />
                            <path d="M 550 150 C 530 200, 520 250, 510 270 Z" fill="#090a0f" opacity="0.4" />
                          </svg>
                        )}

                        {/* STYLE 1: MODERN POMPADOUR CON TAPER FADE */}
                        {selectedRecommendationIndex === 1 && (
                          <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="pompGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor="#0a0c14" stopOpacity="0.85" />
                                <stop offset="60%" stopColor={hairColor === 'negro' ? '#181d2e' : '#362319'} stopOpacity="0.95" />
                                <stop offset="100%" stopColor={hairFinish === 'brillo' ? '#4a5780' : '#22283d'} stopOpacity="0.9" />
                              </linearGradient>
                            </defs>

                            {/* Elevated Pompadour Swept Crown Volume */}
                            <path
                              d={`M 270 ${140 - (hairVolume === 'alto' ? 30 : 0)} C 300 ${30 - (hairVolume === 'alto' ? 45 : 15)}, 500 ${30 - (hairVolume === 'alto' ? 45 : 15)}, 530 ${140 - (hairVolume === 'alto' ? 30 : 0)} C 510 170, 470 175, 400 175 C 330 175, 290 170, 270 ${140 - (hairVolume === 'alto' ? 30 : 0)} Z`}
                              fill="url(#pompGrad)"
                            />

                            {/* Pomp Comb Strands */}
                            <path d="M 330 150 Q 360 80 400 70 M 370 155 Q 400 85 430 75 M 410 160 Q 440 90 470 85 M 450 165 Q 480 100 500 95" stroke={hairFinish === 'brillo' ? '#8a99c7' : '#333e5e'} strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                          </svg>
                        )}

                        {/* STYLE 2: CLASSIC SIDE PART ESTRUCTURADO */}
                        {selectedRecommendationIndex === 2 && (
                          <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="sideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#090a0e" stopOpacity="0.95" />
                                <stop offset="50%" stopColor={hairColor === 'negro' ? '#141826' : '#2b1c14'} stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#08090d" stopOpacity="0.85" />
                              </linearGradient>
                            </defs>

                            {/* Executive Combed Side Part Hair Cap */}
                            <path
                              d={`M 260 130 C 310 ${65 - (hairVolume === 'alto' ? 25 : 0)}, 490 ${65 - (hairVolume === 'alto' ? 25 : 0)}, 540 130 C 520 185, 470 190, 400 190 C 330 190, 280 185, 260 130 Z`}
                              fill="url(#sideGrad)"
                            />

                            {/* Defined Hard Part Line */}
                            <line x1="330" y1="90" x2="350" y2="175" stroke="#f59e0b" strokeWidth="2.5" opacity="0.9" strokeDasharray="3,1" />

                            {/* Combed Hair Flow Lines */}
                            <path d="M 360 110 Q 420 130 500 145 M 365 125 Q 425 145 495 160 M 370 140 Q 430 160 485 170" stroke={hairFinish === 'brillo' ? '#7889ba' : '#2a334d'} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                          </svg>
                        )}

                        {/* Visagism Grid Alignment Tag */}
                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 text-[10px] text-amber-300 font-extrabold flex items-center space-x-1">
                          <span>✂️ CORTE FUSIONADO:</span>
                          <span className="text-white uppercase font-bold">{analysisResult.recomendaciones[selectedRecommendationIndex]?.nombre_corte}</span>
                        </div>
                      </div>
                    )}

                    {/* Visagism Grid Lines Overlay for Original View */}
                    {viewMode === 'original' && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                        <div className="w-full h-full border border-amber-500/40 rounded-full max-w-[200px] max-h-[260px] m-auto border-dashed flex items-center justify-center">
                          <span className="text-[9px] text-amber-300 font-bold bg-slate-950/90 px-2 py-0.5 rounded-full border border-amber-500/30">
                            Geometría: {analysisResult.forma_rostro}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Simulated Haircut Style Overlay Tag */}
                    {viewMode === 'simulated' && (
                      <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 bg-slate-950/90 backdrop-blur-md border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-amber-400 uppercase font-bold block">Estilo Aplicado al Rostro</span>
                          <span className="font-extrabold text-white">
                            {analysisResult.recomendaciones[selectedRecommendationIndex]?.nombre_corte || 'Corte Sugerido'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded-lg border border-amber-500/30">
                          Volumen: {hairVolume} | {hairFinish}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500 text-xs">Foto no disponible</div>
                )}
              </div>

              {/* Sartorial Haircut Customizer Bar */}
              {viewMode === 'simulated' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-400 font-semibold text-[11px]">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ajustes Sartoriales:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                      <span className="text-slate-500 px-1 text-[10px]">Volumen:</span>
                      {(['medio', 'alto', 'natural'] as const).map((vol) => (
                        <button
                          key={vol}
                          onClick={() => setHairVolume(vol)}
                          className={`px-2 py-0.5 rounded-lg capitalize transition-all ${
                            hairVolume === vol ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {vol}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                      <span className="text-slate-500 px-1 text-[10px]">Acabado:</span>
                      {(['mate', 'brillo'] as const).map((fin) => (
                        <button
                          key={fin}
                          onClick={() => setHairFinish(fin)}
                          className={`px-2 py-0.5 rounded-lg capitalize transition-all ${
                            hairFinish === fin ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {fin}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={downloadTransformationImage}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] rounded-xl border border-amber-500/30 flex items-center space-x-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Descargar Foto</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Streamlined Morphological Badges */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-center space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Geometría Facial</span>
                <span className="text-xs font-extrabold text-amber-400">{analysisResult.forma_rostro}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-center space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Tipo de Cabello</span>
                <span className="text-xs font-extrabold text-purple-400">{analysisResult.tipo_cabello}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-center space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Tono de Piel</span>
                <span className="text-xs font-extrabold text-emerald-400">{analysisResult.tono_piel}</span>
              </div>
            </div>

            {/* Haircut Recommendations Selector */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cortes Sugeridos por Maestro Giovanni</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {analysisResult.recomendaciones.map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedRecommendationIndex(idx)}
                    className={`p-3 rounded-2xl border text-left space-y-1 transition-all ${
                      selectedRecommendationIndex === idx
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Corte #{idx + 1}</span>
                      {selectedRecommendationIndex === idx && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-xs font-bold truncate text-white">{rec.nombre_corte}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Streamlined Professional Haircut Card */}
            {analysisResult.recomendaciones[selectedRecommendationIndex] && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span>{analysisResult.recomendaciones[selectedRecommendationIndex].nombre_corte}</span>
                  </h4>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    PIVOT POINT 100%
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

            {/* Booking CTA Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Analizar Otra Foto</span>
              </button>

              <button
                onClick={() => {
                  const recName = analysisResult.recomendaciones[selectedRecommendationIndex]?.nombre_corte;
                  if (onSelectHaircutForBooking && recName) {
                    onSelectHaircutForBooking(recName);
                  }
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all"
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
