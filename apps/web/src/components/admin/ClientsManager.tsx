import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, FileText, X, MessageSquare, Clock, UserX } from 'lucide-react';
import TechnicalSheetModal, { TechnicalSheetData } from './TechnicalSheetModal';

export interface ClientProfileData {
  id: string;
  notes: string | null;
  preferences: string | null;
  tags: string; // JSON stringified array
  visitCount: number;
  totalSpent: number;
  lastVisitAt: string | null;
}

export interface ClientItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  authMethod: 'passkey' | 'otp';
  createdAt: string;
  profile: ClientProfileData | null;
}

export default function ClientsManager() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Client for Technical Profile Modal
  const [activeClient, setActiveClient] = useState<ClientItem | null>(null);
  const [isTechSheetOpen, setIsTechSheetOpen] = useState(false);

  // Create Client Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const suggestedTags = ['turno', 'oficina', 'padre', 'vip'];

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedTag) queryParams.append('tag', selectedTag);

      const res = await fetch(`/api/clients?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Error al cargar la lista de clientes');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err: any) {
      console.error('Error al cargar la lista de clientes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery, selectedTag]);

  const openClientProfile = (client: ClientItem) => {
    setActiveClient(client);
    setIsTechSheetOpen(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          phone: newPhone.replace(/\D/g, ''),
          notes: newNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar cliente');

      setIsCreateModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
      setNewNotes('');
      fetchClients();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`¿Confirmas que deseas eliminar a "${name}" del CRM? (Esto marcará la entrada como "Esto no es un cliente")`)) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeClient?.id === id) setActiveClient(null);
        setClients((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const parsePreferences = (client: ClientItem): Partial<TechnicalSheetData> => {
    if (!client.profile?.preferences) return {};
    try {
      return JSON.parse(client.profile.preferences);
    } catch {
      return {};
    }
  };

  // Filtrar clientes que deberían volver esta semana (última visita entre 14 y 28 días)
  const clientsDueThisWeek = clients.filter((c) => {
    if (!c.profile?.lastVisitAt) return false;
    const last = new Date(c.profile.lastVisitAt).getTime();
    const daysSince = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
    return daysSince >= 14 && daysSince <= 28;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Base de Clientes & Fichas Técnicas</h2>
          <p className="text-slate-400 text-sm">Historial de fórmulas de corte, ritmo de visitas y preferencias</p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente Manual</span>
        </button>
      </div>

      {/* Bloque: Deberían volver esta semana */}
      {clientsDueThisWeek.length > 0 && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center space-x-2 text-indigo-300 text-sm font-bold mb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Recordatorios Sugeridos: Deberían volver esta semana ({clientsDueThisWeek.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {clientsDueThisWeek.map((c) => (
              <div key={c.id} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">{c.firstName} {c.lastName}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{c.phone}</span>
                </div>

                <a
                  href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=¡Hola%20${encodeURIComponent(c.firstName)}!%20💈%20¿Cómo%20va%20todo?%20Te%20escribo%20de%20Espejos%20Studio%20para%20ver%20si%20te%20agendamos%20tu%20corte%20esta%20semana.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-[11px] font-semibold rounded-xl flex items-center space-x-1 transition-all"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Búsqueda & Tags Sugeridos */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono (+569...)"
            className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tags sugeridos rápidos */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              !selectedTag ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          {suggestedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
                selectedTag === tag
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800/50" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <p className="text-slate-400 text-sm font-medium">No se encontraron clientes registrados.</p>
          <p className="text-slate-600 text-xs mt-1">Los clientes se registran automáticamente al reservar su primera hora.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const prefs = parsePreferences(client);
            return (
              <div
                key={client.id}
                onClick={() => openClientProfile(client)}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                        <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-white text-sm">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm truncate">
                          {client.firstName} {client.lastName}
                        </h3>
                        <div className="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      OTP OK
                    </span>
                  </div>

                  {/* Ficha Técnica Rápida */}
                  {prefs.corteHabitual ? (
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold">Corte:</span>
                        <span className="text-indigo-300 font-bold truncate max-w-[160px]">{prefs.corteHabitual}</span>
                      </div>
                      {prefs.ritmoDias && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Ritmo:</span>
                          <span>Cada {prefs.ritmoDias} días</span>
                        </div>
                      )}
                    </div>
                  ) : client.profile?.notes ? (
                    <p className="text-slate-400 text-xs bg-slate-950/80 p-2 rounded-xl border border-slate-800 line-clamp-2 italic">
                      "{client.profile.notes}"
                    </p>
                  ) : (
                    <p className="text-slate-600 text-[11px] italic">Sin ficha técnica registrada aún.</p>
                  )}
                </div>

                {/* Footer del card con botón 'Esto no es un cliente' */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1 text-indigo-400 font-semibold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Ficha</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(client.id, `${client.firstName} ${client.lastName}`);
                    }}
                    className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                    title="Esto no es un cliente (Eliminar ficha basura)"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ficha Técnica v1 */}
      {isTechSheetOpen && activeClient && (
        <TechnicalSheetModal
          clientId={activeClient.id}
          clientName={`${activeClient.firstName} ${activeClient.lastName}`}
          clientPhone={activeClient.phone}
          initialData={parsePreferences(activeClient)}
          onClose={() => setIsTechSheetOpen(false)}
          onSaved={() => {
            fetchClients();
          }}
          isMandatoryToClose={false}
        />
      )}

      {/* Modal Nuevo Cliente Manual */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Ej: Marcelo"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Ej: Ríos"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nota Inicial</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej: Cliente nuevo recomendado por Carlos..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {createError && (
                <p className="text-rose-400 text-xs">{createError}</p>
              )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-colors"
              >
                {isCreating ? 'Guardando...' : 'Crear Ficha de Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
