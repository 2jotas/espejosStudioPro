import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Users, Calendar, DollarSign, ExternalLink, Plus, Edit, Trash2, Search, Check, AlertCircle, RefreshCw
} from 'lucide-react';

interface StatsData {
  totalProfessionals: number;
  totalClients: number;
  totalAppointments: number;
  totalServices: number;
  totalRevenue: number;
  freePlanCount: number;
  proPlanCount: number;
}

interface ProfessionalItem {
  id: string;
  email: string;
  slug: string;
  businessName: string;
  phone?: string;
  whatsapp?: string;
  plan: 'free' | 'pro';
  createdAt: string;
  totalServices: number;
  totalClients: number;
  totalAppointments: number;
  completedCount: number;
  totalEarned: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<ProfessionalItem | null>(null);
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPlan, setFormPlan] = useState<'free' | 'pro'>('free');
  const [isSaving, setIsSaving] = useState(false);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, profsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/professionals'),
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
      if (profsRes.ok) {
        const pData = await profsRes.json();
        setProfessionals(pData.professionals || []);
      }
    } catch (e: any) {
      console.error('Error cargando datos de Super Admin:', e);
      setMsg({ type: 'error', text: 'Error al conectar con la API de Super Admin' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const openCreateModal = () => {
    setEditingProf(null);
    setFormBusinessName('');
    setFormEmail('');
    setFormSlug('');
    setFormPhone('');
    setFormPassword('');
    setFormPlan('pro');
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProfessionalItem) => {
    setEditingProf(p);
    setFormBusinessName(p.businessName);
    setFormEmail(p.email);
    setFormSlug(p.slug);
    setFormPhone(p.phone || '');
    setFormPassword('');
    setFormPlan(p.plan);
    setIsModalOpen(true);
  };

  const handleSaveProf = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      if (editingProf) {
        // Edit existing
        const res = await fetch(`/api/admin/professionals/${editingProf.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: formBusinessName,
            email: formEmail,
            slug: formSlug,
            phone: formPhone,
            plan: formPlan,
            newPassword: formPassword || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al actualizar profesional');

        setMsg({ type: 'success', text: 'Profesional actualizado correctamente' });
      } else {
        // Create new
        const res = await fetch('/api/admin/professionals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: formBusinessName,
            email: formEmail,
            slug: formSlug,
            phone: formPhone,
            password: formPassword,
            plan: formPlan,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al crear profesional');

        setMsg({ type: 'success', text: 'Nuevo profesional registrado exitosamente' });
      }

      setIsModalOpen(false);
      await fetchAdminData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePlan = async (p: ProfessionalItem) => {
    const nextPlan = p.plan === 'free' ? 'pro' : 'free';
    try {
      const res = await fetch(`/api/admin/professionals/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: nextPlan }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: `Plan de ${p.businessName} cambiado a ${nextPlan.toUpperCase()}` });
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProf = async (p: ProfessionalItem) => {
    if (!window.confirm(`¿Estás seguro de eliminar a "${p.businessName}"? Se borrarán todas sus citas, servicios y clientes.`)) return;

    try {
      const res = await fetch(`/api/admin/professionals/${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ type: 'success', text: `Profesional "${p.businessName}" eliminado del sistema.` });
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProfessionals = professionals.filter(
    (p) =>
      p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Platform</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
                  MASTER CONTROL
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Gestión global de profesionales, planes de suscripción y métricas de la plataforma
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={fetchAdminData}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-all"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Profesional</span>
            </button>
          </div>
        </div>

        {msg && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              {msg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
            <button onClick={() => setMsg(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Global Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Profesionales</span>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.totalProfessionals}</div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">{stats.proPlanCount} PRO</span>
                <span>•</span>
                <span className="text-slate-400">{stats.freePlanCount} FREE</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Clientes Globales</span>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.totalClients}</div>
              <p className="text-[11px] text-slate-400">Registrados en la plataforma</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Citas Agendadas</span>
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.totalAppointments}</div>
              <p className="text-[11px] text-slate-400">En todos los calendarios</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Volumen Generado</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                ${stats.totalRevenue.toLocaleString('es-CL')}
              </div>
              <p className="text-[11px] text-slate-400">Total servicios completados</p>
            </div>
          </div>
        )}

        {/* Search & Professionals Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Directorio de Profesionales Registrados</h2>
              <p className="text-slate-400 text-xs">Administra cuentas, planes de suscripción y accesos</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, email o slug..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Profesional / Negocio</th>
                  <th className="py-3 px-4">Dominio (Slug)</th>
                  <th className="py-3 px-4">Plan Actual</th>
                  <th className="py-3 px-4">Estadísticas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProfessionals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      No se encontraron profesionales registrados.
                    </td>
                  </tr>
                ) : (
                  filteredProfessionals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{p.businessName}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{p.email}</div>
                        {p.phone && <div className="text-slate-500 text-[10px] font-mono">{p.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/${p.slug}`}
                          target="_blank"
                          className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-mono text-xs font-semibold"
                        >
                          <span>/{p.slug}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePlan(p)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            p.plan === 'pro'
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                          title="Haz clic para cambiar entre FREE y PRO"
                        >
                          ⚡ {p.plan.toUpperCase()}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <span className="text-slate-300 font-semibold">{p.totalClients} clientes</span>
                          <span className="text-slate-500"> • </span>
                          <span className="text-slate-300 font-semibold">{p.totalAppointments} citas</span>
                          <div className="text-emerald-400 font-bold font-mono">
                            ${p.totalEarned.toLocaleString('es-CL')} recaudados
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/${p.slug}?preview=true`}
                            target="_blank"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                            title="Ver página de reserva"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs"
                            title="Editar profesional"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProf(p)}
                            className="p-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs"
                            title="Eliminar del sistema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT PROFESSIONAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingProf ? 'Editar Profesional' : 'Nuevo Profesional'}
                  </h3>
                  <p className="text-slate-400 text-xs">Configura los accesos y parámetros de la cuenta</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProf} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Negocio / Estudio</label>
                <input
                  type="text"
                  required
                  value={formBusinessName}
                  onChange={(e) => setFormBusinessName(e.target.value)}
                  placeholder="Ej: Estudio Palumbo Providencia"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contacto@estudio.cl"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slug / Dominio</label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="palumbo"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as 'free' | 'pro')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="free">FREE</option>
                    <option value="pro">PRO ⚡</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {editingProf ? 'Cambiar Contraseña (opcional)' : 'Contraseña de Acceso'}
                </label>
                <input
                  type="password"
                  required={!editingProf}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingProf ? 'Dejar en blanco para mantener actual' : 'Password123!'}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingProf ? 'Guardar Cambios' : 'Crear Profesional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
