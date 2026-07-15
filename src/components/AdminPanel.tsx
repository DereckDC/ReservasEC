import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar as CalendarIcon, ClipboardList, Briefcase, Users, Info, Plus, Edit2, Trash2, 
  Check, X, Award, MapPin, Phone, Star, DollarSign, Activity, Settings, PieChart as PieIcon, Download,
  Image as ImageIcon, FileText, Upload, Link
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { db } from '../lib/db';
import { 
  Business, Service, Professional, Appointment, Category, BusinessAnalytics, Certificate, Profile, ClientHistoryRecord 
} from '../types';
import { downloadTicket } from '../lib/ticket';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&h=150&fit=crop'
];

interface AdminPanelProps {
  businessId: string;
  currentUser: Profile;
  onNavigateBack: () => void;
  activeTab?: 'analytics' | 'appointments' | 'services' | 'professionals' | 'info';
  setActiveTab?: (tab: 'analytics' | 'appointments' | 'services' | 'professionals' | 'info') => void;
  onChangeBusinessId?: (id: string) => void;
}

export default function AdminPanel({ 
  businessId, 
  currentUser, 
  onNavigateBack,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab,
  onChangeBusinessId
}: AdminPanelProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'analytics' | 'appointments' | 'services' | 'professionals' | 'info'>('analytics');
  
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setLocalActiveTab;
  
  // Datos del negocio
  const [business, setBusiness] = useState<Business | null>(null);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);

  // Estados de Historial Clínico y Filtros de Citas
  const [aptFilter, setAptFilter] = useState<'all' | 'pending' | 'attended'>('all');
  const [attendingApt, setAttendingApt] = useState<Appointment | null>(null);
  const [clientHistory, setClientHistory] = useState<ClientHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    reason: '',
    clinical_picture: '',
    diagnosis: '',
    treatment: '',
    prescription: ''
  });

  // Estados para formularios/ediciones
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Partial<Professional> | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload' | 'url'>('presets');

  // Cita Manual
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [manualBookingForm, setManualBookingForm] = useState({
    clientType: 'manual',
    selectedClientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    selectedServiceId: '',
    selectedProfessionalId: '',
    appointmentDate: '',
    startTime: '',
    notes: ''
  });

  // Edición de información del negocio
  const [bizForm, setBizForm] = useState<Partial<Business>>({});
  const [newCert, setNewCert] = useState<Certificate>({ title: '', institution: '', year: '' });
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Control de origen para subida de archivos (links o local)
  const [photoSource, setPhotoSource] = useState<'link' | 'local'>('link');
  const [certSource, setCertSource] = useState<'none' | 'link' | 'local'>('none');
  const [srvImgSource, setSrvImgSource] = useState<'link' | 'local'>('link');
  const [logoSource, setLogoSource] = useState<'link' | 'local'>('link');
  const [srvGalleryMode, setSrvGalleryMode] = useState<'upload' | 'link'>('upload');
  const [srvGalleryLinkInput, setSrvGalleryLinkInput] = useState('');

  // Utilidad para convertir archivo de almacenamiento interno a Base64 Data URL
  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Carga e inicialización
  const loadBusinessData = async () => {
    try {
      const allBiz = await db.getBusinesses();
      setAllBusinesses(allBiz);
      
      let activeId = businessId;
      let current = allBiz.find(b => b.id === activeId);
      
      // Si el ID de negocio no se encuentra y hay negocios en la base de datos,
      // seleccionamos el primero disponible de forma transparente.
      if (!current && allBiz.length > 0) {
        activeId = allBiz[0].id;
        current = allBiz[0];
        if (onChangeBusinessId) {
          onChangeBusinessId(activeId);
        }
      }
      
      if (current) {
        setBusiness(current);
        setBizForm(current);
      } else {
        setBusiness(null);
        setBizForm({});
      }

      const srvs = await db.getServices(activeId);
      setServices(srvs);

      const cats = await db.getCategories();
      setCategories(cats);

      const profs = await db.getProfessionals(activeId);
      setProfessionals(profs);

      const apts = await db.getAppointments(currentUser.role === 'professional' ? currentUser.id : undefined, currentUser.role, activeId);
      setAppointments(apts);

      const stats = await db.getAnalytics(activeId);
      setAnalytics(stats);

      const allProfs = await db.getProfiles();
      setProfilesList(allProfs.filter(p => p.role === 'client'));
    } catch (err) {
      console.error('Error al cargar datos del panel de administración:', err);
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  // Manejadores para Servicios
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editingService.name) return;

    try {
      if (editingService.id) {
        await db.updateService(editingService.id, {
          ...editingService,
          image_url: editingService.image_url || '',
          image_urls: editingService.image_urls || []
        });
      } else {
        await db.createService({
          business_id: businessId,
          name: editingService.name,
          description: editingService.description || '',
          duration_minutes: editingService.duration_minutes || 30,
          price: editingService.price || 0.00,
          category_id: editingService.category_id,
          image_url: editingService.image_url || '',
          image_urls: editingService.image_urls || []
        });
      }
      setShowServiceModal(false);
      setEditingService(null);
      await loadBusinessData();
    } catch (err) {
      console.error('Error al guardar servicio:', err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio? Esto no se puede deshacer.')) return;
    try {
      await db.deleteService(id);
      await loadBusinessData();
    } catch (err) {
      console.error('Error al eliminar servicio:', err);
    }
  };

  // Manejadores para Profesionales
  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfessional || !editingProfessional.name) return;

    try {
      if (editingProfessional.id) {
        await db.updateProfessional(editingProfessional.id, editingProfessional);
      } else {
        await db.createProfessional({
          business_id: businessId,
          name: editingProfessional.name,
          email: editingProfessional.email || '',
          specialty: editingProfessional.specialty || '',
          avatar_url: editingProfessional.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
          work_start_time: editingProfessional.work_start_time || '09:00',
          work_end_time: editingProfessional.work_end_time || '18:00',
          work_days: editingProfessional.work_days || [1, 2, 3, 4, 5],
          service_ids: editingProfessional.service_ids || []
        });
      }
      setShowProfessionalModal(false);
      setEditingProfessional(null);
      await loadBusinessData();
    } catch (err) {
      console.error('Error al guardar profesional:', err);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este profesional?')) return;
    try {
      await db.deleteProfessional(id);
      await loadBusinessData();
    } catch (err) {
      console.error('Error al eliminar profesional:', err);
    }
  };

  const handleSaveManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const { 
      clientType, selectedClientId, clientName, clientEmail, clientPhone, 
      selectedServiceId, selectedProfessionalId, appointmentDate, startTime, notes 
    } = manualBookingForm;
    
    if (!selectedServiceId || !selectedProfessionalId || !appointmentDate || !startTime) {
      alert('Por favor completa todos los campos requeridos para la reserva.');
      return;
    }

    try {
      let clientId = currentUser.id;
      let finalClientName = clientName;
      let finalNotes = notes;

      if (clientType === 'existing') {
        if (!selectedClientId) {
          alert('Por favor selecciona un cliente registrado.');
          return;
        }
        clientId = selectedClientId;
        const selectedProfile = profilesList.find(p => p.id === selectedClientId);
        finalClientName = selectedProfile ? selectedProfile.full_name : 'Cliente Registrado';
      } else {
        if (!clientName) {
          alert('Por favor ingresa el nombre del cliente.');
          return;
        }
        finalClientName = clientName;
        // Guardar detalles del contacto en la nota de manera legible
        finalNotes = `Cliente Manual: ${clientName} (${clientPhone || 'Sin teléfono'}, ${clientEmail || 'Sin email'}).\nNotas: ${notes || 'Ninguna'}`;
      }

      // Calcular hora de fin según duración de servicio
      const serviceObj = services.find(s => s.id === selectedServiceId);
      const duration = serviceObj ? serviceObj.duration_minutes : 30;
      
      const [sh, sm] = startTime.split(':').map(Number);
      let eh = sh;
      let em = sm + duration;
      while (em >= 60) {
        eh += 1;
        em -= 60;
      }
      const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      // VALIDACIÓN DE TRASLAPE/CHOQUE DE HORARIOS
      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const newStartMin = toMinutes(startTime);
      const newEndMin = toMinutes(endTime);

      const hasOverlap = appointments.some(apt => {
        // Solo comprobar si la cita es con el mismo profesional en la misma fecha y no está cancelada
        if (
          apt.professional_id === selectedProfessionalId &&
          apt.appointment_date === appointmentDate &&
          apt.status !== 'cancelled'
        ) {
          const existingStartMin = toMinutes(apt.start_time);
          const existingEndMin = toMinutes(apt.end_time);
          // Choque si: nuevo inicio < existente fin Y existente inicio < nuevo fin
          return newStartMin < existingEndMin && existingStartMin < newEndMin;
        }
        return false;
      });

      if (hasOverlap) {
        const profObj = professionals.find(p => p.id === selectedProfessionalId);
        alert(`¡Conflicto de Horario!\nEl profesional ${profObj ? profObj.name : ''} ya tiene una cita agendada que se cruza con el horario propuesto (${startTime} - ${endTime}) el día ${appointmentDate}.\nPor favor, selecciona otra hora o cambia de profesional.`);
        return;
      }

      // Crear reserva
      await db.createAppointment({
        business_id: businessId,
        client_id: clientId,
        service_id: selectedServiceId,
        professional_id: selectedProfessionalId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        status: 'reserved', // Comienza directamente en reservado
        notes: finalNotes
      });

      alert('¡Reserva manual creada con éxito!');
      setShowManualBookingModal(false);
      // Resetear formulario
      setManualBookingForm({
        clientType: 'manual',
        selectedClientId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        selectedServiceId: '',
        selectedProfessionalId: '',
        appointmentDate: '',
        startTime: '',
        notes: ''
      });
      await loadBusinessData();
    } catch (err) {
      console.error('Error al registrar reserva manual:', err);
      alert('Error al registrar la cita.');
    }
  };

  // Manejadores de Estado de Citas (Confirmar, Cancelar, Completar)
  const handleUpdateAptStatus = async (id: string, status: Appointment['status']) => {
    try {
      await db.updateAppointmentStatus(id, status);
      await loadBusinessData();
    } catch (err) {
      console.error('Error al actualizar cita:', err);
    }
  };

  const handleOpenAttendModal = async (apt: Appointment) => {
    setAttendingApt(apt);
    setLoadingHistory(true);
    setHistoryForm({
      reason: '',
      clinical_picture: '',
      diagnosis: '',
      treatment: '',
      prescription: ''
    });
    try {
      const histories = await db.getClientHistory(apt.client_id, businessId);
      setClientHistory(histories);
    } catch (err) {
      console.error('Error al cargar historial del cliente:', err);
    } finally {
      setLoadingHistory(false);
      setShowHistoryModal(true);
    }
  };

  const handleSaveClientHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendingApt) return;

    const { reason, clinical_picture, diagnosis, treatment, prescription } = historyForm;

    if (!reason || !clinical_picture || !diagnosis || !treatment || !prescription) {
      alert('Por favor completa todos los campos de la ficha clínica.');
      return;
    }

    try {
      await db.createClientHistory({
        client_id: attendingApt.client_id,
        client_name: attendingApt.client_name || 'Paciente',
        consultation_date: attendingApt.appointment_date,
        reason: reason,
        clinical_picture: clinical_picture,
        diagnosis: diagnosis,
        treatment: treatment,
        prescription: prescription,
        business_id: businessId,
        appointment_id: attendingApt.id,
        created_by_name: currentUser.full_name
      });

      await db.updateAppointmentStatus(attendingApt.id, 'attended');

      alert('¡Ficha clínica registrada y cita marcada como atendida exitosamente!');
      setShowHistoryModal(false);
      setAttendingApt(null);
      await loadBusinessData();
    } catch (err) {
      console.error('Error al guardar ficha clínica:', err);
      alert('Hubo un error al guardar la ficha clínica.');
    }
  };

  // Actualizar Información Operacional y Visual del Negocio
  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      await db.updateBusiness(business.id, bizForm);
      alert('Información del negocio guardada y actualizada con éxito.');
      await loadBusinessData();
    } catch (err) {
      console.error('Error al actualizar info de negocio:', err);
    }
  };

  const handleAddCertificate = () => {
    if (!newCert.title || !newCert.institution || !newCert.year) return;
    const currentCerts = bizForm.certificates || [];
    const updatedCerts = [...currentCerts, newCert];
    
    setBizForm({ ...bizForm, certificates: updatedCerts });
    setNewCert({ title: '', institution: '', year: '' });
    setCertSource('none');
  };

  const handleRemoveCertificate = (idx: number) => {
    const currentCerts = bizForm.certificates || [];
    const updatedCerts = currentCerts.filter((_, i) => i !== idx);
    setBizForm({ ...bizForm, certificates: updatedCerts });
  };

  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl) return;
    const currentGallery = bizForm.gallery_urls || [];
    const updatedGallery = [...currentGallery, newGalleryUrl];

    setBizForm({ ...bizForm, gallery_urls: updatedGallery });
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryUrl = (idx: number) => {
    const currentGallery = bizForm.gallery_urls || [];
    const updatedGallery = currentGallery.filter((_, i) => i !== idx);
    setBizForm({ ...bizForm, gallery_urls: updatedGallery });
  };

  const weekDays = [
    { label: 'Lun', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Mié', value: 3 },
    { label: 'Jue', value: 4 },
    { label: 'Vie', value: 5 },
    { label: 'Sáb', value: 6 },
    { label: 'Dom', value: 7 }
  ];

  const COLORS = ['#c5a059', '#b08d4a', '#8c6f37', '#e2e8f0', '#2d333b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900" id="admin-panel">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#c5a059] tracking-widest block">Panel de Control Operativo</span>
          <h1 className="font-display italic font-bold text-3xl text-[#c5a059] tracking-tight mt-1">
            {business?.name || 'Administración de Negocio'}
          </h1>
          <p className="text-slate-600 text-sm mt-1">Sincroniza agendas, edita servicios, profesionales y mide el rendimiento en tiempo real.</p>
          
          {currentUser.role === 'superadmin' && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gestionando Empresa:</span>
              <select
                value={businessId}
                onChange={(e) => onChangeBusinessId?.(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none cursor-pointer shadow-sm"
              >
                {allBusinesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onNavigateBack}
            className="border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            id="admin-back-btn"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>

      {/* CONTENIDO DEL TAB */}
      <div className="space-y-6" id="admin-tab-content">
        
        {/* TAB 1: ANALÍTICAS */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Tarjetas de Métricas Rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl flex items-center gap-4">
                <div className="bg-[#0f1115] text-[#c5a059] p-3 rounded-lg border border-[#2d333b]">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#e2e8f0]/40 uppercase tracking-wider block">Citas Totales</span>
                  <span className="text-2xl font-bold font-mono text-[#e2e8f0]">{analytics.totalAppointments}</span>
                </div>
              </div>

              <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl flex items-center gap-4">
                <div className="bg-[#0f1115] text-emerald-400 p-3 rounded-lg border border-[#2d333b]">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#e2e8f0]/40 uppercase tracking-wider block">Realizadas / Activas</span>
                  <span className="text-2xl font-bold font-mono text-[#e2e8f0]">{analytics.completedAppointments}</span>
                </div>
              </div>

              <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl flex items-center gap-4">
                <div className="bg-[#0f1115] text-[#c5a059] p-3 rounded-lg border border-[#2d333b]">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#e2e8f0]/40 uppercase tracking-wider block">Ingresos de Servicios</span>
                  <span className="text-2xl font-bold font-mono text-[#c5a059]">${analytics.totalRevenue}</span>
                </div>
              </div>

              <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl flex items-center gap-4">
                <div className="bg-[#0f1115] text-[#c5a059] p-3 rounded-lg border border-[#2d333b]">
                  <Star className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#e2e8f0]/40 uppercase tracking-wider block">Opinión Promedio</span>
                  <span className="text-2xl font-bold font-mono text-[#e2e8f0]">{analytics.averageRating} ★</span>
                </div>
              </div>
            </div>

            {/* Gráficos Interactivos de Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Popularidad de Servicios */}
              <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl text-[#e2e8f0]">
                <span className="text-[10px] font-bold text-[#c5a059] uppercase tracking-wider mb-4 block flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Rendimiento e Ingreso por Servicio</span>
                </span>
                
                {analytics.popularServices.length === 0 ? (
                  <div className="h-64 flex items-center justify-center border border-dashed border-[#2d333b] rounded-lg bg-[#0f1115]/50">
                    <span className="text-xs text-[#e2e8f0]/40 font-mono">Sin datos operacionales suficientes</span>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.popularServices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" vertical={false} />
                        <XAxis dataKey="serviceName" stroke="#e2e8f0" tick={{ fontSize: 9, fill: '#e2e8f0' }} />
                        <YAxis stroke="#e2e8f0" tick={{ fontSize: 9, fill: '#e2e8f0' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#16191f', borderColor: '#2d333b', color: '#e2e8f0' }} />
                        <Legend wrapperStyle={{ fontSize: 10, color: '#e2e8f0' }} />
                        <Bar name="Citas Registradas" dataKey="count" fill="#c5a059" radius={[4, 4, 0, 0]} />
                        <Bar name="Ingresos ($)" dataKey="revenue" fill="#b08d4a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Gráfico 2: Carga Operativa de Profesionales */}
              <div className="bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl text-[#e2e8f0]">
                <span className="text-[10px] font-bold text-[#c5a059] uppercase tracking-wider mb-4 block flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Sincronización y Carga de Profesionales</span>
                </span>
                
                {analytics.professionalLoad.length === 0 ? (
                  <div className="h-64 flex items-center justify-center border border-dashed border-[#2d333b] rounded-lg bg-[#0f1115]/50">
                    <span className="text-xs text-[#e2e8f0]/40 font-mono">Sin datos operacionales suficientes</span>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col sm:flex-row items-center justify-center">
                    <div className="w-full sm:w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.professionalLoad}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="professionalName"
                          >
                            {analytics.professionalLoad.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#16191f', borderColor: '#2d333b', color: '#e2e8f0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 px-4">
                      {analytics.professionalLoad.map((item, index) => (
                        <div key={item.professionalName} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-xs font-semibold text-[#e2e8f0]/80 truncate flex-1">{item.professionalName}</span>
                          <span className="text-xs font-bold text-[#c5a059] font-mono">{item.count} citas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GESTIÓN DE CITAS */}
        {activeTab === 'appointments' && (() => {
          const filteredAppointments = appointments.filter(apt => {
            if (aptFilter === 'pending') {
              return apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'reserved';
            }
            if (aptFilter === 'attended') {
              return apt.status === 'attended' || apt.status === 'completed';
            }
            return true; // 'all'
          });

          return (
            <div className="bg-[#1c2128] border border-[#2d333b] rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-200">
              <div className="p-5 border-b border-[#2d333b] bg-[#0f1115] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-display italic font-bold text-base text-[#c5a059]">
                    {currentUser.role === 'professional' ? 'Mis Citas Registradas' : 'Agenda Sincronizada Multi-Profesional'}
                  </h3>
                  <p className="text-xs text-[#e2e8f0]/60 mt-1">
                    {currentUser.role === 'professional' 
                      ? 'Revisa tus citas asignadas, atiende a tus pacientes y gestiona sus fichas clínicas.' 
                      : 'Monitorea y cambia estados en tiempo real. Los cambios activan avisos automatizados.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filtros de Citas */}
                  <div className="flex bg-[#0f1115] border border-[#2d333b] rounded-lg p-1">
                    <button
                      onClick={() => setAptFilter('all')}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        aptFilter === 'all'
                          ? 'bg-[#c5a059] text-[#0f1115]'
                          : 'text-[#e2e8f0]/60 hover:text-[#e2e8f0]'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setAptFilter('pending')}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        aptFilter === 'pending'
                          ? 'bg-[#c5a059] text-[#0f1115]'
                          : 'text-[#e2e8f0]/60 hover:text-[#e2e8f0]'
                      }`}
                    >
                      Pendientes
                    </button>
                    <button
                      onClick={() => setAptFilter('attended')}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        aptFilter === 'attended'
                          ? 'bg-[#c5a059] text-[#0f1115]'
                          : 'text-[#e2e8f0]/60 hover:text-[#e2e8f0]'
                      }`}
                    >
                      Atendidas
                    </button>
                  </div>

                  {currentUser.role !== 'professional' && (
                    <button
                      onClick={() => setShowManualBookingModal(true)}
                      className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1 shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cita Manual</span>
                    </button>
                  )}
                  <span className="bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center">
                    Sincronizado
                  </span>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="p-12 text-center text-[#e2e8f0]/40 bg-[#1c2128]">
                  <CalendarIcon className="w-12 h-12 text-[#2d333b] mx-auto mb-3" />
                  <span className="text-sm font-semibold">No se encontraron citas con el filtro actual.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f1115]/50 text-[10px] font-bold text-[#e2e8f0]/40 uppercase border-b border-[#2d333b]">
                        <th className="p-4">Cliente / Paciente</th>
                        <th className="p-4">Servicio</th>
                        <th className="p-4">Profesional</th>
                        <th className="p-4">Fecha & Hora</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d333b] text-xs text-[#e2e8f0]/80">
                      {filteredAppointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-[#e2e8f0]">
                            {apt.client_name}
                            {apt.notes && (
                              <span className="block text-[10px] text-[#e2e8f0]/50 font-normal mt-0.5 max-w-xs truncate" title={apt.notes}>
                                📝 "{apt.notes}"
                              </span>
                            )}
                          </td>
                          <td className="p-4">{apt.service_name}</td>
                          <td className="p-4 font-medium text-[#c5a059]">{apt.professional_name}</td>
                          <td className="p-4">
                            <span className="font-semibold block text-[#e2e8f0]">{apt.appointment_date}</span>
                            <span className="font-mono text-[#e2e8f0]/40 text-[10px]">{apt.start_time} - {apt.end_time}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold inline-block border ${
                              apt.status === 'confirmed' || apt.status === 'reserved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : apt.status === 'completed' || apt.status === 'attended'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : apt.status === 'cancelled'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20'
                            }`}>
                              {apt.status === 'confirmed' || apt.status === 'reserved' ? 'RESERVADO' :
                               apt.status === 'completed' || apt.status === 'attended' ? 'ATENDIDO' :
                               apt.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-1.5 justify-end items-center">
                              {/* BOTÓN ATENDER / FICHA CLÍNICA */}
                              {(currentUser.role === 'professional' || currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                                <button
                                  onClick={() => handleOpenAttendModal(apt)}
                                  className="bg-blue-500/15 text-blue-300 border border-blue-500/35 px-2.5 py-1 rounded hover:bg-blue-500 hover:text-[#0f1115] transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer font-mono"
                                  title="Atender cita y ver/agregar historia clínica"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{apt.status === 'attended' || apt.status === 'completed' ? 'Ver Ficha' : 'Atender / Ficha'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => downloadTicket(apt)}
                                className="bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 p-1.5 rounded hover:bg-[#c5a059] hover:text-[#0f1115] transition-colors"
                                title="Descargar Ticket Oficial de Cita"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {currentUser.role !== 'professional' && apt.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateAptStatus(apt.id, 'reserved')}
                                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/20 flex items-center gap-1 text-[10px] font-bold"
                                  title="Acordar pago y Reservar"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Reservar</span>
                                </button>
                              )}
                              
                              {currentUser.role !== 'professional' && (apt.status === 'confirmed' || apt.status === 'reserved') && (
                                <button
                                  onClick={() => handleUpdateAptStatus(apt.id, 'attended')}
                                  className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/20 flex items-center gap-1 text-[10px] font-bold"
                                  title="Marcar como Atendido"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Atendido</span>
                                </button>
                              )}

                              {apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'attended' && (
                                <button
                                  onClick={() => handleUpdateAptStatus(apt.id, 'cancelled')}
                                  className="bg-red-500/10 text-red-400 border border-red-500/20 p-1 rounded hover:bg-red-500/20"
                                  title="Cancelar Cita"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: GESTIÓN DE SERVICIOS */}
        {activeTab === 'services' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl">
              <div>
                <h3 className="font-display italic font-bold text-base text-[#c5a059]">Catálogo de Servicios del Negocio</h3>
                <p className="text-xs text-[#e2e8f0]/60 mt-0.5">Establece duraciones exactas y tarifas para que los clientes reserven de manera automatizada.</p>
              </div>
              <button
                onClick={() => {
                  setEditingService({ name: '', description: '', duration_minutes: 30, price: 0.00, image_urls: [] });
                  setShowServiceModal(true);
                }}
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1 shadow-md"
              >
                <Plus className="w-4 h-4 text-[#0f1115]" />
                <span>Nuevo Servicio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="services-grid">
              {services.map((srv) => {
                const cat = categories.find(c => c.id === srv.category_id);
                return (
                  <div key={srv.id} className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-[#c5a059]/30 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="bg-[#0f1115] text-[#c5a059] border border-[#2d333b] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {cat ? cat.name : 'Sin Categoría'}
                        </span>
                        <span className="font-mono font-bold text-sm text-[#c5a059]">${srv.price}</span>
                      </div>
                      <h4 className="font-display italic font-bold text-sm text-[#e2e8f0]">{srv.name}</h4>
                      <p className="text-xs text-[#e2e8f0]/60 line-clamp-2 leading-relaxed">{srv.description}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-[#2d333b] pt-3">
                      <span className="text-[10px] text-[#e2e8f0]/40 font-mono">{srv.duration_minutes} min de duración</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingService(srv);
                            setShowServiceModal(true);
                          }}
                          className="p-1.5 rounded border border-[#2d333b] text-[#e2e8f0]/80 hover:bg-white/5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-1.5 rounded border border-red-900/30 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: GESTIÓN DE PROFESIONALES */}
        {activeTab === 'professionals' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1c2128] p-5 rounded-xl border border-[#2d333b] shadow-xl gap-4">
              <div>
                <h3 className="font-display italic font-bold text-base text-[#c5a059]">Profesionales Sincronizados</h3>
                <p className="text-xs text-[#e2e8f0]/60 mt-0.5">Controla la jornada laboral de ingreso, egreso y los días hábiles en los que atienden.</p>
              </div>
              <button
                onClick={() => {
                  setEditingProfessional({ name: '', specialty: '', work_start_time: '09:00', work_end_time: '18:00', work_days: [1,2,3,4,5], service_ids: [] });
                  setShowProfessionalModal(true);
                }}
                className="w-full sm:w-auto bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#0f1115]" />
                <span>Nuevo Profesional</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="professionals-grid">
              {professionals.map((prof) => {
                const daysName = prof.work_days.map(d => weekDays.find(wd => wd.value === d)?.label).join(', ');
                return (
                  <div key={prof.id} className="bg-[#1c2128] border border-[#2d333b] p-5 rounded-xl shadow-xl flex items-start gap-4 hover:border-[#c5a059]/30 transition-all">
                    <img 
                      src={prof.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop"} 
                      alt={prof.name} 
                      className="w-14 h-14 rounded-full object-cover border border-[#2d333b] shadow-lg shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-display italic font-bold text-sm text-[#e2e8f0] truncate">{prof.name}</h4>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProfessional({
                                ...prof,
                                service_ids: prof.service_ids || []
                              });
                              setShowProfessionalModal(true);
                            }}
                            className="p-1 rounded border border-[#2d333b] text-[#e2e8f0]/80 hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteProfessional(prof.id)}
                            className="p-1 rounded border border-red-900/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <span className="block text-xs font-semibold text-[#c5a059]">{prof.specialty}</span>
                      <span className="block text-[11px] text-[#e2e8f0]/40 font-mono">{prof.email}</span>
                      
                      <div className="border-t border-[#2d333b] pt-2 mt-2">
                        <span className="block text-[9px] text-[#e2e8f0]/40 uppercase font-bold tracking-wider mb-1">Servicios Enlazados</span>
                        <div className="flex flex-wrap gap-1">
                          {services.filter(s => (prof.service_ids || []).includes(s.id)).length > 0 ? (
                            services.filter(s => (prof.service_ids || []).includes(s.id)).map(s => (
                              <span key={s.id} className="text-[10px] bg-[#0f1115] border border-[#2d333b] text-[#c5a059] px-2 py-0.5 rounded font-medium">
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] italic text-[#e2e8f0]/40">Ninguno (No tiene servicios habilitados)</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-[#2d333b] pt-2 mt-2">
                        <span className="block text-[9px] text-[#e2e8f0]/40 uppercase font-bold tracking-wider">Jornada Operacional</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[11px] font-semibold text-[#e2e8f0]/70">{daysName}</span>
                          <span className="text-[11px] font-mono font-bold bg-[#0f1115] border border-[#2d333b] text-[#c5a059] px-2 py-0.5 rounded">
                            {prof.work_start_time} - {prof.work_end_time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PERFIL E INFORMACIÓN DEL NEGOCIO */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveBusinessInfo} className="space-y-6 animate-in fade-in duration-200">
            {/* Información General */}
            <div className="bg-[#1c2128] p-6 rounded-xl border border-[#2d333b] shadow-xl space-y-4">
              <div>
                <h3 className="font-display italic font-bold text-base text-[#c5a059]">Configuración General & Operativa</h3>
                <p className="text-xs text-[#e2e8f0]/60 mt-0.5">Controla la descripción visible al cliente en el catálogo público y los datos de contacto.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Nombre del Negocio</label>
                  <input
                    type="text"
                    required
                    value={bizForm.name || ''}
                    onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Slug de la URL (Único)</label>
                  <input
                    type="text"
                    required
                    value={bizForm.slug || ''}
                    onChange={(e) => setBizForm({ ...bizForm, slug: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Categoría General</label>
                  <select
                    value={bizForm.category || ''}
                    onChange={(e) => setBizForm({ ...bizForm, category: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} className="bg-[#16191f] text-[#e2e8f0]">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Teléfono de Soporte</label>
                  <input
                    type="text"
                    required
                    value={bizForm.phone || ''}
                    onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Dirección Física</label>
                  <input
                    type="text"
                    required
                    value={bizForm.address || ''}
                    onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Descripción de la Empresa</label>
                  <textarea
                    rows={3}
                    required
                    value={bizForm.description || ''}
                    onChange={(e) => setBizForm({ ...bizForm, description: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2 border-t border-[#2d333b]/40 pt-4 mt-2">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Logotipo Oficial del Negocio</label>
                  <p className="text-[11px] text-[#e2e8f0]/50 -mt-1 mb-2">Sube una imagen cuadrada de tu logotipo o ingresa una URL web.</p>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                      <input type="radio" name="logo_source" checked={logoSource === 'link'} onChange={() => setLogoSource('link')} className="accent-[#c5a059]" />
                      Enlace Web
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                      <input type="radio" name="logo_source" checked={logoSource === 'local'} onChange={() => setLogoSource('local')} className="accent-[#c5a059]" />
                      Subir Archivo Local
                    </label>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      {logoSource === 'link' ? (
                        <input
                          type="url"
                          value={bizForm.logo_url || ''}
                          onChange={(e) => setBizForm({ ...bizForm, logo_url: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                        />
                      ) : (
                        <div className="border border-dashed border-[#2d333b] hover:border-[#c5a059]/40 bg-[#0f1115] rounded-lg p-3 text-center cursor-pointer transition-all relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const base64 = await handleFileToBase64(file);
                                  setBizForm({ ...bizForm, logo_url: base64 });
                                } catch (err) {
                                  console.error('Error al cargar logo:', err);
                                  alert('Ocurrió un error al cargar el logo.');
                                }
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <ImageIcon className="w-5 h-5 text-[#c5a059] mx-auto mb-1" />
                          <span className="block text-xs text-[#e2e8f0]/80 font-bold">
                            {bizForm.logo_url?.startsWith('data:') ? '¡Logotipo cargado localmente!' : 'Seleccionar Imagen del Almacenamiento'}
                          </span>
                        </div>
                      )}
                    </div>
                    {bizForm.logo_url && (
                      <div className="relative w-16 h-16 rounded-xl border border-[#2d333b] overflow-hidden bg-[#0f1115] shrink-0">
                        <img src={bizForm.logo_url} alt="Logotipo actual" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Galería de Fotos y Certificados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fotos */}
              <div className="bg-[#1c2128] p-6 rounded-xl border border-[#2d333b] shadow-xl space-y-4">
                <div>
                  <h4 className="font-display italic font-bold text-sm text-[#c5a059]">Galería de Fotos Destacadas</h4>
                  <p className="text-xs text-[#e2e8f0]/60 mt-0.5">Sube imágenes de tu almacenamiento local o ingresa enlaces web para mostrar tus instalaciones y calidad de servicio.</p>
                </div>

                <div className="flex gap-4 mb-1">
                  <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                    <input type="radio" name="gallery_source" checked={photoSource === 'link'} onChange={() => setPhotoSource('link')} className="accent-[#c5a059]" />
                    Enlace Web
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                    <input type="radio" name="gallery_source" checked={photoSource === 'local'} onChange={() => setPhotoSource('local')} className="accent-[#c5a059]" />
                    Subir Archivo Local
                  </label>
                </div>

                {photoSource === 'link' ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/foto.jpg"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      className="flex-1 text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryUrl}
                      className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#2d333b] hover:border-[#c5a059]/40 bg-[#0f1115] rounded-lg p-4 text-center cursor-pointer transition-all relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await handleFileToBase64(file);
                            const currentGallery = bizForm.gallery_urls || [];
                            setBizForm({ ...bizForm, gallery_urls: [...currentGallery, base64] });
                            alert('¡Imagen añadida a la galería localmente!');
                          } catch (err) {
                            console.error('Error al subir imagen de galería:', err);
                            alert('No se pudo cargar la imagen.');
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <ImageIcon className="w-6 h-6 text-[#c5a059] mx-auto mb-1.5" />
                    <span className="block text-xs text-[#e2e8f0]/80 font-bold">Seleccionar imagen del dispositivo</span>
                    <span className="block text-[10px] text-[#e2e8f0]/40 mt-0.5">PNG, JPG, JPEG</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {(bizForm.gallery_urls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-[#2d333b] group">
                      <img src={url} alt="Galería" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryUrl(idx)}
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-xs font-bold transition-opacity cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificados */}
              <div className="bg-[#1c2128] p-6 rounded-xl border border-[#2d333b] shadow-xl space-y-4">
                <div>
                  <h4 className="font-display italic font-bold text-sm text-[#c5a059] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#c5a059] animate-pulse" />
                    <span>Certificados Profesionales & Diplomas</span>
                  </h4>
                  <p className="text-xs text-[#e2e8f0]/60 mt-0.5">Certificaciones verificadas visibles al cliente mediante popup interactivo.</p>
                </div>

                <div className="space-y-2.5 bg-[#0f1115] p-3 rounded-lg border border-[#2d333b]">
                  <input
                    type="text"
                    placeholder="Título del Certificado (ej. Especialista en Colorimetría)"
                    value={newCert.title}
                    onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                    className="w-full text-xs bg-[#1c2128] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Institución"
                      value={newCert.institution}
                      onChange={(e) => setNewCert({ ...newCert, institution: e.target.value })}
                      className="col-span-2 text-xs bg-[#1c2128] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                    />
                    <input
                      type="text"
                      placeholder="Año"
                      value={newCert.year}
                      onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                      className="text-xs bg-[#1c2128] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-1 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                    />
                  </div>

                  <div className="space-y-1.5 border-t border-[#2d333b]/60 pt-2.5">
                    <label className="block text-[10px] text-[#e2e8f0]/40 font-bold uppercase">Adjuntar Certificado (PDF o Foto)</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                        <input type="radio" name="cert_source" checked={certSource === 'none'} onChange={() => setCertSource('none')} className="accent-[#c5a059]" />
                        Sin Archivo
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                        <input type="radio" name="cert_source" checked={certSource === 'link'} onChange={() => setCertSource('link')} className="accent-[#c5a059]" />
                        Enlace Web
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                        <input type="radio" name="cert_source" checked={certSource === 'local'} onChange={() => setCertSource('local')} className="accent-[#c5a059]" />
                        Subir Archivo Local
                      </label>
                    </div>

                    {certSource === 'link' && (
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/certificado.pdf"
                        value={newCert.file_url || ''}
                        onChange={(e) => setNewCert({ ...newCert, file_url: e.target.value, file_name: 'Documento Enlace' })}
                        className="w-full text-xs bg-[#1c2128] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2 focus:ring-1 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                      />
                    )}
                    {certSource === 'local' && (
                      <div className="border border-dashed border-[#2d333b] hover:border-[#c5a059]/40 bg-[#1c2128] rounded-lg p-3 text-center cursor-pointer transition-all relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await handleFileToBase64(file);
                                setNewCert({ ...newCert, file_url: base64, file_name: file.name });
                              } catch (err) {
                                console.error('Error al subir certificado:', err);
                                alert('Ocurrió un error al cargar el archivo del certificado.');
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <FileText className="w-5 h-5 text-[#c5a059] mx-auto mb-1" />
                        <span className="block text-xs text-[#e2e8f0]/80 font-bold truncate">
                          {newCert.file_name ? `Seleccionado: ${newCert.file_name}` : 'Seleccionar PDF o Imagen'}
                        </span>
                        <span className="block text-[9px] text-[#e2e8f0]/40 mt-0.5">Soporta PDF, PNG, JPG hasta 5MB</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCertificate}
                    className="w-full bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Añadir Certificado
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(bizForm.certificates || []).map((cert, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 border border-[#2d333b] rounded-lg bg-[#0f1115]/50">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-xs text-[#e2e8f0] block truncate">{cert.title}</span>
                        <span className="text-[10px] text-[#e2e8f0]/60 block truncate">{cert.institution} • {cert.year}</span>
                        {cert.file_name && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 px-1.5 py-0.5 rounded font-mono mt-1">
                            <FileText className="w-2.5 h-2.5" /> {cert.file_name}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertificate(idx)}
                        className="text-red-400 hover:text-red-300 hover:underline text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Guardar cambios */}
            <div className="flex justify-end pt-4 border-t border-[#2d333b]">
              <button
                type="submit"
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-md transition-all active:scale-[0.98]"
              >
                Guardar Configuración General
              </button>
            </div>
          </form>
        )}

      </div>

      {/* MODAL SERVICIO (AGREGAR / EDITAR) */}
      {showServiceModal && editingService && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveService} className="bg-[#16191f] rounded-xl shadow-2xl border border-[#2d333b] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0f1115] border-b border-[#2d333b] p-5 text-[#e2e8f0]">
              <h3 className="font-display italic font-bold text-base text-[#c5a059]">{editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              <p className="text-[#e2e8f0]/60 text-xs mt-1">Configura los detalles comerciales del servicio.</p>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Categoría</label>
                <select
                  value={editingService.category_id || ''}
                  onChange={(e) => setEditingService({ ...editingService, category_id: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                >
                  <option value="" className="bg-[#16191f] text-[#e2e8f0]">Sin Categoría (Opcional)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#16191f] text-[#e2e8f0]">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Duración (Minutos)</label>
                  <input
                    type="number"
                    required
                    min={15}
                    value={editingService.duration_minutes || 30}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: Number(e.target.value) })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Precio ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={editingService.price || 0.00}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

               <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Descripción</label>
                <textarea
                  rows={2}
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Imagen del Servicio (Opcional)</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                    <input type="radio" name="srv_img_source" checked={srvImgSource === 'link'} onChange={() => setSrvImgSource('link')} className="accent-[#c5a059]" />
                    Enlace Web
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#e2e8f0]/80 cursor-pointer select-none">
                    <input type="radio" name="srv_img_source" checked={srvImgSource === 'local'} onChange={() => setSrvImgSource('local')} className="accent-[#c5a059]" />
                    Subir Archivo Local
                  </label>
                </div>

                {srvImgSource === 'link' ? (
                  <input
                    type="url"
                    value={editingService.image_url || ''}
                    onChange={(e) => setEditingService({ ...editingService, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                  />
                ) : (
                  <div className="border border-dashed border-[#2d333b] hover:border-[#c5a059]/40 bg-[#0f1115] rounded-lg p-4 text-center cursor-pointer transition-all relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await handleFileToBase64(file);
                            setEditingService({ ...editingService, image_url: base64 });
                          } catch (err) {
                            console.error('Error al cargar imagen de servicio:', err);
                            alert('No se pudo cargar la imagen.');
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <ImageIcon className="w-5 h-5 text-[#c5a059] mx-auto mb-1" />
                    <span className="block text-xs text-[#e2e8f0]/80 font-bold">
                      {editingService.image_url?.startsWith('data:') ? '¡Imagen cargada localmente!' : 'Seleccionar Imagen'}
                    </span>
                    <span className="block text-[10px] text-[#e2e8f0]/40 mt-0.5">PNG, JPG, JPEG</span>
                  </div>
                )}
                {editingService.image_url && (
                  <div className="mt-2 flex items-center gap-2 bg-[#0f1115] border border-[#2d333b] p-2 rounded-lg">
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-black shrink-0">
                      <img src={editingService.image_url} alt="Previsualización" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] text-[#e2e8f0]/40 uppercase font-bold">Vista Previa</span>
                      <span className="block text-xs text-[#e2e8f0]/80 truncate font-mono text-[10px]">
                        {editingService.image_url.startsWith('data:') ? 'Imagen Base64 Local' : editingService.image_url}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fotos adicionales del Servicio - Máximo 5 fotos */}
              <div className="space-y-2.5 border-t border-[#2d333b] pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Fotos adicionales del Servicio (Máx. 5)</label>
                  <span className="text-[10px] text-[#c5a059] font-mono">{(editingService.image_urls || []).length} / 5</span>
                </div>

                {/* Selector de modo: Almacén Interno o Enlace URL */}
                <div className="flex gap-2 p-0.5 bg-[#0f1115] border border-[#2d333b] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSrvGalleryMode('upload')}
                    className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      srvGalleryMode === 'upload' 
                        ? 'bg-[#c5a059] text-[#0f1115]' 
                        : 'text-[#e2e8f0]/60 hover:text-[#e2e8f0]'
                    }`}
                  >
                    Almacén Interno (Subir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSrvGalleryMode('link')}
                    className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      srvGalleryMode === 'link' 
                        ? 'bg-[#c5a059] text-[#0f1115]' 
                        : 'text-[#e2e8f0]/60 hover:text-[#e2e8f0]'
                    }`}
                  >
                    Por Enlace Link
                  </button>
                </div>

                {(editingService.image_urls || []).length < 5 ? (
                  srvGalleryMode === 'upload' ? (
                    <div className="border border-dashed border-[#2d333b] hover:border-[#c5a059]/40 bg-[#0f1115] rounded-lg p-3 text-center cursor-pointer transition-all relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          const currentGallery = editingService.image_urls || [];
                          const spaceLeft = 5 - currentGallery.length;
                          if (files.length > spaceLeft) {
                            alert(`Solo puedes subir hasta 5 fotos en total. Tienes espacio para ${spaceLeft} más.`);
                          }
                          const filesToProcess = files.slice(0, spaceLeft);
                          
                          const promises = filesToProcess.map(file => handleFileToBase64(file));

                          try {
                            const base64s = await Promise.all(promises);
                            setEditingService({
                              ...editingService,
                              image_urls: [...currentGallery, ...base64s]
                            });
                          } catch (err) {
                            console.error('Error al subir imágenes del servicio:', err);
                            alert('Error al procesar uno o más archivos de imagen.');
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <ImageIcon className="w-5 h-5 text-[#c5a059] mx-auto mb-1" />
                      <span className="block text-[11px] text-[#e2e8f0]/80 font-bold">Subir Fotos Adicionales</span>
                      <span className="block text-[9px] text-[#e2e8f0]/40 mt-0.5">PNG, JPG o JPEG (Hasta 5 fotos)</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 p-2 bg-[#0f1115] rounded-lg border border-[#2d333b]">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://ejemplo.com/servicio.jpg"
                          value={srvGalleryLinkInput}
                          onChange={(e) => setSrvGalleryLinkInput(e.target.value)}
                          className="flex-1 text-xs bg-[#1c2128] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2 focus:ring-1 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!srvGalleryLinkInput) return;
                            const currentGallery = editingService.image_urls || [];
                            if (currentGallery.length >= 5) {
                              alert("Ya has alcanzado el límite de 5 fotos.");
                              return;
                            }
                            setEditingService({
                              ...editingService,
                              image_urls: [...currentGallery, srvGalleryLinkInput]
                            });
                            setSrvGalleryLinkInput('');
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
                    ⚠️ Has alcanzado el límite máximo de 5 fotos para el servicio.
                  </div>
                )}

                <div className="grid grid-cols-5 gap-1.5 pt-1.5">
                  {(editingService.image_urls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded overflow-hidden border border-[#2d333b] group">
                      <img src={url} alt={`Servicio ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingService.image_urls || []).filter((_, i) => i !== idx);
                          setEditingService({ ...editingService, image_urls: updated });
                        }}
                        className="absolute inset-0 bg-red-600/95 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-all duration-150 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#0f1115] px-5 py-3.5 border-t border-[#2d333b] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowServiceModal(false); setEditingService(null); }}
                className="text-xs font-bold text-[#e2e8f0]/60 hover:text-[#e2e8f0] px-3 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
              >
                {editingService.id ? 'Guardar Cambios' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CITA MANUAL */}
      {showManualBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveManualBooking} className="bg-[#16191f] rounded-xl shadow-2xl border border-[#2d333b] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0f1115] border-b border-[#2d333b] p-5 text-[#e2e8f0]">
              <h3 className="font-display italic font-bold text-base text-[#c5a059]">Nueva Cita Manual (Admin)</h3>
              <p className="text-[#e2e8f0]/60 text-xs mt-1">Registra una cita acordada fuera de la plataforma o por vía telefónica.</p>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Tipo de Cliente */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Tipo de Cliente</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-[#e2e8f0] cursor-pointer">
                    <input
                      type="radio"
                      name="clientType"
                      value="manual"
                      checked={manualBookingForm.clientType === 'manual'}
                      onChange={(e) => setManualBookingForm({ ...manualBookingForm, clientType: e.target.value })}
                      className="accent-[#c5a059]"
                    />
                    <span>Ingresar datos manualmente</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#e2e8f0] cursor-pointer">
                    <input
                      type="radio"
                      name="clientType"
                      value="existing"
                      checked={manualBookingForm.clientType === 'existing'}
                      onChange={(e) => setManualBookingForm({ ...manualBookingForm, clientType: e.target.value })}
                      className="accent-[#c5a059]"
                    />
                    <span>Seleccionar cliente registrado</span>
                  </label>
                </div>
              </div>

              {/* Campos cliente manual */}
              {manualBookingForm.clientType === 'manual' ? (
                <div className="space-y-3 p-3 bg-[#0f1115]/40 border border-[#2d333b] rounded-lg">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#e2e8f0]/60 uppercase">Nombre Completo del Cliente *</label>
                    <input
                      type="text"
                      required={manualBookingForm.clientType === 'manual'}
                      value={manualBookingForm.clientName}
                      onChange={(e) => setManualBookingForm({ ...manualBookingForm, clientName: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#e2e8f0]/60 uppercase">Email (Opcional)</label>
                      <input
                        type="email"
                        value={manualBookingForm.clientEmail}
                        onChange={(e) => setManualBookingForm({ ...manualBookingForm, clientEmail: e.target.value })}
                        placeholder="juan@example.com"
                        className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#e2e8f0]/60 uppercase">Teléfono (Opcional)</label>
                      <input
                        type="tel"
                        value={manualBookingForm.clientPhone}
                        onChange={(e) => setManualBookingForm({ ...manualBookingForm, clientPhone: e.target.value })}
                        placeholder="600123456"
                        className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 p-3 bg-[#0f1115]/40 border border-[#2d333b] rounded-lg">
                  <label className="block text-xs font-bold text-[#e2e8f0]/60 uppercase">Seleccionar Cliente Registrado *</label>
                  <select
                    required={manualBookingForm.clientType === 'existing'}
                    value={manualBookingForm.selectedClientId}
                    onChange={(e) => setManualBookingForm({ ...manualBookingForm, selectedClientId: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  >
                    <option value="" className="bg-[#16191f]">Selecciona un cliente</option>
                    {profilesList.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#16191f]">
                        {p.full_name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Servicio y Profesional */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Servicio *</label>
                  <select
                    required
                    value={manualBookingForm.selectedServiceId}
                    onChange={(e) => setManualBookingForm({ ...manualBookingForm, selectedServiceId: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  >
                    <option value="" className="bg-[#16191f]">Selecciona Servicio</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#16191f]">
                        {s.name} ({s.duration_minutes} min - ${s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Profesional *</label>
                  <select
                    required
                    value={manualBookingForm.selectedProfessionalId}
                    onChange={(e) => setManualBookingForm({ ...manualBookingForm, selectedProfessionalId: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  >
                    <option value="" className="bg-[#16191f]">Selecciona Profesional</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#16191f]">
                        {p.name} ({p.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Fecha de Cita *</label>
                  <input
                    type="date"
                    required
                    value={manualBookingForm.appointmentDate}
                    onChange={(e) => setManualBookingForm({ ...manualBookingForm, appointmentDate: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Hora de Inicio *</label>
                  <input
                    type="time"
                    required
                    value={manualBookingForm.startTime}
                    onChange={(e) => setManualBookingForm({ ...manualBookingForm, startTime: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Notas adicionales</label>
                <textarea
                  rows={2}
                  value={manualBookingForm.notes}
                  onChange={(e) => setManualBookingForm({ ...manualBookingForm, notes: e.target.value })}
                  placeholder="Ej. Método de pago acordado en efectivo en el local."
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>
            </div>

            <div className="bg-[#0f1115] px-5 py-3.5 border-t border-[#2d333b] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualBookingModal(false)}
                className="text-xs font-bold text-[#e2e8f0]/60 hover:text-[#e2e8f0] px-3 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
              >
                Agendar Cita
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PROFESIONAL (AGREGAR / EDITAR) */}
      {showProfessionalModal && editingProfessional && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveProfessional} className="bg-[#16191f] rounded-xl shadow-2xl border border-[#2d333b] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0f1115] border-b border-[#2d333b] p-5 text-[#e2e8f0]">
              <h3 className="font-display italic font-bold text-base text-[#c5a059]">{editingProfessional.id ? 'Editar Profesional' : 'Nuevo Profesional'}</h3>
              <p className="text-[#e2e8f0]/60 text-xs mt-1">Configura la jornada de trabajo e identidad del profesional.</p>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editingProfessional.name || ''}
                  onChange={(e) => setEditingProfessional({ ...editingProfessional, name: e.target.value })}
                  className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Especialidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Colorista Senior"
                    value={editingProfessional.specialty || ''}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, specialty: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingProfessional.email || ''}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, email: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-[#0f1115] p-4 rounded-xl border border-[#2d333b]">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {editingProfessional.avatar_url ? (
                      <img 
                        src={editingProfessional.avatar_url} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#c5a059] shadow-lg bg-[#16191f]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#16191f] border border-[#2d333b] flex items-center justify-center text-[#e2e8f0]/40">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-[#e2e8f0] uppercase tracking-wide">Imagen de Perfil</label>
                    <p className="text-[10px] text-[#e2e8f0]/50 truncate">Elige o sube la foto del profesional.</p>
                  </div>
                </div>

                <div className="flex border-b border-[#2d333b] text-center">
                  <button
                    type="button"
                    onClick={() => setAvatarTab('presets')}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      avatarTab === 'presets'
                        ? 'border-[#c5a059] text-[#c5a059]'
                        : 'border-transparent text-[#e2e8f0]/40 hover:text-[#e2e8f0]/80'
                    }`}
                  >
                    Almacén
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('upload')}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      avatarTab === 'upload'
                        ? 'border-[#c5a059] text-[#c5a059]'
                        : 'border-transparent text-[#e2e8f0]/40 hover:text-[#e2e8f0]/80'
                    }`}
                  >
                    Subir Imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('url')}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      avatarTab === 'url'
                        ? 'border-[#c5a059] text-[#c5a059]'
                        : 'border-transparent text-[#e2e8f0]/40 hover:text-[#e2e8f0]/80'
                    }`}
                  >
                    Enlace URL
                  </button>
                </div>

                {/* Contenido según la pestaña */}
                {avatarTab === 'presets' && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {AVATAR_PRESETS.map((url, idx) => {
                      const isSelected = editingProfessional.avatar_url === url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingProfessional({ ...editingProfessional, avatar_url: url })}
                          className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                            isSelected ? 'border-[#c5a059] ring-2 ring-[#c5a059]/30' : 'border-transparent hover:border-[#2d333b]'
                          }`}
                        >
                          <img 
                            src={url} 
                            alt={`Preset ${idx + 1}`} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {avatarTab === 'upload' && (
                  <div className="space-y-2 pt-1">
                    <label className="flex flex-col items-center justify-center border border-dashed border-[#2d333b] hover:border-[#c5a059]/40 bg-[#16191f] rounded-lg p-4 cursor-pointer hover:bg-white/[0.02] transition-all">
                      <Upload className="w-5 h-5 text-[#c5a059] mb-1" />
                      <span className="text-[10px] text-[#e2e8f0]/80 font-medium text-center">Seleccionar imagen del dispositivo</span>
                      <span className="text-[9px] text-[#e2e8f0]/40 mt-0.5 text-center">Formatos sugeridos: JPG, PNG, WEBP</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditingProfessional({ ...editingProfessional, avatar_url: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {avatarTab === 'url' && (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/tu-foto.jpg"
                      value={editingProfessional.avatar_url || ''}
                      onChange={(e) => setEditingProfessional({ ...editingProfessional, avatar_url: e.target.value })}
                      className="w-full text-xs bg-[#16191f] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Hora Ingreso</label>
                  <input
                    type="time"
                    required
                    value={editingProfessional.work_start_time || '09:00'}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, work_start_time: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Hora Salida</label>
                  <input
                    type="time"
                    required
                    value={editingProfessional.work_end_time || '18:00'}
                    onChange={(e) => setEditingProfessional({ ...editingProfessional, work_end_time: e.target.value })}
                    className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Días de Atención Semanal</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {weekDays.map((day) => {
                    const isSelected = (editingProfessional.work_days || []).includes(day.value);
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => {
                          const currentDays = editingProfessional.work_days || [];
                          const updatedDays = currentDays.includes(day.value)
                            ? currentDays.filter((d: number) => d !== day.value)
                            : [...currentDays, day.value].sort();
                          setEditingProfessional({ ...editingProfessional, work_days: updatedDays });
                        }}
                        className={`text-[10px] font-semibold py-1.5 px-3 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-[#c5a059] border-[#c5a059] text-[#0f1115] shadow-sm'
                            : 'bg-[#0f1115] border-[#2d333b] text-[#e2e8f0]/60 hover:bg-white/5'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase">Servicios Autorizados</label>
                <div className="space-y-1 max-h-36 overflow-y-auto bg-[#0f1115] border border-[#2d333b] p-3 rounded-lg">
                  {services.map((srv) => {
                    const isSelected = (editingProfessional.service_ids || []).includes(srv.id);
                    return (
                      <label key={srv.id} className="flex items-center gap-2 text-xs text-[#e2e8f0]/80 cursor-pointer select-none py-1 hover:text-[#c5a059] transition-colors">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const currentSrvs = editingProfessional.service_ids || [];
                            const updatedSrvs = currentSrvs.includes(srv.id)
                              ? currentSrvs.filter(id => id !== srv.id)
                              : [...currentSrvs, srv.id];
                            setEditingProfessional({ ...editingProfessional, service_ids: updatedSrvs });
                          }}
                          className="rounded border-[#2d333b] bg-[#16191f] text-[#c5a059] focus:ring-[#c5a059] h-3.5 w-3.5 accent-[#c5a059]"
                        />
                        <span className="flex-1 truncate">{srv.name}</span>
                        <span className="text-[#c5a059] font-mono text-[10px] shrink-0">${Number(srv.price).toFixed(2)}</span>
                      </label>
                    );
                  })}
                  {services.length === 0 && (
                    <span className="text-[10px] text-[#e2e8f0]/40 italic">Crea servicios primero para poder vincularlos.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0f1115] px-5 py-3.5 border-t border-[#2d333b] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowProfessionalModal(false); setEditingProfessional(null); }}
                className="text-xs font-bold text-[#e2e8f0]/60 hover:text-[#e2e8f0] px-3 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
              >
                {editingProfessional.id ? 'Guardar Cambios' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE HISTORIA CLÍNICA Y ATENCIÓN (NUEVO) */}
      {showHistoryModal && attendingApt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16191f] rounded-2xl shadow-2xl border border-[#2d333b] max-w-4xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#0f1115] border-b border-[#2d333b] p-5 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-[#c5a059] uppercase tracking-widest block mb-1 font-mono">Ficha de Paciente</span>
                <h3 className="font-display italic font-bold text-lg text-white">Atención & Historial Clínico</h3>
                <p className="text-[#e2e8f0]/50 text-[11px] mt-0.5">
                  Paciente: <span className="font-bold text-[#e2e8f0]">{attendingApt.client_name}</span> &bull; Cita: <span className="font-mono text-[#c5a059]">{attendingApt.appointment_date} ({attendingApt.start_time})</span>
                </p>
              </div>
              <button 
                onClick={() => { setShowHistoryModal(false); setAttendingApt(null); }}
                className="text-[#e2e8f0]/40 hover:text-white p-1 rounded-lg border border-transparent hover:border-[#2d333b] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dos Columnas: Izquierda (Historial Previo), Derecha (Formulario de Atención Nueva si no está atendida) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#13161c]">
              
              {/* HISTORIAL PREVIO (Columna Izquierda) */}
              <div className="lg:col-span-6 flex flex-col space-y-4">
                <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider block border-b border-[#2d333b] pb-2">
                  Historial Clínico del Paciente ({clientHistory.length})
                </span>

                {loadingHistory ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-[#e2e8f0]/40">
                    <Activity className="w-8 h-8 animate-pulse text-[#c5a059] mb-2" />
                    <span className="text-xs font-mono">Consultando base de datos...</span>
                  </div>
                ) : clientHistory.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#0f1115]/50 border border-dashed border-[#2d333b] rounded-xl text-[#e2e8f0]/40">
                    <ClipboardList className="w-10 h-10 text-[#2d333b] mb-2" />
                    <span className="text-xs font-semibold text-center">Este paciente no registra consultas previas en el establecimiento.</span>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto pr-1 max-h-[50vh]">
                    {clientHistory.map((item, idx) => (
                      <div key={item.id || idx} className="bg-[#1c2128] border border-[#2d333b] rounded-xl p-4 space-y-3 shadow-lg hover:border-[#c5a059]/20 transition-all">
                        <div className="flex justify-between items-center border-b border-[#2d333b]/60 pb-1.5">
                          <span className="text-xs font-bold text-[#c5a059] font-mono">{item.consultation_date}</span>
                          <span className="text-[10px] text-[#e2e8f0]/40 font-mono">Atendido por {item.created_by_name || 'Profesional'}</span>
                        </div>
                        <div className="space-y-2 text-xs leading-relaxed text-[#e2e8f0]/80">
                          <div><strong className="text-[#c5a059]">Motivo de consulta:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{item.reason}</p></div>
                          <div><strong className="text-[#c5a059]">Cuadro clínico:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{item.clinical_picture}</p></div>
                          <div><strong className="text-[#c5a059]">Diagnóstico:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{item.diagnosis}</p></div>
                          <div><strong className="text-[#c5a059]">Tratamiento:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{item.treatment}</p></div>
                          <div className="bg-[#0f1115]/80 p-2.5 rounded-lg border border-[#2d333b]/40 mt-1">
                            <strong className="text-[#c5a059] block text-[10px] uppercase font-mono tracking-wider mb-1">Receta / Prescripción:</strong>
                            <p className="text-[#e2e8f0]/70 font-mono text-[11px] whitespace-pre-wrap">{item.prescription}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FORMULARIO DE CONSULTA ACTUAL (Columna Derecha) */}
              <div className="lg:col-span-6 flex flex-col space-y-4">
                <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider block border-b border-[#2d333b] pb-2">
                  {attendingApt.status === 'attended' || attendingApt.status === 'completed' ? 'Ficha Registrada de la Consulta' : 'Registrar Atención de Consulta Actual'}
                </span>

                {attendingApt.status === 'attended' || attendingApt.status === 'completed' ? (() => {
                  // Mostrar el registro específico de esta cita
                  const matchedRecord = clientHistory.find(h => h.appointment_id === attendingApt.id);
                  if (matchedRecord) {
                    return (
                      <div className="bg-[#1c2128] border border-blue-500/20 rounded-xl p-5 space-y-4 shadow-xl">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Cita Atendida & Completada</span>
                        </div>
                        <div className="space-y-3 text-xs text-[#e2e8f0]/90 leading-relaxed">
                          <div><strong className="text-[#c5a059]">Motivo de consulta:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{matchedRecord.reason}</p></div>
                          <div><strong className="text-[#c5a059]">Cuadro clínico:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{matchedRecord.clinical_picture}</p></div>
                          <div><strong className="text-[#c5a059]">Diagnóstico:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{matchedRecord.diagnosis}</p></div>
                          <div><strong className="text-[#c5a059]">Tratamiento:</strong> <p className="mt-0.5 text-[#e2e8f0]/60 whitespace-pre-wrap">{matchedRecord.treatment}</p></div>
                          <div className="bg-[#0f1115] p-3 rounded-lg border border-[#2d333b]">
                            <strong className="text-[#c5a059] block text-[10px] uppercase font-mono tracking-wider mb-1">Receta / Prescripción:</strong>
                            <p className="text-[#e2e8f0]/70 font-mono text-[11px] whitespace-pre-wrap">{matchedRecord.prescription}</p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-[#1c2128]/50 border border-[#2d333b] rounded-xl p-5 text-center text-[#e2e8f0]/40 flex flex-col justify-center items-center py-12">
                        <Info className="w-8 h-8 text-[#2d333b] mb-2" />
                        <span className="text-xs font-semibold">Cita atendida externamente o sin ficha adjunta registrada.</span>
                      </div>
                    );
                  }
                })() : (
                  <form onSubmit={handleSaveClientHistory} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3.5 overflow-y-auto max-h-[50vh] pr-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-[#e2e8f0]/40 uppercase">Nombre del Paciente</label>
                          <input
                            type="text"
                            disabled
                            value={attendingApt.client_name || ''}
                            className="w-full text-xs bg-[#0f1115]/50 border border-[#2d333b] text-[#e2e8f0]/50 rounded-lg p-2.5 cursor-not-allowed font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-[#e2e8f0]/40 uppercase">Fecha de Consulta</label>
                          <input
                            type="text"
                            disabled
                            value={attendingApt.appointment_date || ''}
                            className="w-full text-xs bg-[#0f1115]/50 border border-[#2d333b] text-[#e2e8f0]/50 rounded-lg p-2.5 cursor-not-allowed font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#e2e8f0]/80 uppercase">Motivo de Consulta</label>
                        <textarea
                          required
                          rows={2}
                          value={historyForm.reason}
                          onChange={(e) => setHistoryForm({ ...historyForm, reason: e.target.value })}
                          placeholder="Indique los síntomas principales expuestos por el paciente..."
                          className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#e2e8f0]/80 uppercase">Cuadro Clínico</label>
                        <textarea
                          required
                          rows={2}
                          value={historyForm.clinical_picture}
                          onChange={(e) => setHistoryForm({ ...historyForm, clinical_picture: e.target.value })}
                          placeholder="Detalles del examen físico, signos vitales o estado de ingreso..."
                          className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-[#e2e8f0]/80 uppercase">Diagnóstico</label>
                          <textarea
                            required
                            rows={2}
                            value={historyForm.diagnosis}
                            onChange={(e) => setHistoryForm({ ...historyForm, diagnosis: e.target.value })}
                            placeholder="Diagnóstico conclusivo o preliminar..."
                            className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-[#e2e8f0]/80 uppercase">Tratamiento</label>
                          <textarea
                            required
                            rows={2}
                            value={historyForm.treatment}
                            onChange={(e) => setHistoryForm({ ...historyForm, treatment: e.target.value })}
                            placeholder="Indicaciones, terapia o reposo recomendado..."
                            className="w-full text-xs bg-[#0f1115] border border-[#2d333b] text-[#e2e8f0] rounded-lg p-2.5 focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-emerald-400 uppercase font-mono tracking-wider">Receta / Prescripción de Medicamentos</label>
                        <textarea
                          required
                          rows={3}
                          value={historyForm.prescription}
                          onChange={(e) => setHistoryForm({ ...historyForm, prescription: e.target.value })}
                          placeholder="Fármaco - Dosis - Frecuencia - Duración&#10;Ej. Paracetamol 500mg, 1 tableta cada 8 horas por 3 días."
                          className="w-full text-xs bg-[#0f1115] border border-emerald-500/20 text-emerald-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-emerald-500/20 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2d333b]/60 flex justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setShowHistoryModal(false); setAttendingApt(null); }}
                        className="text-xs font-bold text-[#e2e8f0]/60 hover:text-[#e2e8f0] px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 font-mono"
                      >
                        <Check className="w-4 h-4" />
                        <span>Completar Atención & Registrar</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
