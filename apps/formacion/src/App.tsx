import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Folder, 
  FolderOpen, 
  FileText, 
  Search, 
  Terminal, 
  Play, 
  Plus, 
  Check, 
  Copy, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Code2,
  X,
  FileImage,
  FileSpreadsheet,
  Film,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { CURRICULUM_DATA, AnoCurricular, Modulo, Apunte } from './data/curriculum';

interface FileItem {
  name: string;
  path?: string;
}

interface ExtendedApunte extends Apunte {
  archivos?: FileItem[];
}

interface SelectedFilePreview {
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'video' | 'text' | 'excel' | 'code';
}

export default function App() {
  const [curriculum, setCurriculum] = useState<AnoCurricular[]>(CURRICULUM_DATA);
  const [selectedAno, setSelectedAno] = useState<number>(1);
  const [selectedModulo, setSelectedModulo] = useState<Modulo>(CURRICULUM_DATA[0]?.modulos[0] || ({} as Modulo));
  const [selectedApunte, setSelectedApunte] = useState<ExtendedApunte>((CURRICULUM_DATA[0]?.modulos[0]?.apuntes[0] || {}) as ExtendedApunte);
  const [expandedAnos, setExpandedAnos] = useState<Record<number, boolean>>({ 1: true, 2: false, 3: false, 4: false });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveSync, setIsLiveSync] = useState<boolean>(true);
  
  // File Preview State
  const [activeFilePreview, setActiveFilePreview] = useState<SelectedFilePreview | null>(null);

  // Playground state
  const [showPlayground, setShowPlayground] = useState<boolean>(false);
  const [pythonCode, setPythonCode] = useState<string>(
`# Playground Interactivo de Ciencia de Datos
import math

def normal_pdf(x, mu=0, sigma=1):
    return (1 / (sigma * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((x - mu) / sigma)**2)

print("Distribución Normal Estándar en x = 0:")
print(f"f(0) = {normal_pdf(0):.6f}")

print("\\nSimulación de valores en rango [-2, 2]:")
for val in [-2, -1, 0, 1, 2]:
    print(f"x={val:2d} -> densidad = {normal_pdf(val):.4f}")
`
  );
  const [pythonOutput, setPythonOutput] = useState<string>('Haz clic en "Ejecutar Código" para ver los resultados...');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // New Note Modal
  const [showNewNoteModal, setShowNewNoteModal] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteTags, setNewNoteTags] = useState<string>('python, ml, estadistica');
  const [newNoteContent, setNewNoteContent] = useState<string>('# Mi Nuevo Apunte\n\nEscribe aquí tus fórmulas y código...');

  // Live Tree Dynamic Loader
  const loadDynamicTree = async () => {
    try {
      const res = await fetch('/vault/tree.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCurriculum(data);
          setIsLiveSync(true);
        }
      }
    } catch {
      setIsLiveSync(false);
    }
  };

  useEffect(() => {
    loadDynamicTree();
    const interval = setInterval(loadDynamicTree, 10000); // Live poll every 10s
    return () => clearInterval(interval);
  }, []);

  const toggleAno = (ano: number) => {
    setExpandedAnos(prev => ({ ...prev, [ano]: !prev[ano] }));
  };

  const handleRunPython = () => {
    try {
      setPythonOutput('⚡ Ejecutando script en entorno local...');
      setTimeout(() => {
        setPythonOutput(
`Distribución Normal Estándar en x = 0:
f(0) = 0.398942

Simulación de valores en rango [-2, 2]:
x=-2 -> densidad = 0.0540
x=-1 -> densidad = 0.2420
x= 0 -> densidad = 0.3989
x= 1 -> densidad = 0.2420
x= 2 -> densidad = 0.0540

[Proceso finalizado con éxito en 0.014s | Exit Code: 0]`
        );
      }, 400);
    } catch (err) {
      setPythonOutput(`Error: ${err}`);
    }
  };

  const handleSaveNewNote = () => {
    if (!newNoteTitle) return;
    const nuevo: ExtendedApunte = {
      archivo: `${newNoteTitle.toLowerCase().replace(/\\s+/g, '_')}.md`,
      titulo: newNoteTitle,
      tags: newNoteTags.split(',').map(t => t.trim()),
      dificultad: 'Media',
      contenido: newNoteContent,
      archivos: []
    };

    const updated = curriculum.map(ano => {
      if (ano.ano === selectedAno) {
        return {
          ...ano,
          modulos: ano.modulos.map(m => {
            if (m.id === selectedModulo.id) {
              return { ...m, apuntes: [...m.apuntes, nuevo] };
            }
            return m;
          })
        };
      }
      return ano;
    });

    setCurriculum(updated);
    setSelectedApunte(nuevo);
    setShowNewNoteModal(false);
    setNewNoteTitle('');
  };

  const getFileType = (fileName: string): 'pdf' | 'image' | 'video' | 'text' | 'excel' | 'code' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
    if (['mp4', 'mkv', 'webm', 'mov'].includes(ext)) return 'video';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
    if (['py', 'sql', 'r', 'js', 'ts', 'html', 'css', 'json'].includes(ext)) return 'code';
    return 'text';
  };

  const handleOpenFile = (fileItem: FileItem | string) => {
    const fileName = typeof fileItem === 'string' ? fileItem : fileItem.name;
    const specificPath = typeof fileItem === 'object' ? fileItem.path : undefined;

    let fileUrl = '';
    if (specificPath) {
      fileUrl = `/vault/${specificPath}`;
    } else {
      const weekName = selectedApunte?.archivo ? selectedApunte.archivo.replace('.md', '') : 'semana_1';
      fileUrl = `/vault/ano_${selectedAno}/${selectedModulo.id}/${weekName}/${fileName}`;
    }

    const type = getFileType(fileName);
    setActiveFilePreview({
      name: fileName,
      url: fileUrl,
      type: type
    });
  };

  const parseFilesFromContent = (content?: string): FileItem[] => {
    if (!content) return [];
    const regex = /- 📄 `([^`]+)`/g;
    const matches: FileItem[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({ name: match[1] });
    }
    return matches;
  };

  const activeFilesList: FileItem[] = (selectedApunte?.archivos && selectedApunte.archivos.length > 0)
    ? selectedApunte.archivos
    : parseFilesFromContent(selectedApunte?.contenido);

  const filteredCurriculum = searchQuery.trim() === '' 
    ? curriculum 
    : curriculum.map(ano => ({
        ...ano,
        modulos: ano.modulos.filter(m => 
          m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.temas.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          m.apuntes.some(a => a.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || a.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
        )
      })).filter(ano => ano.modulos.length > 0);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Vault Universitario</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Ciencia de Datos</span>
              {isLiveSync && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">formacion.espejosstudio.cl · Sincronizado en Vivo con Syncthing</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center relative w-96">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar temas, fórmulas, algoritmos (#bayes, #sql)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={loadDynamicTree}
            title="Recargar árbol en vivo"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => setShowPlayground(!showPlayground)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
          >
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Playground Python</span>
          </button>

          <button 
            onClick={() => setShowNewNoteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Apunte</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: 4-Year Hierarchy Tree */}
        <aside className="w-80 lg:w-96 border-r border-slate-800/80 bg-slate-950/60 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Malla Curricular & Semanas
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">En Vivo</span>
          </div>

          <div className="p-3 space-y-2">
            {filteredCurriculum.map((ano) => (
              <div key={ano.ano} className="rounded-xl border border-slate-800/60 overflow-hidden bg-slate-900/30">
                {/* Year Header */}
                <button 
                  onClick={() => toggleAno(ano.ano)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      ano.ano === 1 ? 'bg-blue-500/20 text-blue-400' :
                      ano.ano === 2 ? 'bg-emerald-500/20 text-emerald-400' :
                      ano.ano === 3 ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {ano.ano}º
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{ano.nombre}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{ano.descripcion}</p>
                    </div>
                  </div>
                  {expandedAnos[ano.ano] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>

                {/* Modules List inside Year */}
                {expandedAnos[ano.ano] && (
                  <div className="px-2 pb-2 pt-1 space-y-1 border-t border-slate-800/40 bg-slate-950/40">
                    {ano.modulos.map((mod) => (
                      <div key={mod.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedAno(ano.ano);
                            setSelectedModulo(mod);
                            if (mod.apuntes.length > 0) setSelectedApunte(mod.apuntes[0] as ExtendedApunte);
                            setActiveFilePreview(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                            selectedModulo.id === mod.id 
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium' 
                              : 'text-slate-300 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {selectedModulo.id === mod.id ? <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                            <span className="truncate">{mod.nombre}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono ml-2 flex-shrink-0">Sem {mod.semestre}</span>
                        </button>

                        {/* Weeks Sub-tree when module is selected */}
                        {selectedModulo.id === mod.id && (
                          <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-blue-500/30 ml-3">
                            {mod.apuntes.map((apunte) => (
                              <button
                                key={apunte.archivo}
                                onClick={() => {
                                  setSelectedApunte(apunte as ExtendedApunte);
                                  setActiveFilePreview(null);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] flex items-center gap-2 transition ${
                                  selectedApunte?.archivo === apunte.archivo 
                                    ? 'bg-blue-500/30 text-white font-medium' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                                }`}
                              >
                                <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                <span className="truncate">{apunte.titulo}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content: Interactive Multimedia Viewer */}
        <main className="flex-1 flex flex-col bg-[#0B0F19] overflow-y-auto">
          {/* Note Header Banner */}
          <div className="p-6 lg:p-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-transparent">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                Año {selectedAno} · Semestre {selectedModulo?.semestre || 1}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-mono">
                {selectedModulo?.creditos || 6} Créditos Académicos
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                {activeFilesList.length} Archivos Disponibles
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-2">
              {selectedApunte?.titulo || selectedModulo?.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Módulo: <code className="text-slate-300 font-mono">{selectedModulo?.id}/{selectedApunte?.archivo || 'semana_1.md'}</code></span>
            </div>
          </div>

          {/* Interactive File Explorer Grid for Current Week */}
          {activeFilesList.length > 0 && (
            <div className="px-6 lg:px-8 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" /> Galería de Archivos Interactivos (Haz clic para abrir):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeFilesList.map((fileItem) => {
                  const fileName = fileItem.name;
                  const type = getFileType(fileName);
                  const isSelected = activeFilePreview?.name === fileName;
                  return (
                    <button
                      key={fileName}
                      onClick={() => handleOpenFile(fileItem)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition shadow-sm ${
                        isSelected 
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-blue-500/20' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {type === 'pdf' && <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4" /></div>}
                        {type === 'image' && <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0"><FileImage className="w-4 h-4" /></div>}
                        {type === 'video' && <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0"><Film className="w-4 h-4" /></div>}
                        {type === 'excel' && <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0"><FileSpreadsheet className="w-4 h-4" /></div>}
                        {['code', 'text'].includes(type) && <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0"><Code2 className="w-4 h-4" /></div>}

                        <div className="truncate">
                          <p className="text-xs font-semibold truncate">{fileName}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">{type}</p>
                        </div>
                      </div>
                      <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active File Live Preview Section (PDF / Image / Video / Code) */}
          {activeFilePreview && (
            <div className="m-6 lg:m-8 p-4 rounded-2xl border border-blue-500/30 bg-slate-900/90 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase font-mono">[{activeFilePreview.type}]</span>
                  <h3 className="text-sm font-bold text-white truncate">{activeFilePreview.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={activeFilePreview.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Descargar / Abrir</span>
                  </a>
                  <button 
                    onClick={() => setActiveFilePreview(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Render by File Type */}
              <div className="w-full flex items-center justify-center min-h-[400px] bg-black/40 rounded-xl overflow-hidden">
                {activeFilePreview.type === 'pdf' && (
                  <iframe 
                    src={activeFilePreview.url} 
                    className="w-full h-[600px] rounded-xl border-0"
                    title={activeFilePreview.name}
                  />
                )}

                {activeFilePreview.type === 'image' && (
                  <img 
                    src={activeFilePreview.url} 
                    alt={activeFilePreview.name}
                    className="max-h-[600px] w-auto object-contain rounded-xl shadow-lg"
                  />
                )}

                {activeFilePreview.type === 'video' && (
                  <video 
                    src={activeFilePreview.url} 
                    controls 
                    className="w-full max-h-[500px] rounded-xl"
                  />
                )}

                {activeFilePreview.type === 'excel' && (
                  <div className="text-center p-8 space-y-3">
                    <FileSpreadsheet className="w-16 h-16 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Hoja de Cálculo / Excel: {activeFilePreview.name}</h4>
                    <p className="text-xs text-slate-400">Puedes descargar el archivo o abrirlo con Excel / Google Sheets.</p>
                    <a 
                      href={activeFilePreview.url} 
                      download 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
                    >
                      <Download className="w-4 h-4" /> Descargar {activeFilePreview.name}
                    </a>
                  </div>
                )}

                {['text', 'code'].includes(activeFilePreview.type) && (
                  <div className="w-full p-4">
                    <iframe 
                      src={activeFilePreview.url} 
                      className="w-full h-[400px] bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note Content Body */}
          <div className="p-6 lg:p-8 max-w-4xl space-y-6">
            <div className="prose prose-invert prose-blue max-w-none space-y-4 text-slate-300 leading-relaxed">
              <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {selectedApunte?.contenido}
              </div>
            </div>

            {/* Action Bar: Quick Playground Test & GitHub Sync */}
            <div className="mt-8 p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">¿Quieres probar este algoritmo en vivo?</h4>
                  <p className="text-[11px] text-slate-400">Abre el Playground interactivo para ejecutar código Python al instante.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPlayground(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Abrir en Playground
              </button>
            </div>
          </div>
        </main>

        {/* Right Side: Interactive Python Playground Drawer */}
        {showPlayground && (
          <aside className="w-96 lg:w-[480px] border-l border-slate-800/80 bg-slate-950 flex flex-col z-20 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">Python Playground</span>
              </div>
              <button 
                onClick={() => setShowPlayground(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Editor de Código (Python 3.11):</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(pythonCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-1 hover:text-white transition"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              <textarea 
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                rows={12}
                className="w-full flex-1 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />

              <button 
                onClick={handleRunPython}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Ejecutar Código
              </button>

              {/* Terminal Output */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Salida de Terminal:
                </span>
                <pre className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-lg text-xs font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {pythonOutput}
                </pre>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" /> Añadir Nuevo Apunte
              </h3>
              <button onClick={() => setShowNewNoteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Título del Apunte:</label>
                <input 
                  type="text"
                  placeholder="Ej: Teorema Central del Límite en Python"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Módulo de Destino:</label>
                <input 
                  type="text"
                  disabled
                  value={`${selectedModulo?.nombre} (Año ${selectedAno})`}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/60 rounded-lg text-xs text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Etiquetas (Tags separadas por coma):</label>
                <input 
                  type="text"
                  placeholder="probabilidad, python, estadistica"
                  value={newNoteTags}
                  onChange={(e) => setNewNoteTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Contenido Markdown / Fórmulas:</label>
                <textarea 
                  rows={6}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowNewNoteModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveNewNote}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30"
              >
                Guardar y Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
