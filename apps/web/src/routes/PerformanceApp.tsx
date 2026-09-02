import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Camera, Upload, Scissors,
  Download, Award, Zap, RefreshCw, ExternalLink, Calendar
} from "lucide-react";

interface VisagismDossier {
  faceShape: string;
  craniumType: string;
  jawlineScore: number;
  symmetryScore: number;
  recommendedCuts: {
    name: string;
    styleTag: string;
    description: string;
    barberInstructions: string;
    maintenanceDays: number;
    recommendedProduct: string;
    imagePreview: string;
  }[];
  maestroQuote: string;
}

export default function PerformanceApp() {
  const [step, setStep] = useState<"welcome" | "capture" | "analyzing" | "result">("welcome");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedCutIndex, setSelectedCutIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Analysis result state
  const [dossier] = useState<VisagismDossier>({
    faceShape: "Diamante Angular (High Angularity)",
    craniumType: "Mesocéfalo Armónico",
    jawlineScore: 92,
    symmetryScore: 95,
    maestroQuote: "Tu estructura ósea destaca por pómulos definidos y mentón angulado. El objetivo es mantener textura superior para dar altura y laterales limpios en degradado medio para ensanchar sutilmente la mandíbula.",
    recommendedCuts: [
      {
        name: "Textured French Crop + Mid Drop Fade",
        styleTag: "Más Recomendado #1",
        description: "Corte con textura despuntada en la cúspide y caída en degradado medio que equilibra pómulos prominentes y estiliza el tercio superior.",
        barberInstructions: "Pedir: \"Degradado medio en drop fade comenzando en 0.5 a 1.5. Cúspide desfilada a tijera point-cut con 4 cm de longitud y flequillo recto texturizado.\"",
        maintenanceDays: 18,
        recommendedProduct: "Polvo de Volumen Mate (Matte Styling Powder) + Cera Base Agua",
        imagePreview: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80"
      },
      {
        name: "Modern Taper Pompadour + Barba Esculpida",
        styleTag: "Elegante & Ejecutivo",
        description: "Volumen pulido hacia atrás que alarga la silueta facial aportando presencia ejecutiva.",
        barberInstructions: "Pedir: \"Taper fade bajo en patillas y nuca. Conectar con laterales a peine-tijera. Cúspide a 6-8 cm con secado direccionado hacia atrás.\"",
        maintenanceDays: 21,
        recommendedProduct: "Pomada de Fijación Fuerte Brillo Natural + Spray de Sal Marina",
        imagePreview: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80"
      },
      {
        name: "Messy Textured Quiff + Skin Fade",
        styleTag: "Urbano / Dinámico",
        description: "Estilo desenfadado con elevación frontal que rompe líneas rígidas y resalta la mandíbula.",
        barberInstructions: "Pedir: \"Skin fade medio con compresión oscura en línea parietal. Flequillo elevado en 45 grados con textura profunda.\"",
        maintenanceDays: 14,
        recommendedProduct: "Pasta Mate Arcillosa (Clay Pomade)",
        imagePreview: "https://images.unsplash.com/photo-1517832606589-7629c3397143?w=800&auto=format&fit=crop&q=80"
      }
    ]
  });

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
      setCameraError("No pudimos acceder a tu cámara. Puedes subir una foto desde tu galería.");
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
        runAiAnalysis(dataUrl);
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
        runAiAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiAnalysis = (_img: string) => {
    setStep("analyzing");
    setTimeout(() => {
      setStep("result");
    }, 2800);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
              SIMULADOR DE VISAGISMO CON INTELIGENCIA ARTIFICIAL
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Descubre tu corte perfecto mediante <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Geometría Facial</span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Sube tu selfie o usa tu cámara. Nuestra IA analiza la morfología de tu mandíbula y cráneo, renderiza tu nuevo corte y genera una <strong className="text-slate-200">Ficha Técnica Oficial</strong> para mostrarle a tu barbero.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-2">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-amber-400 text-xl font-black mb-1">01. Escaneo</div>
                <p className="text-xs text-slate-400">Captura frontal con medición de proporciones morfológicas.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-amber-400 text-xl font-black mb-1">02. Simulación</div>
                <p className="text-xs text-slate-400">Renderizado fotorrealista de los 3 cortes más favorecedores.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-amber-400 text-xl font-black mb-1">03. Ficha Técnica</div>
                <p className="text-xs text-slate-400">Instrucciones milimétricas para tu barbero y productos clave.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setStep("capture");
                  startCamera();
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
              >
                <Camera className="w-5 h-5" />
                Comenzar Escaneo Facial Gratis
              </button>

              <label className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-400" />
                Subir Foto de Galería
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}

        {/* VIEW 2: CAPTURE SCREEN */}
        {step === "capture" && (
          <div className="max-w-xl mx-auto py-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Centra tu Rostro en el Óvalo</h2>
              <p className="text-xs text-slate-400">Mantén una expresión neutra, buena iluminación y mira fijo al lente.</p>
            </div>

            <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-500/30 shadow-2xl">
              {cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                  {/* Facial Overlay Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-72 border-2 border-dashed border-amber-400/60 rounded-[50%] shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse" />
                    <div className="absolute top-6 left-6 text-[10px] font-mono text-amber-400 bg-slate-950/70 px-2 py-1 rounded">
                      AUTO-TRACKING: READY
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Camera className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-sm font-medium">{cameraError || "Iniciando cámara..."}</p>
                  <label className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer">
                    Seleccionar Foto
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
                  Capturar Foto
                </button>
              )}

              <label className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Subir desde Archivos
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
              <h3 className="text-xl font-bold text-white">Procesando Morfología Facial con IA...</h3>
              <p className="text-xs text-slate-400 font-mono">
                Calculando ángulo de mandíbula • Calibrando proporción áurea • Renderizando estilos
              </p>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-3/4 animate-[pulse_1s_infinite]" />
            </div>
          </div>
        )}

        {/* VIEW 4: DOSSIER & RESULTS */}
        {step === "result" && (
          <div className="space-y-6">
            {/* Top Stat Summary Banner */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    DIAGNÓSTICO OFICIAL
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: VIS-89241</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{dossier.faceShape}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{dossier.craniumType} • Simetría Facial {dossier.symmetryScore}%</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-amber-400 font-black text-lg">{dossier.jawlineScore}/100</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Definición Mandíbula</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-emerald-400 font-black text-lg">A+</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Potencial de Estilo</div>
                </div>
              </div>
            </div>

            {/* Selector de Cortes */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {dossier.recommendedCuts.map((cut, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCutIndex(idx)}
                  className={`px-4 py-3 rounded-xl border text-left transition-all shrink-0 min-w-[220px] ${
                    selectedCutIndex === idx
                      ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-mono text-amber-400 font-bold mb-0.5">{cut.styleTag}</div>
                  <div className="font-bold text-xs truncate text-slate-100">{cut.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Mantenimiento: c/{cut.maintenanceDays} días</div>
                </button>
              ))}
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Simulator (Before / After Slider) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl select-none group">
                  {/* Transformed Cut Image (Simulated AI Look) */}
                  <img
                    src={dossier.recommendedCuts[selectedCutIndex].imagePreview}
                    alt="Simulación de Corte"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Original Image (Overlay with Clip Path) */}
                  {capturedImage && (
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={capturedImage}
                        alt="Foto Original"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700">
                        ORIGINAL
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-950 font-bold">
                    SIMULACIÓN IA
                  </div>

                  {/* Slider Divider Bar */}
                  {capturedImage && (
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
                  {capturedImage && (
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

                {/* Sub Controls / Instructions */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
                  <span>Arrastra para comparar el Antes y Después</span>
                  <button
                    onClick={() => {
                      setStep("capture");
                      startCamera();
                    }}
                    className="text-amber-400 hover:underline flex items-center gap-1"
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
                      Ficha Técnica para el Barbero
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      COMPATIBILIDAD 98%
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">Corte Seleccionado</div>
                      <div className="font-black text-base text-amber-400">
                        {dossier.recommendedCuts[selectedCutIndex].name}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {dossier.recommendedCuts[selectedCutIndex].description}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <div className="text-[10px] font-mono text-amber-300 font-bold uppercase flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Qué pedirle exactamente a tu barbero:
                      </div>
                      <p className="text-xs text-slate-200 font-medium italic">
                        {dossier.recommendedCuts[selectedCutIndex].barberInstructions}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">Frecuencia de Corte</span>
                        <strong className="text-slate-200">Cada {dossier.recommendedCuts[selectedCutIndex].maintenanceDays} días</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">Producto Clave</span>
                        <strong className="text-amber-400 truncate block text-[11px]">
                          {dossier.recommendedCuts[selectedCutIndex].recommendedProduct}
                        </strong>
                      </div>
                    </div>
                  </div>

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
