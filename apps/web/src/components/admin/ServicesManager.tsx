import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, Sparkles, AlertTriangle, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
  order: number;
}

export default function ServicesManager() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>(30);
  const [price, setPrice] = useState<number | string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Error al cargar la lista de servicios');
      const data = await res.json();
      setServices(data.services);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDurationMinutes(30);
    setPrice('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setDurationMinutes(service.durationMinutes);
    setPrice(service.price);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          durationMinutes: Number(durationMinutes),
          price: Number(price),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error guardando servicio');
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (service: ServiceItem) => {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: !s.active } : s))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeCount = services.filter((s) => s.active).length;
  const isLimitReached = user?.plan === 'free' && activeCount >= 5;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Catálogo de Servicios</h2>
          <p className="text-slate-400 text-sm">Gestiona tus servicios, precios y duraciones para la reserva online</p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={isLimitReached}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2 w-fit disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Servicio</span>
        </button>
      </div>

      {/* Plan Free Limit Notice */}
      {user?.plan === 'free' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-slate-300">
            <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <span>
              Plan Free: <strong className="text-white">{activeCount} / 5</strong> servicios activos en uso.
            </span>
          </div>
          {isLimitReached && (
            <span className="text-rose-400 font-semibold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Límite alcanzado (Actualiza a Pro)
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Services List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <p className="mb-4">No tienes servicios agregados aún.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl"
          >
            Crear mi primer servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-slate-900/80 border rounded-2xl p-5 flex flex-col justify-between transition-all backdrop-blur-sm ${
                service.active ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-white text-base">{service.name}</h3>
                  <button
                    onClick={() => toggleActive(service)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors ${
                      service.active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {service.active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>

                <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                  {service.description || 'Sin descripción'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs mb-4">
                  <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{service.durationMinutes} min</span>
                  </div>
                  <div className="flex items-center space-x-1 font-bold text-white text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-400 -mr-1" />
                    <span>${service.price.toLocaleString('es-CL')} CLP</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Define el nombre, duración y tarifa del servicio
            </p>

            {formError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Corte de Cabello Signature"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre lo que incluye el servicio..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duración (Minutos)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio ($ CLP)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="17990"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
