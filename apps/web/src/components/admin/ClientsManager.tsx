import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, Calendar, DollarSign, Tag, FileText, X, Check, Trash2, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  // Selected Client for Technical Profile Drawer/Modal
  const [activeClient, setActiveClient] = useState<ClientItem | null>(null);
  const [notes, setNotes] = useState('');
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Create Client Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedTag) queryParams.append('tag', selectedTag);

      const res = await fetch(`/api/clients?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Error al cargar la lista de clientes');
      const data = await res.json();
      setClients(data.clients);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery, selectedTag]);

  const openClientProfile = (client: ClientItem) => {
    setActiveClient(client);
    setNotes(client.profile?.notes || '');
    setProfileSuccessMsg(null);

    try {
      setTagsList(client.profile?.tags ? JSON.parse(client.profile.tags) : []);
    } catch {
      setTagsList([]);
    }
  };

  const handleSaveProfile = async () => {
    if (!activeClient) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const res = await fetch(`/api/clients/${activeClient.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          tags: tagsList,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar la ficha técnica');

      setProfileSuccessMsg('Ficha técnica actualizada correctamente');
      setTimeout(() => setProfileSuccessMsg(null), 3000);

      // Update local state
      setClients((prev) =>
        prev.map((c) =>
          c.id === activeClient.id
            ? {
                ...c,
                profile: {
                  ...c.profile!,
                  notes,
                  tags: JSON.stringify(tagsList),
                },
              }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addTag = () => {
    if (!newTagInput.trim()) return;
    const tagClean = newTagInput.trim();
    if (!tagsList.includes(tagClean)) {
      setTagsList([...tagsList, tagClean]);
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter((t) => t !== tagToRemove));
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
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
          notes: newNotes || undefined,
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

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar a este cliente del CRM?')) return;

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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Base de Clientes (CRM)</h2>
          <p className="text-slate-400 text-sm">Fichas técnicas, preferencias e historial de consumo de tu cartera</p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2 w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apellido o teléfono..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl flex items-center space-x-1"
          >
            <span>Filtro tag: {selectedTag}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Clients */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <p className="mb-2">No se encontraron clientes que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const parsedTags: string[] = client.profile?.tags ? JSON.parse(client.profile.tags) : [];

            return (
              <div
                key={client.id}
                onClick={() => openClientProfile(client)}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-950/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                        <div className="h-full w-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-white text-sm">
                          {client.firstName[0]}
                          {client.lastName[0]}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {client.firstName} {client.lastName}
                        </h3>
                        <div className="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        client.authMethod === 'passkey'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {client.authMethod}
                    </span>
                  </div>

                  {/* Tags */}
                  {parsedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {parsedTags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 text-[11px] font-medium rounded-md border border-slate-700/60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {client.profile?.notes && (
                    <p className="text-slate-400 text-xs line-clamp-2 bg-slate-950 p-2.5 rounded-xl border border-slate-900 mb-4 italic">
                      "{client.profile.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{client.profile?.visitCount || 0} visitas</span>
                  </div>
                  <div className="flex items-center space-x-1 font-semibold text-emerald-400">
                    <DollarSign className="w-3.5 h-3.5 -mr-1" />
                    <span>${(client.profile?.totalSpent || 0).toLocaleString('es-CL')} CLP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer / Modal — Technical Profile */}
      {activeClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => setActiveClient(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              {/* Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1.5px]">
                  <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-white text-xl">
                    {activeClient.firstName[0]}
                    {activeClient.lastName[0]}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {activeClient.firstName} {activeClient.lastName}
                  </h2>
                  <p className="text-slate-400 text-xs font-mono">{activeClient.phone}</p>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] uppercase font-bold">Visitas Totales</span>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    {activeClient.profile?.visitCount || 0}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] uppercase font-bold">Gasto Acumulado</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    ${(activeClient.profile?.totalSpent || 0).toLocaleString('es-CL')}
                  </div>
                </div>
              </div>

              {/* Technical Notes Field */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-slate-300 mb-2 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Notas Técnicas del Cliente</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Prefiere corte degradado bajo #1. Sensible al alcohol post-afeitado. Aroma a eucalipto..."
                  rows={4}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Tag Manager */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-slate-300 mb-2 flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span>Etiquetas del Cliente</span>
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                    >
                      <span>#{tag}</span>
                      <button onClick={() => removeTag(tag)} className="hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Agregar tag (ej: VIP, Piel Sensible)..."
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeleteClient(activeClient.id)}
                className="px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Cliente</span>
              </button>

              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center space-x-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create Client */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Registrar Nuevo Cliente</h3>
            <p className="text-slate-400 text-xs mb-6">Ingresa los datos para agregarlo al CRM</p>

            {createError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Matías"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="González"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+56987654321"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nota Inicial (Opcional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalles sobre el cliente..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreating ? 'Registrando...' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
