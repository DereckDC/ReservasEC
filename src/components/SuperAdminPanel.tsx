import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldAlert, FolderTree, Building, Plus, Trash2, Edit, Save, 
  Check, X, Sparkles, MapPin, Phone, MessageSquare, Image,
  TrendingUp, DollarSign, Calendar as CalendarIcon, Activity, PieChart as PieIcon, RefreshCw, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { db } from '../lib/db';
import { Profile, Category, Business, UserRole, Appointment, Service } from '../types';

interface SuperAdminPanelProps {
  onNavigateBack: () => void;
  activeTab?: 'dashboard' | 'users' | 'categories' | 'businesses';
  setActiveTab?: (tab: 'dashboard' | 'users' | 'categories' | 'businesses') => void;
}

const COLORS = ['#c5a059', '#e2e8f0', '#4a5568', '#f56565', '#4299e1', '#48bb78'];

export default function SuperAdminPanel({ 
  onNavigateBack,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab
}: SuperAdminPanelProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'dashboard' | 'users' | 'categories' | 'businesses'>('dashboard');
  
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setLocalActiveTab;

  const [users, setUsers] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros Dashboard
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Formularios de Creación
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [newBiz, setNewBiz] = useState<Omit<Business, 'id' | 'created_at'>>({
    name: '',
    slug: '',
    description: '',
    category: '',
    logo_url: '',
    cover_url: '',
    phone: '',
    address: '',
    gallery_urls: [],
    certificates: [],
    google_maps_url: ''
  });

  const [bizGalleryLinkInput, setBizGalleryLinkInput] = useState('');
  const [bizGalleryMode, setBizGalleryMode] = useState<'upload' | 'link'>('upload');

  const [editingBizId, setEditingBizId] = useState<string | null>(null);

  const handleSelectBusinessForEdit = (biz: Business) => {
    setEditingBizId(biz.id);
    setNewBiz({
      name: biz.name,
      slug: biz.slug,
      description: biz.description || '',
      category: biz.category,
      logo_url: biz.logo_url || '',
      cover_url: biz.cover_url || '',
      phone: biz.phone,
      address: biz.address,
      gallery_urls: biz.gallery_urls || [],
      certificates: biz.certificates || [],
      google_maps_url: biz.google_maps_url || ''
    });
    const formElement = document.getElementById('biz-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingBizId(null);
    setNewBiz({
      name: '',
      slug: '',
      description: '',
      category: categories[0]?.name || 'Otros',
      logo_url: '',
      cover_url: '',
      phone: '',
      address: '',
      gallery_urls: [],
      certificates: [],
      google_maps_url: ''
    });
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const allUsers = await db.getProfiles();
      setUsers(allUsers);

      const allCats = await db.getCategories();
      setCategories(allCats);

      const allBiz = await db.getBusinesses();
      setBusinesses(allBiz);
      
      const allApts = await db.getAppointments(undefined, undefined, undefined);
      setAppointments(allApts);

      const allSrvs = await db.getServices();
      setServices(allSrvs);

      if (allCats.length > 0) {
        setNewBiz(prev => ({ ...prev, category: allCats[0].name }));
      }
    } catch (err) {
      console.error('Error al cargar datos en Super Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Cambiar rol de usuario
  const handleChangeRole = async (userId: string, role: UserRole, businessId?: string) => {
    try {
      await db.updateProfileRole(userId, role, businessId);
      await loadAllData();
    } catch (err) {
      console.error('Error al actualizar rol de usuario:', err);
    }
  };

  // Alternar visibilidad de empresa (Ocultar/Mostrar)
  const handleToggleVisibility = async (businessId: string, currentVal: boolean) => {
    try {
      await db.updateBusiness(businessId, { is_visible: !currentVal });
      await loadAllData();
    } catch (err) {
      console.error('Error al cambiar visibilidad del negocio:', err);
    }
  };

  // Categorías
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await db.createCategory({
        name: newCatName,
        description: newCatDesc
      });
      setNewCatName('');
      setNewCatDesc('');
      await loadAllData();
    } catch (err) {
      console.error('Error al crear categoría:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría de servicios?')) return;
    try {
      await db.deleteCategory(id);
      await loadAllData();
      alert('Categoría de servicios eliminada correctamente.');
    } catch (err: any) {
      console.error('Error al eliminar categoría:', err);
      alert('Error al eliminar categoría: ' + (err.message || err));
    }
  };

  // Negocios (Crear o Editar)
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBiz.name || !newBiz.slug) return;

    try {
      if (editingBizId) {
        await db.updateBusiness(editingBizId, newBiz);
        setEditingBizId(null);
        alert('¡Empresa / Negocio Actualizado con Éxito!');
      } else {
        await db.createBusiness(newBiz);
        alert('¡Nueva Empresa / Negocio Creado con Éxito!');
      }

       setNewBiz({
        name: '',
        slug: '',
        description: '',
        category: categories[0]?.name || 'Otros',
        logo_url: '',
        cover_url: '',
        phone: '',
        address: '',
        gallery_urls: [],
        certificates: [],
        google_maps_url: ''
      });
      await loadAllData();
    } catch (err: any) {
      alert('Error al procesar negocio: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200 text-slate-900" id="super-admin-panel">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#c5a059] tracking-widest block">Módulo de Súper Administrador Global</span>
          <h1 className="font-display italic font-bold text-3xl text-[#c5a059] tracking-tight mt-1">
            Consola de Súper Administración
          </h1>
          <p className="text-slate-600 text-sm mt-1">Modifica roles de usuarios, crea categorías del ecosistema y añade nuevas empresas al catálogo.</p>
        </div>
        <div>
          <button
            onClick={onNavigateBack}
            className="border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>

      {/* CONTENIDO DE TAB */}
      <div className="space-y-6" id="superadmin-tab-content">

        {/* TAB 0: DASHBOARD GENERAL */}
        {activeTab === 'dashboard' && (() => {
          // Filtrar citas según los filtros seleccionados
          const filtered = appointments.filter(apt => {
            if (selectedBusinessId && apt.business_id !== selectedBusinessId) return false;
            if (startDate && apt.appointment_date < startDate) return false;
            if (endDate && apt.appointment_date > endDate) return false;
            return true;
          });

          // Métricas clave
          const totalCount = filtered.length;
          const attendedCount = filtered.filter(a => a.status === 'completed' || a.status === 'attended').length;
          const reservedCount = filtered.filter(a => a.status === 'confirmed' || a.status === 'reserved').length;
          const pendingCount = filtered.filter(a => a.status === 'pending').length;
          const cancelledCount = filtered.filter(a => a.status === 'cancelled').length;

          // Ingresos estimados (solo citas no canceladas)
          let totalEstRevenue = 0;
          filtered.forEach(apt => {
            if (apt.status !== 'cancelled') {
              const srv = services.find(s => s.id === apt.service_id);
              if (srv) {
                totalEstRevenue += Number(srv.price);
              } else {
                totalEstRevenue += 30; // precio promedio estimado fallback
              }
            }
          });

          const cancelRate = totalCount > 0 ? ((cancelledCount / totalCount) * 100).toFixed(1) : '0';
          const occupancyRate = totalCount > 0 ? (((attendedCount + reservedCount) / totalCount) * 100).toFixed(1) : '0';

          // Datos para gráfico de barras: Citas por negocio
          const businessDataMap: Record<string, { name: string, count: number, revenue: number }> = {};
          businesses.forEach(b => {
            businessDataMap[b.id] = { name: b.name, count: 0, revenue: 0 };
          });

          filtered.forEach(apt => {
            const biz = businessDataMap[apt.business_id] || { name: apt.business_name || 'Desconocido', count: 0, revenue: 0 };
            biz.count += 1;
            if (apt.status !== 'cancelled') {
              const srv = services.find(s => s.id === apt.service_id);
              biz.revenue += srv ? Number(srv.price) : 30;
            }
            businessDataMap[apt.business_id] = biz;
          });

          const businessChartData = Object.values(businessDataMap).sort((a,b) => b.count - a.count);

          // Datos para gráfico de torta: Distribución de estados
          const statusChartData = [
            { name: 'Pendiente', value: pendingCount, color: '#c5a059' },
            { name: 'Reservado', value: reservedCount, color: '#48bb78' },
            { name: 'Atendido', value: attendedCount, color: '#4299e1' },
            { name: 'Cancelado', value: cancelledCount, color: '#f56565' }
          ].filter(d => d.value > 0);

          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Barra de Filtros */}
              <div className="bg-[#1c2128] border border-[#2d333b] rounded-xl p-5 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-end">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                  {/* Selector de Empresa */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#e2e8f0]/60 uppercase tracking-wider">Filtrar por Empresa</label>
                    <select
                      value={selectedBusinessId}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none"
                    >
                      <option value="" className="bg-[#16191f]">Todas las Empresas</option>
                      {businesses.map(b => (
                        <option key={b.id} value={b.id} className="bg-[#16191f]">{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha de Inicio */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#e2e8f0]/60 uppercase tracking-wider">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none"
                    />
                  </div>

                  {/* Fecha de Fin */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#e2e8f0]/60 uppercase tracking-wider">Fecha de Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Botón de Limpiar */}
                <div className="flex gap-2">
                  {(selectedBusinessId || startDate || endDate) && (
                    <button
                      onClick={() => {
                        setSelectedBusinessId('');
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="bg-[#0f1115] border border-[#2d333b] text-xs hover:bg-white/5 font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 text-[#e2e8f0]/60 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Limpiar Filtros</span>
                    </button>
                  )}
                  <button
                    onClick={loadAllData}
                    className="bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 hover:bg-[#c5a059] hover:text-[#0f1115] text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>

              {/* Tarjetas de Métricas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ingresos Totales */}
                <div className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#e2e8f0]/40 tracking-wider block">Ingresos Estimados</span>
                    <span className="font-mono font-bold text-xl sm:text-2xl text-[#c5a059]">${totalEstRevenue.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* Citas Totales */}
                <div className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#e2e8f0]/40 tracking-wider block">Volumen de Citas</span>
                    <span className="font-mono font-bold text-xl sm:text-2xl text-[#e2e8f0]">{totalCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                </div>

                {/* Ocupación Efectiva */}
                <div className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#e2e8f0]/40 tracking-wider block">Reservas Confirmadas</span>
                    <span className="font-mono font-bold text-xl sm:text-2xl text-emerald-400">{occupancyRate}%</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                {/* Cancelaciones */}
                <div className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#e2e8f0]/40 tracking-wider block">Tasa Cancelación</span>
                    <span className="font-mono font-bold text-xl sm:text-2xl text-red-400">{cancelRate}%</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                    <TrendingUp className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              </div>

              {/* Gráficos Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribución por Empresa (BarChart) */}
                <div className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-lg lg:col-span-2 space-y-4">
                  <h4 className="font-display italic font-bold text-sm text-[#c5a059] flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>Citas e Ingresos por Negocio / Establecimiento</span>
                  </h4>

                  {businessChartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center border border-dashed border-[#2d333b] rounded-lg">
                      <span className="text-xs text-[#e2e8f0]/40">Sin datos operacionales</span>
                    </div>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={businessChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" />
                          <XAxis dataKey="name" stroke="rgba(226, 232, 240, 0.5)" fontSize={10} />
                          <YAxis stroke="rgba(226, 232, 240, 0.5)" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#16191f', borderColor: '#2d333b', color: '#e2e8f0' }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="count" name="Número de Citas" fill="#c5a059" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="revenue" name="Ingreso Estimado ($)" fill="#4299e1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Estado de Citas (PieChart) */}
                <div className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-lg space-y-4">
                  <h4 className="font-display italic font-bold text-sm text-[#c5a059] flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4" />
                    <span>Distribución de Estados</span>
                  </h4>

                  {statusChartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center border border-dashed border-[#2d333b] rounded-lg">
                      <span className="text-xs text-[#e2e8f0]/40">Sin reservas registradas</span>
                    </div>
                  ) : (
                    <div className="h-72 flex flex-col items-center justify-center">
                      <div className="w-full h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {statusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#16191f', borderColor: '#2d333b', color: '#e2e8f0' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="w-full space-y-1.5 pt-2">
                        {statusChartData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[#e2e8f0]/80">{item.name}</span>
                            </div>
                            <span className="font-mono font-bold text-[#c5a059]">{item.value} ({((item.value / totalCount) * 100).toFixed(0)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* CONTENIDO DE TAB (RESTANTES) */}

        {/* TAB 1: GESTIÓN DE ROLES */}
        {activeTab === 'users' && (
          <div className="bg-[#1c2128] border border-[#2d333b] rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-[#2d333b] bg-[#0f1115]">
              <h3 className="font-display italic font-bold text-base text-[#c5a059]">Privilegios y Roles Operacionales</h3>
              <p className="text-xs text-[#e2e8f0]/60 mt-1">Cambia los roles de usuarios entre Cliente, Admin (asociado a un negocio específico) o Súper Administrador Global.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f1115]/50 text-[10px] font-bold text-[#e2e8f0]/40 uppercase border-b border-[#2d333b]">
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Correo</th>
                    <th className="p-4">Rol Asignado</th>
                    <th className="p-4">Negocio Relacionado</th>
                    <th className="p-4 text-right">Acción de Cambio de Privilegios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d333b] text-xs text-[#e2e8f0]/80">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-[#e2e8f0]">{u.full_name}</td>
                      <td className="p-4 font-mono text-[#e2e8f0]/40">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold inline-block border ${
                          u.role === 'superadmin'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : u.role === 'admin'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20'
                            : u.role === 'professional'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        {(u.role === 'admin' || u.role === 'professional') && u.business_id ? (
                          <span className="font-bold text-[#c5a059]">
                            {businesses.find(b => b.id === u.business_id)?.name || 'Negocio No Encontrado'}
                          </span>
                        ) : (
                          <span className="text-[#e2e8f0]/40">N/A (Cliente o Global)</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => {
                              const newRole = e.target.value as UserRole;
                              const bizId = (newRole === 'admin' || newRole === 'professional') ? (businesses[0]?.id || undefined) : undefined;
                              handleChangeRole(u.id, newRole, bizId);
                            }}
                            className="text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded p-1.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none"
                          >
                            <option value="client" className="bg-[#16191f]">Convertir en Cliente</option>
                            <option value="professional" className="bg-[#16191f]">Convertir en Profesional</option>
                            <option value="admin" className="bg-[#16191f]">Convertir en Admin de Negocio</option>
                            <option value="superadmin" className="bg-[#16191f]">Convertir en Super Admin</option>
                          </select>

                          {(u.role === 'admin' || u.role === 'professional') && (
                            <select
                              value={u.business_id || ''}
                              onChange={(e) => {
                                handleChangeRole(u.id, u.role, e.target.value || undefined);
                              }}
                              className="text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded p-1.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none"
                            >
                              <option value="" className="bg-[#16191f]">Seleccionar Negocio...</option>
                              {businesses.map((b) => (
                                <option key={b.id} value={b.id} className="bg-[#16191f]">{b.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORÍAS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Formulario de Alta */}
            <form onSubmit={handleCreateCategory} className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl space-y-4">
              <div>
                <h4 className="font-display italic font-bold text-sm text-[#c5a059]">Crear Categoría Global</h4>
                <p className="text-xs text-[#e2e8f0]/60 mt-0.5 font-sans">Permite organizar los servicios de todas las empresas afiliadas.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Barberías, Estética..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Escribe una breve reseña de los alcances de esta categoría..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg shadow-md transition-colors"
              >
                Crear Categoría Global
              </button>
            </form>

            {/* Listado de Categorías */}
            <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl md:col-span-2 space-y-4">
              <div>
                <h4 className="font-display italic font-bold text-sm text-[#c5a059]">Estructura Global de Categorías</h4>
                <p className="text-xs text-[#e2e8f0]/60 mt-0.5 font-sans">Categorías de servicios operacionales activas en la base de datos.</p>
              </div>

              <div className="divide-y divide-[#2d333b]">
                {categories.map((c) => (
                  <div key={c.id} className="flex justify-between items-start py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 pr-4">
                      <span className="font-bold text-xs text-[#e2e8f0] block">{c.name}</span>
                      <span className="text-[11px] text-[#e2e8f0]/60 block leading-normal">{c.description || 'Sin descripción'}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 border border-red-900/30 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALTA DE NEGOCIOS */}
        {activeTab === 'businesses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Formulario de Registro */}
            <form onSubmit={handleCreateBusiness} id="biz-form-container" className="bg-[#1c2128] p-6 rounded-xl border border-[#2d333b] shadow-xl space-y-4 lg:col-span-1 scroll-mt-24">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display italic font-bold text-sm text-[#c5a059]">
                    {editingBizId ? 'Editar Empresa / Negocio' : 'Dar de Alta Nueva Empresa'}
                  </h4>
                  <p className="text-xs text-[#e2e8f0]/60 mt-0.5">
                    {editingBizId 
                      ? 'Modifica los datos de la empresa seleccionada y guarda los cambios.' 
                      : 'Ingresa los datos para registrar la empresa dentro del ecosistema.'}
                  </p>
                </div>
                {editingBizId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[10px] text-[#c5a059] hover:underline font-bold"
                  >
                    Nueva Empresa
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Spa Wellness"
                  value={newBiz.name}
                  onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Slug Único (para URLs)</label>
                <input
                  type="text"
                  required
                  placeholder="ej. spa-wellness"
                  value={newBiz.slug}
                  onChange={(e) => setNewBiz({ ...newBiz, slug: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Categoría Global</label>
                <select
                  value={newBiz.category}
                  onChange={(e) => setNewBiz({ ...newBiz, category: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#16191f]">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Teléfono</label>
                <input
                  type="text"
                  required
                  placeholder="+34 611 111 222"
                  value={newBiz.phone}
                  onChange={(e) => setNewBiz({ ...newBiz, phone: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Dirección Física</label>
                <input
                  type="text"
                  required
                  placeholder="Calle Falsa 123"
                  value={newBiz.address}
                  onChange={(e) => setNewBiz({ ...newBiz, address: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Enlace a Google Maps (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={newBiz.google_maps_url || ''}
                  onChange={(e) => setNewBiz({ ...newBiz, google_maps_url: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Descripción Breve</label>
                <textarea
                  rows={3}
                  placeholder="Resumen para el catálogo..."
                  value={newBiz.description}
                  onChange={(e) => setNewBiz({ ...newBiz, description: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              {/* Fotos del Negocio (Galería) - Máximo 10 fotos */}
              <div className="space-y-2.5 border-t border-[#2d333b] pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Galería de Fotos (Máx. 10)</label>
                  <span className="text-[10px] text-[#c5a059] font-mono">{(newBiz.gallery_urls || []).length} / 10</span>
                </div>

                {/* Selector de modo: Almacén Interno o Enlace URL */}
                <div className="flex gap-2 p-0.5 bg-[#0f1115] border border-[#2d333b] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setBizGalleryMode('upload')}
                    className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      bizGalleryMode === 'upload' 
                        ? 'bg-[#c5a059] text-[#0f1115]' 
                        : 'text-[#e2e8f0]/60 hover:text-[#e2e8f0]'
                    }`}
                  >
                    Almacén Interno (Subir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizGalleryMode('link')}
                    className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      bizGalleryMode === 'link' 
                        ? 'bg-[#c5a059] text-[#0f1115]' 
                        : 'text-[#e2e8f0]/60 hover:text-[#e2e8f0]'
                    }`}
                  >
                    Por Enlace Link
                  </button>
                </div>
                
                {(newBiz.gallery_urls || []).length < 10 ? (
                  bizGalleryMode === 'upload' ? (
                    <div className="border border-dashed border-[#2d333b] hover:border-[#c5a059]/40 bg-[#0f1115] rounded-lg p-3 text-center cursor-pointer transition-all relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          const currentGallery = newBiz.gallery_urls || [];
                          const spaceLeft = 10 - currentGallery.length;
                          if (files.length > spaceLeft) {
                            alert(`Solo puedes subir hasta 10 fotos en total. Tienes espacio para ${spaceLeft} más.`);
                          }
                          const filesToProcess = files.slice(0, spaceLeft);
                          
                          const promises = filesToProcess.map(file => {
                            return new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve(reader.result as string);
                              reader.onerror = (error) => reject(error);
                              reader.readAsDataURL(file);
                            });
                          });

                          try {
                            const base64s = await Promise.all(promises);
                            setNewBiz({
                              ...newBiz,
                              gallery_urls: [...currentGallery, ...base64s]
                            });
                          } catch (err) {
                            console.error('Error al subir imágenes:', err);
                            alert('Error al procesar uno o más archivos de imagen.');
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Image className="w-5 h-5 text-[#c5a059] mx-auto mb-1" />
                      <span className="block text-[11px] text-[#e2e8f0]/80 font-bold">Subir Fotos para el Negocio</span>
                      <span className="block text-[9px] text-[#e2e8f0]/40 mt-0.5">PNG, JPG o JPEG (Hasta 10 fotos)</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 p-2 bg-[#0f1115] rounded-lg border border-[#2d333b]">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          value={bizGalleryLinkInput}
                          onChange={(e) => setBizGalleryLinkInput(e.target.value)}
                          className="flex-1 text-xs bg-[#1c2128] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2 focus:ring-1 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!bizGalleryLinkInput) return;
                            const currentGallery = newBiz.gallery_urls || [];
                            if (currentGallery.length >= 10) {
                              alert("Ya has alcanzado el límite de 10 fotos.");
                              return;
                            }
                            setNewBiz({
                              ...newBiz,
                              gallery_urls: [...currentGallery, bizGalleryLinkInput]
                            });
                            setBizGalleryLinkInput('');
                          }}
                          className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Agregar
                        </button>
                      </div>
                      <span className="block text-[9px] text-[#e2e8f0]/40">Ingresa la URL de la imagen y presiona "Agregar"</span>
                    </div>
                  )
                ) : (
                  <div className="bg-[#c5a059]/5 border border-[#c5a059]/20 rounded-lg p-2.5 text-center text-[10px] text-[#c5a059] font-medium">
                    ⚠️ Has alcanzado el límite máximo de 10 fotos para la galería.
                  </div>
                )}

                <div className="grid grid-cols-5 gap-1.5 pt-1.5">
                  {(newBiz.gallery_urls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded overflow-hidden border border-[#2d333b] group">
                      <img src={url} alt={`Galería ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (newBiz.gallery_urls || []).filter((_, i) => i !== idx);
                          setNewBiz({ ...newBiz, gallery_urls: updated });
                        }}
                        className="absolute inset-0 bg-red-600/95 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-all duration-150 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                {editingBizId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 border border-[#2d333b] hover:bg-white/5 text-[#e2e8f0] font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-[2] bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  {editingBizId ? 'Guardar Cambios' : 'Registrar Negocio'}
                </button>
              </div>
            </form>

            {/* Listado de Negocios Registrados */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl flex justify-between items-center">
                <div>
                  <h4 className="font-display italic font-bold text-sm text-[#c5a059]">Ecosistema de Empresas Registradas</h4>
                  <p className="text-xs text-[#e2e8f0]/60 mt-0.5">Haz clic sobre cualquier tarjeta o negocio para editar sus datos.</p>
                </div>
                {editingBizId && (
                  <span className="text-[10px] bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] font-bold px-2 py-1 rounded">
                    Modo Edición Activo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businesses.map((biz) => {
                  const isVisible = biz.is_visible !== false;
                  const isEditingThis = editingBizId === biz.id;
                  return (
                    <div 
                      key={biz.id} 
                      onClick={() => handleSelectBusinessForEdit(biz)}
                      className={`border rounded-xl overflow-hidden shadow-xl transition-all flex flex-col justify-between cursor-pointer group ${
                        isEditingThis 
                          ? 'bg-[#1c2128] border-[#c5a059] ring-2 ring-[#c5a059]/20' 
                          : 'bg-[#1c2128] border-[#2d333b] hover:border-[#c5a059]/40 hover:bg-[#1f2631]/20'
                      }`}
                    >
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <span className="bg-[#0f1115] text-[#c5a059] border border-[#2d333b] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {biz.category}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Botón de visibilidad pública */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // Detener propagación para no activar la edición al hacer clic en visibilidad
                                handleToggleVisibility(biz.id, isVisible);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                                isVisible
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              }`}
                              title="Gestionar visibilidad pública"
                            >
                              <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-current"></span>
                              {isVisible ? 'Público / Visible' : 'Oculto'}
                            </button>

                            {/* Botón para eliminar negocio */}
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation(); // Evitar seleccionar para editar
                                if (confirm(`¿Estás completamente seguro de eliminar el negocio "${biz.name}"? Esta acción borrará permanentemente la empresa y no se puede deshacer.`)) {
                                  try {
                                    await db.deleteBusiness(biz.id);
                                    alert('¡Negocio eliminado con éxito!');
                                    await loadAllData();
                                  } catch (err: any) {
                                    alert('Error al eliminar negocio: ' + err.message);
                                  }
                                }
                              }}
                              className="p-1.5 border border-red-900/30 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Negocio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-start gap-2 pt-1">
                          <h5 className="font-display italic font-bold text-sm text-[#e2e8f0] group-hover:text-[#c5a059] transition-colors">{biz.name}</h5>
                          <span className="text-[10px] text-[#c5a059] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Editar &rarr;</span>
                        </div>
                        <p className="text-xs text-[#e2e8f0]/60 line-clamp-2 leading-relaxed">{biz.description}</p>
                      </div>

                      <div className="bg-[#0f1115]/50 p-4 border-t border-[#2d333b] text-[11px] text-[#e2e8f0]/40 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                          <span className="truncate max-w-[150px] text-[#e2e8f0]/60">{biz.address}</span>
                        </div>
                        <span className="font-mono text-[#c5a059]">{biz.phone}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
