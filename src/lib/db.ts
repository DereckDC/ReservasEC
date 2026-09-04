import { createClient } from '@supabase/supabase-js';
import { 
  Business, Profile, Service, Category, Professional, Appointment, Review, BusinessAnalytics, Certificate, ClientHistoryRecord, UserRole
} from '../types';

// Obtener las credenciales de Supabase de las variables de entorno
let rawSupabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
if (rawSupabaseUrl.endsWith('/rest/v1/')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 9);
} else if (rawSupabaseUrl.endsWith('/rest/v1')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 8);
}
if (rawSupabaseUrl.endsWith('/')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 1);
}

export const supabaseUrl = rawSupabaseUrl;
export const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

// Configuración de Supabase
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }) 
  : null;

// Limpiar de forma definitiva cualquier dato semilla residual almacenado en localStorage
if (typeof window !== 'undefined') {
  const seedKeys = [
    'db_categories',
    'db_businesses',
    'db_services',
    'db_professionals',
    'db_profiles',
    'db_reviews',
    'db_appointments',
    'db_client_histories'
  ];
  seedKeys.forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch (_) {}
  });
}

export const isValidUUID = (id: any): boolean => {
  if (typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const formatErrorMessage = (err: any): string => {
  if (!err) return 'Error desconocido';
  const msg = typeof err === 'string' ? err : err.message || err.error_description || String(err);
  if (
    msg.toLowerCase().includes('failed to fetch') || 
    msg.toLowerCase().includes('fetch failed') || 
    msg.toLowerCase().includes('networkerror') ||
    msg.toLowerCase().includes('could not resolve host')
  ) {
    return 'No se pudo conectar con el servidor de Supabase. Verifica que el proyecto esté activo en el panel de Supabase.';
  }
  return msg;
};

// Helper seguro para enviar notificaciones asíncronas al backend
const safeNotifyAppointment = async (payload: any) => {
  try {
    await fetch('/api/notify-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('[AgendaEC] Notificación asíncrona de cita:', e);
  }
};

// ==========================================
// CAPA DE ACCESO A DATOS EXCLUSIVA DE SUPABASE (SIN DATOS SEMILLA)
// ==========================================

export const db = {
  // --- CATEGORÍAS ---
  async getCategories(): Promise<Category[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) {
        console.error('Error al obtener categorías de Supabase:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Excepción al consultar categorías en Supabase:', err);
      return [];
    }
  },

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = { name: category.name };
    if (category.description) payload.description = category.description;
    const { data, error } = await supabase.from('categories').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    if (!supabase || !isValidUUID(id)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  // --- NEGOCIOS ---
  async getBusinesses(): Promise<Business[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('businesses').select('*').order('name');
      if (error) {
        console.error('Error al obtener negocios de Supabase:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Excepción al consultar negocios en Supabase:', err);
      return [];
    }
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    if (!supabase || !slug) return null;
    try {
      const { data, error } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle();
      if (error) {
        console.error('Error al obtener negocio por slug en Supabase:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Excepción al consultar negocio por slug:', err);
      return null;
    }
  },

  async getBusinessById(id: string): Promise<Business | null> {
    if (!supabase || !isValidUUID(id)) return null;
    try {
      const { data, error } = await supabase.from('businesses').select('*').eq('id', id).maybeSingle();
      if (error) {
        console.error('Error al obtener negocio por ID en Supabase:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Excepción al consultar negocio por ID:', err);
      return null;
    }
  },

  async createBusiness(business: Omit<Business, 'id' | 'created_at'>): Promise<Business> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {
      name: business.name,
      slug: business.slug,
      description: business.description,
      category: business.category,
      logo_url: business.logo_url || null,
      cover_url: business.cover_url || null,
      phone: business.phone,
      address: business.address,
      gallery_urls: business.gallery_urls || [],
      certificates: business.certificates || [],
      is_visible: business.is_visible !== false,
      google_maps_url: business.google_maps_url || null
    };
    const { data, error } = await supabase.from('businesses').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateBusiness(id: string, business: Partial<Business>): Promise<Business> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {};
    if (business.name !== undefined) payload.name = business.name;
    if (business.slug !== undefined) payload.slug = business.slug;
    if (business.description !== undefined) payload.description = business.description;
    if (business.category !== undefined) payload.category = business.category;
    if (business.logo_url !== undefined) payload.logo_url = business.logo_url;
    if (business.cover_url !== undefined) payload.cover_url = business.cover_url;
    if (business.phone !== undefined) payload.phone = business.phone;
    if (business.address !== undefined) payload.address = business.address;
    if (business.gallery_urls !== undefined) payload.gallery_urls = business.gallery_urls;
    if (business.certificates !== undefined) payload.certificates = business.certificates;
    if (business.is_visible !== undefined) payload.is_visible = business.is_visible;
    if (business.google_maps_url !== undefined) payload.google_maps_url = business.google_maps_url;

    const { data, error } = await supabase.from('businesses').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteBusiness(id: string): Promise<void> {
    if (!supabase || !isValidUUID(id)) return;
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SERVICIOS ---
  async getServices(businessId?: string): Promise<Service[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('services').select('*').order('name');
      if (businessId && isValidUUID(businessId)) {
        query = query.eq('business_id', businessId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error al obtener servicios de Supabase:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Excepción al consultar servicios en Supabase:', err);
      return [];
    }
  },

  async createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {
      business_id: service.business_id,
      name: service.name,
      description: service.description,
      duration_minutes: Number(service.duration_minutes) || 30,
      price: Number(service.price) || 0,
      image_url: service.image_url || null,
      image_urls: service.image_urls || []
    };
    if (service.category_id && isValidUUID(service.category_id)) {
      payload.category_id = service.category_id;
    }
    const { data, error } = await supabase.from('services').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {};
    if (service.business_id !== undefined) payload.business_id = service.business_id;
    if (service.name !== undefined) payload.name = service.name;
    if (service.description !== undefined) payload.description = service.description;
    if (service.duration_minutes !== undefined) payload.duration_minutes = Number(service.duration_minutes);
    if (service.price !== undefined) payload.price = Number(service.price);
    if (service.image_url !== undefined) payload.image_url = service.image_url;
    if (service.image_urls !== undefined) payload.image_urls = service.image_urls;
    if (service.category_id !== undefined) {
      payload.category_id = isValidUUID(service.category_id) ? service.category_id : null;
    }
    const { data, error } = await supabase.from('services').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteService(id: string): Promise<void> {
    if (!supabase || !isValidUUID(id)) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PROFESIONALES ---
  async getProfessionals(businessId?: string): Promise<Professional[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('professionals').select('*').order('name');
      if (businessId && isValidUUID(businessId)) {
        query = query.eq('business_id', businessId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error al consultar profesionales de Supabase:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Excepción al consultar profesionales en Supabase:', err);
      return [];
    }
  },

  async createProfessional(professional: Omit<Professional, 'id' | 'created_at'>): Promise<Professional> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {
      business_id: professional.business_id,
      name: professional.name,
      specialty: professional.specialty,
      email: professional.email || null,
      avatar_url: professional.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      work_days: professional.work_days || [1, 2, 3, 4, 5],
      work_start_time: professional.work_start_time || '09:00',
      work_end_time: professional.work_end_time || '18:00',
      service_ids: professional.service_ids || []
    };
    if (professional.user_id && isValidUUID(professional.user_id)) {
      payload.user_id = professional.user_id;
    }
    const { data, error } = await supabase.from('professionals').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateProfessional(id: string, professional: Partial<Professional>): Promise<Professional> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {};
    if (professional.business_id !== undefined) payload.business_id = professional.business_id;
    if (professional.name !== undefined) payload.name = professional.name;
    if (professional.specialty !== undefined) payload.specialty = professional.specialty;
    if (professional.email !== undefined) payload.email = professional.email;
    if (professional.avatar_url !== undefined) payload.avatar_url = professional.avatar_url;
    if (professional.work_days !== undefined) payload.work_days = professional.work_days;
    if (professional.work_start_time !== undefined) payload.work_start_time = professional.work_start_time;
    if (professional.work_end_time !== undefined) payload.work_end_time = professional.work_end_time;
    if (professional.service_ids !== undefined) payload.service_ids = professional.service_ids;
    if (professional.user_id !== undefined) {
      payload.user_id = isValidUUID(professional.user_id) ? professional.user_id : null;
    }
    const { data, error } = await supabase.from('professionals').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProfessional(id: string): Promise<void> {
    if (!supabase || !isValidUUID(id)) return;
    const { error } = await supabase.from('professionals').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PERFILES DE USUARIO ---
  async getProfiles(): Promise<Profile[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at');
      if (error) {
        console.error('Error al consultar perfiles de Supabase:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Excepción al consultar perfiles en Supabase:', err);
      return [];
    }
  },

  async getProfileById(id: string): Promise<Profile | null> {
    if (!supabase || !isValidUUID(id)) return null;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) {
        console.error('Error al consultar perfil en Supabase:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Excepción al consultar perfil en Supabase:', err);
      return null;
    }
  },

  async createProfile(profile: Profile): Promise<Profile> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role || 'client'
    };
    if (profile.business_id && isValidUUID(profile.business_id)) {
      payload.business_id = profile.business_id;
    }
    if (profile.phone) payload.phone = profile.phone;
    const { data, error } = await supabase.from('profiles').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, profile: Partial<Profile>): Promise<Profile> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {};
    if (profile.full_name !== undefined) payload.full_name = profile.full_name;
    if (profile.email !== undefined) payload.email = profile.email;
    if (profile.role !== undefined) payload.role = profile.role;
    if (profile.business_id !== undefined) {
      payload.business_id = isValidUUID(profile.business_id) ? profile.business_id : null;
    }
    if (profile.phone !== undefined) payload.phone = profile.phone;
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async updateProfileRole(id: string, role: UserRole, businessId?: string): Promise<Profile> {
    return this.updateProfile(id, { role, business_id: businessId });
  },

  async deleteProfile(id: string): Promise<void> {
    if (!supabase || !isValidUUID(id)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CITAS (APPOINTMENTS) ---
  async getAppointments(businessId?: string, clientId?: string, professionalId?: string): Promise<Appointment[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('appointments').select(`
        *,
        client:profiles(email, full_name, phone),
        service:services(name, price),
        professional:professionals(name),
        business:businesses(name)
      `).order('appointment_date', { ascending: false }).order('start_time', { ascending: true });

      if (businessId && isValidUUID(businessId)) {
        query = query.eq('business_id', businessId);
      }
      if (clientId && isValidUUID(clientId)) {
        query = query.eq('client_id', clientId);
      }
      if (professionalId && isValidUUID(professionalId)) {
        query = query.eq('professional_id', professionalId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error al consultar citas en Supabase:', error.message || error);
        return [];
      }

      return (data || []).map((apt: any) => ({
        ...apt,
        client_name: apt.client?.full_name || apt.client_name,
        service_name: apt.service?.name || apt.service_name,
        professional_name: apt.professional?.name || apt.professional_name,
        business_name: apt.business?.name || apt.business_name
      }));
    } catch (err) {
      console.error('Excepción al consultar citas en Supabase:', err);
      return [];
    }
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {
      business_id: appointment.business_id,
      client_id: appointment.client_id,
      service_id: appointment.service_id,
      professional_id: appointment.professional_id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status || 'reserved',
      notes: appointment.notes || null
    };
    const { data, error } = await supabase.from('appointments').insert(payload).select().single();
    if (error) throw error;

    // Notificación en segundo plano
    safeNotifyAppointment({
      appointmentId: data.id,
      appointment: {
        ...data,
        client_name: appointment.client_name,
        service_name: appointment.service_name,
        professional_name: appointment.professional_name,
        business_name: appointment.business_name
      }
    });

    return {
      ...data,
      client_name: appointment.client_name,
      service_name: appointment.service_name,
      professional_name: appointment.professional_name,
      business_name: appointment.business_name
    };
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).select().single();
    if (error) throw error;

    safeNotifyAppointment({
      appointmentId: id,
      statusUpdate: status
    });

    return data;
  },

  async deleteAppointment(id: string): Promise<void> {
    if (!supabase || !isValidUUID(id)) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  },

  // --- RESEÑAS ---
  async getReviews(businessId: string): Promise<Review[]> {
    if (!supabase || !isValidUUID(businessId)) return [];
    try {
      const { data, error } = await supabase.from('reviews').select('*').eq('business_id', businessId).order('created_at', { ascending: false });
      if (error) {
        console.error('Error al consultar reseñas en Supabase:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Excepción al consultar reseñas en Supabase:', err);
      return [];
    }
  },

  async createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {
      business_id: review.business_id,
      client_id: review.client_id,
      client_name: review.client_name,
      rating: review.rating,
      comment: review.comment,
      is_verified: review.is_verified !== false
    };
    const { data, error } = await supabase.from('reviews').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  // --- HISTORIAL CLÍNICO / FICHA DEL CLIENTE ---
  async getClientHistory(clientId: string, businessId?: string): Promise<ClientHistoryRecord[]> {
    if (!supabase || !isValidUUID(clientId)) return [];
    try {
      let query = supabase.from('client_histories').select('*').eq('client_id', clientId).order('consultation_date', { ascending: false });
      if (businessId && isValidUUID(businessId)) {
        query = query.eq('business_id', businessId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error al consultar historial en Supabase:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Excepción al consultar historial en Supabase:', err);
      return [];
    }
  },

  async createClientHistory(record: Omit<ClientHistoryRecord, 'id' | 'created_at'>): Promise<ClientHistoryRecord> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {
      business_id: record.business_id,
      client_id: record.client_id,
      client_name: record.client_name,
      consultation_date: record.consultation_date,
      reason: record.reason,
      clinical_picture: record.clinical_picture,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription,
      created_by_name: record.created_by_name
    };
    if (record.appointment_id && isValidUUID(record.appointment_id)) {
      payload.appointment_id = record.appointment_id;
    }
    const { data, error } = await supabase.from('client_histories').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateClientHistory(id: string, record: Partial<ClientHistoryRecord>): Promise<ClientHistoryRecord> {
    if (!supabase) throw new Error('Supabase no está configurado');
    const payload: any = {};
    if (record.reason !== undefined) payload.reason = record.reason;
    if (record.clinical_picture !== undefined) payload.clinical_picture = record.clinical_picture;
    if (record.diagnosis !== undefined) payload.diagnosis = record.diagnosis;
    if (record.treatment !== undefined) payload.treatment = record.treatment;
    if (record.prescription !== undefined) payload.prescription = record.prescription;
    if (record.consultation_date !== undefined) payload.consultation_date = record.consultation_date;

    const { data, error } = await supabase.from('client_histories').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteClientHistory(id: string): Promise<void> {
    if (!supabase || !isValidUUID(id)) return;
    const { error } = await supabase.from('client_histories').delete().eq('id', id);
    if (error) throw error;
  },

  // --- ANALÍTICAS DE NEGOCIO ---
  async getAnalytics(businessId: string): Promise<BusinessAnalytics> {
    try {
      const appointments = await this.getAppointments(businessId);
      const services = await this.getServices(businessId);
      const professionals = await this.getProfessionals(businessId);
      const reviews = await this.getReviews(businessId);

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => 
        a && (a.status === 'completed' || a.status === 'attended')
      ).length;
      const cancelledAppointments = appointments.filter(a => a && a.status === 'cancelled').length;

      let totalRevenue = 0;
      appointments.forEach(a => {
        if (a && (a.status === 'completed' || a.status === 'attended')) {
          const s = services.find(srv => srv.id === a.service_id);
          if (s) {
            totalRevenue += Number(s.price);
          }
        }
      });

      const avgRating = reviews.length > 0 
        ? Number((reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviews.length).toFixed(1))
        : 5.0;

      const serviceCounts: Record<string, { count: number; revenue: number }> = {};
      appointments.forEach(a => {
        if (a) {
          const s = services.find(srv => srv.id === a.service_id);
          if (s) {
            if (!serviceCounts[s.name]) {
              serviceCounts[s.name] = { count: 0, revenue: 0 };
            }
            serviceCounts[s.name].count += 1;
            if (a.status === 'completed' || a.status === 'attended') {
              serviceCounts[s.name].revenue += Number(s.price);
            }
          }
        }
      });
      const popularServices = Object.entries(serviceCounts).map(([serviceName, info]) => ({
        serviceName,
        count: info.count,
        revenue: info.revenue
      })).sort((a, b) => b.count - a.count).slice(0, 5);

      const profCounts: Record<string, number> = {};
      appointments.forEach(a => {
        if (a) {
          const p = professionals.find(prof => prof.id === a.professional_id);
          if (p) {
            profCounts[p.name] = (profCounts[p.name] || 0) + 1;
          }
        }
      });
      const professionalLoad = Object.entries(profCounts).map(([professionalName, count]) => ({
        professionalName,
        count
      })).sort((a, b) => b.count - a.count);

      const statusCounts: Record<string, number> = { pending: 0, reserved: 0, attended: 0, cancelled: 0 };
      appointments.forEach(a => {
        if (a) {
          const mappedStatus = 
            a.status === 'confirmed' ? 'reserved' : 
            a.status === 'completed' ? 'attended' : 
            a.status;
          if (mappedStatus in statusCounts) {
            statusCounts[mappedStatus] = (statusCounts[mappedStatus] || 0) + 1;
          }
        }
      });
      const appointmentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status === 'pending' ? 'Pendiente' : status === 'reserved' ? 'Reservado' : status === 'cancelled' ? 'Cancelada' : 'Atendido',
        count
      }));

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        averageRating: avgRating,
        popularServices,
        professionalLoad,
        appointmentsByStatus
      };
    } catch (err) {
      console.error('Error calculando analíticas en db:', err);
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0,
        averageRating: 5.0,
        popularServices: [],
        professionalLoad: [],
        appointmentsByStatus: []
      };
    }
  },

  // --- ANALÍTICAS GLOBALES SUPERADMIN ---
  async getGlobalSuperadminAnalytics(): Promise<{
    totalBusinesses: number;
    totalUsers: number;
    totalAppointments: number;
    totalRevenue: number;
  }> {
    try {
      const businesses = await this.getBusinesses();
      const profiles = await this.getProfiles();
      const appointments = await this.getAppointments();

      const totalAppointments = appointments.length;
      let totalRevenue = 0;
      appointments.forEach(a => {
        if (a.status === 'completed' || a.status === 'attended') {
          totalRevenue += Number((a as any).price || 0);
        }
      });

      return {
        totalBusinesses: businesses.length,
        totalUsers: profiles.length,
        totalAppointments,
        totalRevenue
      };
    } catch (err) {
      console.error('Error obteniendo analíticas globales:', err);
      return {
        totalBusinesses: 0,
        totalUsers: 0,
        totalAppointments: 0,
        totalRevenue: 0
      };
    }
  }
};
