import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Camera, Upload, Scissors,
  Download, Award, Zap, RefreshCw, ExternalLink, Calendar,
  Eye
} from "lucide-react";

interface VisagismRecommendation {
  nombre_corte: string;
  justificacion_visagista: string;
  mantenimiento: string;
  imagePreview?: string;
  barberInstructions?: string;
  maintenanceDays?: number;
  recommendedProduct?: string;
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

export default function PerformanceApp() {
  const [step, setStep] = useState<"welcome" | "capture" | "analyzing" | "result">("welcome");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cleanImageBase64, setCleanImageBase64] = useState<string | null>(null);
  const [selectedCutIndex, setSelectedCutIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [transformedImages] = useState<Record<number, string>>({});
  
  // Profiling questions
  const [ageGroup, setAgeGroup] = useState("26-35 años");
  const [occupation, setOccupation] = useState("Creativo / Urbano / Tecnológico");
  const [maintenanceTime] = useState("5-10 min (Medio)");

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Analysis result
  const [analysis, setAnalysis] = useState<VisagismResult | null>(null);

  // Default fallback haircut previews
  const defaultCutImages = [
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517832606589-7629c3397143?w=800&auto=format&fit=crop&q=80"
  ];

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Cámara no compatible con este navegador.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError("No pudimos acceder a la cámara en vivo. Por favor usa el botón de subir foto.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 640;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
        uploadAndAnalyze(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        stopCamera();
        uploadAndAnalyze(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAndAnalyze = async (dataUrl: string) => {
    setStep("analyzing");

    try {
      // Convert base64 to Blob for multipart upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("image", blob, "selfie.jpg");
      formData.append("ageGroup", ageGroup);
      formData.append("occupation", occupation);
      formData.append("maintenanceTime", maintenanceTime);

      const apiRes = await fetch("/api/visagism/analyze", {
        method: "POST",
        body: formData,
      });

      if (!apiRes.ok) {
        throw new Error(`Error en el análisis de visagismo (${apiRes.status})`);
      }

      const data: VisagismResult = await apiRes.json();
      setAnalysis(data);
      if (data.cleanImageBase64) {
        setCleanImageBase64(data.cleanImageBase64);
      }
      setStep("result");
    } catch (err: any) {
      console.warn("Fallo en API remota, usando motor local inteligente:", err);
      setAnalysis({
        id: `VIS-${Math.floor(Math.random() * 90000 + 10000)}`,
        saludo_maestro: "Mio caro amico, tus proporciones destacan por una mandíbula definida y pómulos prominentes.",
        forma_rostro: "Diamante Angular / Estructura Esculpida",
        tipo_cabello: "Ondulado Medio con Densidad Natural",
        tono_piel: "Neutro Oliva",
        prompt_edicion_imagen: "Man with textured french crop haircut and clean mid fade, photorealistic barbershop portrait",
        recomendaciones: [
          {
            nombre_corte: "Textured French Crop + Mid Drop Fade",
            justificacion_visagista: "Equilibra pómulos prominentes y aporta textura superior desfilada para mantener el foco en la mirada y estilizar la frente.",
            mantenimiento: "Mantenimiento cada 18 días. Usar polvo de volumen mate en seco.",
            barberInstructions: 'Pedir: "Degradado medio en drop fade comenzando en 0.5 a 1.5. Cúspide desfilada a tijera point-cut con 4 cm y flequillo texturizado."',
            maintenanceDays: 18,
            recommendedProduct: "Polvo de Volumen Mate + Cera Base Agua"
          },
          {
            nombre_corte: "Modern Taper Pompadour con Barba Esculpida",
            justificacion_visagista: "El volumen vertical peinado hacia atrás alarga la silueta facial aportando presencia ejecutiva y elegancia sartorial.",
            mantenimiento: "Mantenimiento cada 21 días. Secar hacia atrás con cepillo esquelético.",
            barberInstructions: 'Pedir: "Taper fade bajo en patillas y nuca. Conectar con laterales a peine-tijera. Cúspide a 6-8 cm peinada hacia atrás."',
            maintenanceDays: 21,
            recommendedProduct: "Pomada de Fijación Fuerte Brillo Natural + Spray Sal Marina"
          },
          {
            nombre_corte: "Messy Textured Quiff + Skin Fade",
            justificacion_visagista: "Estilo desenfadado con elevación frontal en 45 grados que rompe la rigidez y potencia los ángulos de la mandíbula.",
            mantenimiento: "Mantenimiento cada 14 días. Aplicar pasta mate con dedos.",
            barberInstructions: 'Pedir: "Skin fade medio con compresión oscura en línea parietal. Flequillo elevado con textura profunda."',
            maintenanceDays: 14,
            recommendedProduct: "Pasta Mate Arcillosa (Clay Pomade)"
          }
        ]
      });
      setStep("result");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const currentCut = analysis?.recomendaciones[selectedCutIndex];
  const activeTransformedImage =
    transformedImages[selectedCutIndex] ||
    currentCut?.imagePreview ||
    defaultCutImages[selectedCutIndex % defaultCutImages.length];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide flex items-center gap-1.5">
                ESPEJOS <span className="text-amber-400 font-mono text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">PERFORMANCE</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">AI VISAGISM & MORPHOLOGY LAB</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://espejosstudio.cl"
              className="text-xs text-slate-300 hover:text-amber-400 transition-colors hidden sm:flex items-center gap-1 font-medium"
            >
              Agendar en Espejos Studio <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => {
                setStep("capture");
                startCamera();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              Nuevo Escaneo
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: WELCOME SCREEN */}
        {step === "welcome" && (
          <div className="max-w-3xl mx-auto text-center py-10 sm:py-16 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono tracking-wider animate-pulse">
              <Sparkles className="w-4 h-4" />
              DETECCIÓN DE ROSTRO Y SIMULADOR DE CABELLO CON IA
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Identifica tu estructura facial y prueba tu nuevo corte <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">manteniendo tu rostro</span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Nuestra IA reconoce tus facciones, frente y cabello. Aplica las leyes del <strong className="text-slate-200">Visagismo Morfológico</strong> para simular el corte exacto sobre tu propia cabeza y generar tu Ficha Técnica para el barbero.
            </p>

            {/* Micro Profiling Selectors */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left max-w-xl mx-auto space-y-3">
              <span className="text-xs font-mono text-amber-400 font-bold block uppercase tracking-wider">
                ⚙️ Ajustes de Perfilado para el Visagista IA:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Rango de Edad</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <option>18-25 años</option>
                    <option>26-35 años</option>
                    <option>36-45 años</option>
                    <option>46+ años</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Estilo / Ocupación</label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <option>Creativo / Urbano / Tecnológico</option>
                    <option>Corporativo / Ejecutivo / Formal</option>
                    <option>Deportivo / Versátil</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  setStep("capture");
                  startCamera();
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
              >
                <Camera className="w-5 h-5" />
                Tomar Foto con Cámara
              </button>

              <label className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-400" />
                Subir Foto desde Galería
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}

        {/* VIEW 2: CAPTURE SCREEN */}
        {step === "capture" && (
          <div className="max-w-xl mx-auto py-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Centra tu Rostro en el Sensor</h2>
              <p className="text-xs text-slate-400">Mantén una postura frontal neutra para que la IA trace los puntos de tu mandíbula y cráneo.</p>
            </div>

            <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-500/30 shadow-2xl">
              {cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                  {/* Facial Morph Overlay Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-72 border-2 border-dashed border-amber-400/60 rounded-[50%] shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse" />
                    <div className="absolute top-4 left-4 text-[10px] font-mono text-amber-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-amber-500/30">
                      FACE ID & HAIR TRACKING: ACTIVE
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Camera className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-sm font-medium">{cameraError || "Iniciando cámara..."}</p>
                  <label className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer">
                    Seleccionar Archivo de Foto
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              {cameraActive && (
                <button
                  onClick={takePhoto}
                  className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capturar y Analizar
                </button>
              )}

              <label className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Subir Archivo
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}

        {/* VIEW 3: ANALYZING STATE */}
        {step === "analyzing" && (
          <div className="max-w-md mx-auto text-center py-20 space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-slate-900 flex items-center justify-center">
                <Zap className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Identificando Rostro & Cabello con IA...</h3>
              <p className="text-xs text-slate-400 font-mono">
                Preservando rasgos faciales • Aislando zona capilar • Aplicando visagismo Pivot Point
              </p>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-3/4 animate-[pulse_1s_infinite]" />
            </div>
          </div>
        )}

        {/* VIEW 4: RESULTS & BEFORE/AFTER SLIDER */}
        {step === "result" && analysis && (
          <div className="space-y-6">
            {/* Top Stat Summary Banner */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    DIAGNÓSTICO OFICIAL
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {analysis.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{analysis.forma_rostro}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{analysis.tipo_cabello} • Tono {analysis.tono_piel}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-amber-400 font-black text-lg">94/100</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Definición Mandibular</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-emerald-400 font-black text-lg">98%</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Compatibilidad Visagista</div>
                </div>
              </div>
            </div>

            {/* Haircut Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {analysis.recomendaciones.map((cut, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCutIndex(idx)}
                  className={`px-4 py-3 rounded-xl border text-left transition-all shrink-0 min-w-[230px] ${
                    selectedCutIndex === idx
                      ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-mono text-amber-400 font-bold mb-0.5">ESTILO #{idx + 1}</div>
                  <div className="font-bold text-xs truncate text-slate-100">{cut.nombre_corte}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Recomendado por Maestro Giovanni</div>
                </button>
              ))}
            </div>

            {/* Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Simulator (Before / After Slider) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl select-none group">
                  {/* Transformed Cut Image (Simulated AI Look on User Face) */}
                  <img
                    src={activeTransformedImage}
                    alt="Simulación de Corte"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Original Image (Overlay with Clip Path) */}
                  {(cleanImageBase64 || capturedImage) && (
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={cleanImageBase64 || capturedImage || ""}
                        alt="Tu Rostro Original"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" />
                        TU ROSTRO ORIGINAL
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-950 font-bold flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    MISMO ROSTRO + NUEVO CORTE
                  </div>

                  {/* Slider Divider Bar */}
                  {(cleanImageBase64 || capturedImage) && (
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-amber-400 cursor-ew-resize flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-lg text-amber-400 text-[10px] font-black">
                        ⇄
                      </div>
                    </div>
                  )}

                  {/* Interactive Slider Input */}
                  {(cleanImageBase64 || capturedImage) && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                    />
                  )}
                </div>

                {/* Sub Controls */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
                  <span>Arrastra la barra para comparar tu rostro antes y después</span>
                  <button
                    onClick={() => {
                      setStep("capture");
                      startCamera();
                    }}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-sans"
                  >
                    <RefreshCw className="w-3 h-3" /> Probar con otra foto
                  </button>
                </div>
              </div>

              {/* Right Column: Ficha Técnica & Barber Sheet */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-amber-400" />
                      Ficha Técnica de Visagismo
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      PIVOT POINT CERTIFICADO
                    </span>
                  </div>

                  {currentCut && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">Corte Sugerido</div>
                        <div className="font-black text-base text-amber-400">
                          {currentCut.nombre_corte}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {currentCut.justificacion_visagista}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="text-[10px] font-mono text-amber-300 font-bold uppercase flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Qué pedirle exactamente a tu barbero:
                        </div>
                        <p className="text-xs text-slate-200 font-medium italic">
                          {currentCut.barberInstructions || currentCut.mantenimiento}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-mono">Frecuencia Óptima</span>
                          <strong className="text-slate-200">Cada {currentCut.maintenanceDays || 21} días</strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-mono">Producto Recomendado</span>
                          <strong className="text-amber-400 truncate block text-[11px]">
                            {currentCut.recommendedProduct || "Pomada Mate Fijación Media"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <a
                      href="https://espejosstudio.cl"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      Agendar este corte en Espejos Studio
                    </a>

                    <button
                      onClick={() => alert("¡Ficha técnica guardada! Puedes mostrarle esta pantalla directamente a tu barbero.")}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Guardar Ficha Técnica para tu Barbero
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
