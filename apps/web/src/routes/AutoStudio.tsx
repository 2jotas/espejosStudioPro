import { useState } from "react";
import {
  Video, Sparkles, Wand2, Play, RefreshCw, Copy, Layers
} from "lucide-react";

interface ScriptItem {
  id: string;
  hook: string;
  body: string;
  cta: string;
  targetPlatform: "tiktok" | "reels" | "shorts";
  status: "draft" | "queued" | "rendered" | "published";
  topic: string;
}

export default function AutoStudio() {
  const [topic, setTopic] = useState("Visagismo para Rostro Redondo vs Cuadrado");
  const [tone, setTone] = useState("Controversial / Curiosidad");
  const [generating, setGenerating] = useState(false);
  const [scripts, setScripts] = useState<ScriptItem[]>([
    {
      id: "SCR-101",
      topic: "Rostro Redondo: El Error N°1 al Cortarse el Pelo",
      hook: "Si tienes la cara redonda y te haces este corte, literalmente estás haciéndote ver 5 kilos más pesado...",
      body: "El 80% de los hombres cometen el error de dejar volumen en los laterales. Para compensar la redondez, necesitas altura en la cúspide (Textured Crop) y un Mid Fade comprimido que marque ángulos rectos.",
      cta: "Comenta ROSTRO y nuestra IA te genera tu ficha de visagismo gratis en el link de la bio.",
      targetPlatform: "tiktok",
      status: "queued"
    },
    {
      id: "SCR-102",
      topic: "Mandíbula Diamante: Cómo Afilar tus Facciones",
      hook: "El corte que los barberos no te recomiendan porque toma más tiempo hacerlo...",
      body: "Los pómulos anchos necesitan un Taper Fade bajo que mantenga sombra en la sien y volumen texturizado desfilado hacia atrás.",
      cta: "Guarda este video y muéstraselo a tu barbero antes de que te arruine el perfil.",
      targetPlatform: "reels",
      status: "published"
    }
  ]);

  const generateNewScript = () => {
    setGenerating(true);
    setTimeout(() => {
      const newScript: ScriptItem = {
        id: `SCR-${Math.floor(Math.random() * 900 + 100)}`,
        topic: topic,
        hook: `¡Detente! Si tu mandíbula mide menos de 12cm y te afeitas la barba al ras, mira esto...`,
        body: `El visagismo correctivo enseña que una barba esculpida en degradado angular alarga el mentón un 25%. Combínalo con un Modern Mullet o French Crop texturizado.`,
        cta: `Entra a performance.espejosstudio.cl y escanea tu rostro con IA en 10 segundos.`,
        targetPlatform: "shorts",
        status: "draft"
      };
      setScripts([newScript, ...scripts]);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-cyan-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base flex items-center gap-2">
                ESPEJOS <span className="text-cyan-400 font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">AUTO STUDIO</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">AUTOMATED CONTENT & MONETIZATION PIPELINE</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Hermes Daemon: ACTIVO 24/7
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">VIDEOS EN COLA</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">12</div>
            <span className="text-[10px] text-slate-500">Programados para esta semana</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">VISTAS TOTALES (ESTIMADAS)</span>
            <div className="text-2xl font-black text-white mt-1">148.5K</div>
            <span className="text-[10px] text-emerald-400">+24% vs semana anterior</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">CLICS A PERFORMANCE APP</span>
            <div className="text-2xl font-black text-amber-400 mt-1">1,890</div>
            <span className="text-[10px] text-slate-400">Tasa de click-through: 4.8%</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">INGRESOS / CITAS CAPTADAS</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">$420.000</div>
            <span className="text-[10px] text-slate-400">Atribución directa de tráfico</span>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script Generator with Gemini */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Generador de Guiones Virales (Gemini 2.0)
                </h3>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  MODEL: FLASH-FAST
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Tema / Ángulo Viral</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Tono / Gancho Psicológico</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option>Controversial / Curiosidad</option>
                    <option>Error Común (Evitar dolor)</option>
                    <option>Tutorial Rápido 15 Segundos</option>
                    <option>Antes vs Después Impactante</option>
                  </select>
                </div>

                <button
                  onClick={generateNewScript}
                  disabled={generating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Redactando Hook & Estructura...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generar Nuevo Guion de Alto Impacto
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content Rules Tip */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-1 font-mono">
              <strong className="text-cyan-400 block font-sans text-xs">⚡ Regla de Oro del Algoritmo (2026):</strong>
              <p>Los primeros 2.5 segundos determinan el 90% de la retención. Cada video debe llevar a <strong className="text-slate-200">performance.espejosstudio.cl</strong> mediante el CTA en los últimos 4 segundos.</p>
            </div>
          </div>

          {/* Right Column: Scripts & Queue Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Cola de Producción & Distribución
              </h3>
              <span className="text-xs text-slate-400 font-mono">{scripts.length} guiones activos</span>
            </div>

            <div className="space-y-3">
              {scripts.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {item.id}
                      </span>
                      <span className="font-bold text-xs text-slate-200">{item.topic}</span>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      item.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : item.status === "queued"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                      <strong className="text-cyan-400 font-mono text-[10px] block mb-0.5">🎯 HOOK (0-3s):</strong>
                      <p className="text-slate-100 font-semibold">{item.hook}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 text-slate-300">
                      <strong className="text-slate-400 font-mono text-[10px] block mb-0.5">💬 CUERPO:</strong>
                      {item.body}
                    </div>

                    <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-900/30 text-cyan-200">
                      <strong className="text-cyan-400 font-mono text-[10px] block mb-0.5">🚀 CTA:</strong>
                      {item.cta}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span>Destino:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-mono uppercase text-[10px] text-slate-200">
                        {item.targetPlatform}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${item.hook}

${item.body}

${item.cta}`);
                          alert("¡Guion copiado al portapapeles!");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Copiar
                      </button>

                      <button
                        onClick={() => alert(`Enviando guion ${item.id} a la cola de renderizado en FFmpeg...`)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3" /> Renderizar Video
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
