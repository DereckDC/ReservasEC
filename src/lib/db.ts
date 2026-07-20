import { createClient } from '@supabase/supabase-js';
import { 
  Business, Profile, Service, Category, Professional, Appointment, Review, BusinessAnalytics, UserRole, Certificate, ClientHistoryRecord
} from '../types';

// Obtener las credenciales de Supabase de las variables de entorno
let rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uypldnumxstagpjgifou.supabase.co';
if (rawSupabaseUrl.endsWith('/rest/v1/')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 9);
} else if (rawSupabaseUrl.endsWith('/rest/v1')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 8);
}
const supabaseUrl = rawSupabaseUrl;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5cGxkbnVteHN0YWdwamdpZm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDYyNDMsImV4cCI6MjA5OTQ4MjI0M30.QmF4sdTSO2neH7EUJZ1VG5H4dHLJbttfVDHj5WfMQ0k';

// Inicialización diferida y condicional de Supabase
export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// SEED INICIAL PARA MODO LOCAL FALLBACK (LOCALSTORAGE)
// ==========================================

const INITIAL_CATEGORIES: Category[] = [];
const INITIAL_BUSINESSES: Business[] = [];
const INITIAL_SERVICES: Service[] = [];
const INITIAL_PROFESSIONALS: Professional[] = [];
const INITIAL_PROFILES: Profile[] = [];
const INITIAL_REVIEWS: Review[] = [];
const INITIAL_APPOINTMENTS: Appointment[] = [];

// Helper para inicializar el LocalStorage
const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;

  // Limpiar rastros de datos demo anteriores si existen
  const businesses = localStorage.getItem('db_businesses');
  if (businesses && (businesses.includes('biz-1') || businesses.includes('Peluquería') || businesses.includes('FisioVital'))) {
    localStorage.removeItem('db_categories');
    localStorage.removeItem('db_businesses');
    localStorage.removeItem('db_services');
    localStorage.removeItem('db_professionals');
    localStorage.removeItem('db_profiles');
    localStorage.removeItem('db_reviews');
    localStorage.removeItem('db_appointments');
    localStorage.removeItem('db_client_histories');
  }

  if (!localStorage.getItem('db_categories')) {
    localStorage.setItem('db_categories', JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem('db_businesses')) {
    localStorage.setItem('db_businesses', JSON.stringify(INITIAL_BUSINESSES));
  }
  if (!localStorage.getItem('db_services')) {
    localStorage.setItem('db_services', JSON.stringify(INITIAL_SERVICES));
  }
  if (!localStorage.getItem('db_professionals')) {
    localStorage.setItem('db_professionals', JSON.stringify(INITIAL_PROFESSIONALS));
  }
  if (!localStorage.getItem('db_profiles')) {
    localStorage.setItem('db_profiles', JSON.stringify(INITIAL_PROFILES));
  }
  if (!localStorage.getItem('db_reviews')) {
    localStorage.setItem('db_reviews', JSON.stringify(INITIAL_REVIEWS));
  }
  if (!localStorage.getItem('db_appointments')) {
    localStorage.setItem('db_appointments', JSON.stringify(INITIAL_APPOINTMENTS));
  }
};

initializeLocalStorage();

const isValidUUID = (id: any): boolean => {
  if (typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// ==========================================
// MÉTODOS DE ACCESO A DATOS (SOPORTAN AMBOS MODOS)
// ==========================================

export const db = {
  // --- CATEGORÍAS ---
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getCategories fallido, usando local:', err);
        return JSON.parse(localStorage.getItem('db_categories') || '[]');
      }
    } else {
      return JSON.parse(localStorage.getItem('db_categories') || '[]');
    }
  },

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const newCategory: Category = {
      id: 'cat-' + Date.now(),
      created_at: new Date().toISOString(),
      ...category
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').insert(category).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase createCategory fallido, usando local:', err);
        const list = JSON.parse(localStorage.getItem('db_categories') || '[]');
        list.push(newCategory);
        localStorage.setItem('db_categories', JSON.stringify(list));
        return newCategory;
      }
    } else {
      const list = JSON.parse(localStorage.getItem('db_categories') || '[]');
      list.push(newCategory);
      localStorage.setItem('db_categories', JSON.stringify(list));
      return newCategory;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteCategory fallido, usando local:', err);
      }
    }
    let list: Category[] = JSON.parse(localStorage.getItem('db_categories') || '[]');
    list = list.filter(item => item.id !== id);
    localStorage.setItem('db_categories', JSON.stringify(list));
  },

  // --- NEGOCIOS ---
  async getBusinesses(): Promise<Business[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('businesses').select('*').order('name');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getBusinesses fallido, usando local:', err);
        return JSON.parse(localStorage.getItem('db_businesses') || '[]');
      }
    } else {
      return JSON.parse(localStorage.getItem('db_businesses') || '[]');
    }
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase getBusinessBySlug fallido, usando local:', err);
        const list: Business[] = JSON.parse(localStorage.getItem('db_businesses') || '[]');
        return list.find(b => b.slug === slug) || null;
      }
    } else {
      const list: Business[] = JSON.parse(localStorage.getItem('db_businesses') || '[]');
      return list.find(b => b.slug === slug) || null;
    }
  },

  async createBusiness(business: Omit<Business, 'id' | 'created_at'>): Promise<Business> {
    const newBiz: Business = {
      id: 'biz-' + Date.now(),
      created_at: new Date().toISOString(),
      ...business
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('businesses').insert(business).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase createBusiness fallido, usando local:', err);
        const list = JSON.parse(localStorage.getItem('db_businesses') || '[]');
        list.push(newBiz);
        localStorage.setItem('db_businesses', JSON.stringify(list));
        return newBiz;
      }
    } else {
      const list = JSON.parse(localStorage.getItem('db_businesses') || '[]');
      list.push(newBiz);
      localStorage.setItem('db_businesses', JSON.stringify(list));
      return newBiz;
    }
  },

  async updateBusiness(id: string, business: Partial<Business>): Promise<Business> {
    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      try {
        const { data, error } = await supabase.from('businesses').update(business).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error('Error al actualizar negocio en Supabase:', err);
        throw new Error(
          `No se pudo actualizar el negocio. Detalle: ${err.message || err}. ` +
          `Verifique que su cuenta tenga asignado el negocio correspondiente o tenga el rol de Super Administrador en la base de datos.`
        );
      }
    }
    const list: Business[] = JSON.parse(localStorage.getItem('db_businesses') || '[]');
    const index = list.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Negocio no encontrado');
    
    const updated = { ...list[index], ...business };
    list[index] = updated;
    localStorage.setItem('db_businesses', JSON.stringify(list));
    return updated;
  },

  async deleteBusiness(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      try {
        const { data, error } = await supabase.from('businesses').delete().eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('No se encontró el negocio o no tienes permisos de Super Administrador para eliminarlo.');
        }
        return;
      } catch (err: any) {
        console.error('Error al eliminar negocio en Supabase:', err);
        throw new Error(`No se pudo eliminar el negocio. Detalle: ${err.message || err}`);
      }
    }
    const list: Business[] = JSON.parse(localStorage.getItem('db_businesses') || '[]');
    const filtered = list.filter(b => b.id !== id);
    localStorage.setItem('db_businesses', JSON.stringify(filtered));
  },

  // --- SERVICIOS ---
  async getServices(businessId?: string): Promise<Service[]> {
    if (isSupabaseConfigured && supabase && (!businessId || isValidUUID(businessId))) {
      try {
        let query = supabase.from('services').select('*');
        if (businessId) {
          query = query.eq('business_id', businessId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getServices fallido, usando local:', err);
      }
    }
    const list: Service[] = JSON.parse(localStorage.getItem('db_services') || '[]');
    if (businessId) {
      return list.filter(s => s.business_id === businessId);
    }
    return list;
  },

  async createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    const newSrv: Service = {
      id: 'srv-' + Date.now(),
      created_at: new Date().toISOString(),
      ...service
    };

    if (isSupabaseConfigured && supabase && isValidUUID(service.business_id) && (!service.category_id || isValidUUID(service.category_id))) {
      try {
        const payload: any = {
          business_id: service.business_id,
          name: service.name,
          description: service.description,
          duration_minutes: service.duration_minutes,
          price: service.price,
          image_url: service.image_url,
          image_urls: service.image_urls || []
        };
        if (service.category_id && isValidUUID(service.category_id)) {
          payload.category_id = service.category_id;
        }

        const { data, error } = await supabase.from('services').insert(payload).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase createService fallido, usando local:', err);
      }
    }
    const list = JSON.parse(localStorage.getItem('db_services') || '[]');
    list.push(newSrv);
    localStorage.setItem('db_services', JSON.stringify(list));
    return newSrv;
  },

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    if (isSupabaseConfigured && supabase && isValidUUID(id) && (!service.business_id || isValidUUID(service.business_id)) && (!service.category_id || isValidUUID(service.category_id))) {
      try {
        const payload: any = {};
        if (service.business_id !== undefined) payload.business_id = service.business_id;
        if (service.name !== undefined) payload.name = service.name;
        if (service.description !== undefined) payload.description = service.description;
        if (service.duration_minutes !== undefined) payload.duration_minutes = service.duration_minutes;
        if (service.price !== undefined) payload.price = service.price;
        if (service.image_url !== undefined) payload.image_url = service.image_url;
        if (service.image_urls !== undefined) payload.image_urls = service.image_urls;
        if (service.category_id !== undefined) {
          payload.category_id = isValidUUID(service.category_id) ? service.category_id : null;
        }

        const { data, error } = await supabase.from('services').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase updateService fallido, usando local:', err);
      }
    }
    const list: Service[] = JSON.parse(localStorage.getItem('db_services') || '[]');
    const index = list.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Servicio no encontrado');
    
    const updated = { ...list[index], ...service };
    list[index] = updated;
    localStorage.setItem('db_services', JSON.stringify(list));
    return updated;
  },

  async deleteService(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      try {
        // En Supabase, el trigger SECURITY DEFINER 'trigger_before_delete_service' se encarga automáticamente
        // de desvincular historiales clínicos, eliminar citas y limpiar la lista de servicios de profesionales
        // con privilegios de sistema, superando cualquier restricción de RLS del cliente sobre las tablas secundarias.
        const { data, error: deleteSrvErr } = await supabase.from('services').delete().eq('id', id).select();
        if (deleteSrvErr) throw deleteSrvErr;
        
        // Si no se devolvieron filas afectadas, la eliminación falló por políticas RLS o ID inexistente.
        if (!data || data.length === 0) {
          throw new Error('No se encontró el servicio o no tienes permisos de Administrador del negocio para eliminarlo.');
        }
        return;
      } catch (err: any) {
        console.error('Error al eliminar servicio en Supabase:', err);
        const errMsg = err?.message || err;
        throw new Error(
          `No se pudo eliminar el servicio. Detalle: ${errMsg}. ` +
          `Verifique que su cuenta tenga asignado el negocio correspondiente o ejecute el script supabase_schema.sql actualizado en el SQL Editor de Supabase para activar los triggers de eliminación.`
        );
      }
    }
    // LocalStorage fallback
    let list: Service[] = JSON.parse(localStorage.getItem('db_services') || '[]');
    list = list.filter(s => s.id !== id);
    localStorage.setItem('db_services', JSON.stringify(list));

    // Limpiar de los profesionales en local
    let profList: Professional[] = JSON.parse(localStorage.getItem('db_professionals') || '[]');
    profList = profList.map(p => {
      if (p.service_ids) {
        return { ...p, service_ids: p.service_ids.filter(sId => sId !== id) };
      }
      return p;
    });
    localStorage.setItem('db_professionals', JSON.stringify(profList));
  },

  // --- PROFESIONALES ---
  async getProfessionals(businessId?: string): Promise<Professional[]> {
    if (isSupabaseConfigured && supabase && (!businessId || isValidUUID(businessId))) {
      try {
        let query = supabase.from('professionals').select('*');
        if (businessId) {
          query = query.eq('business_id', businessId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getProfessionals fallido, usando local:', err);
      }
    }
    const list: Professional[] = JSON.parse(localStorage.getItem('db_professionals') || '[]');
    if (businessId) {
      return list.filter(p => p.business_id === businessId);
    }
    return list;
  },

  async createProfessional(professional: Omit<Professional, 'id' | 'created_at'>): Promise<Professional> {
    const newProf: Professional = {
      id: 'prof-' + Date.now(),
      created_at: new Date().toISOString(),
      ...professional
    };

    if (isSupabaseConfigured && supabase && isValidUUID(professional.business_id)) {
      try {
        const payload: any = {
          business_id: professional.business_id,
          name: professional.name,
          email: professional.email,
          specialty: professional.specialty,
          avatar_url: professional.avatar_url,
          work_start_time: professional.work_start_time,
          work_end_time: professional.work_end_time,
          work_days: professional.work_days,
          service_ids: professional.service_ids || [],
          user_id: professional.user_id || null
        };
        const { data, error } = await supabase.from('professionals').insert(payload).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase createProfessional fallido, usando local:', err);
      }
    }
    const list = JSON.parse(localStorage.getItem('db_professionals') || '[]');
    list.push(newProf);
    localStorage.setItem('db_professionals', JSON.stringify(list));
    return newProf;
  },

  async updateProfessional(id: string, professional: Partial<Professional>): Promise<Professional> {
    if (isSupabaseConfigured && supabase && isValidUUID(id) && (!professional.business_id || isValidUUID(professional.business_id))) {
      try {
        const payload: any = {};
        if (professional.business_id !== undefined) payload.business_id = professional.business_id;
        if (professional.name !== undefined) payload.name = professional.name;
        if (professional.email !== undefined) payload.email = professional.email;
        if (professional.specialty !== undefined) payload.specialty = professional.specialty;
        if (professional.avatar_url !== undefined) payload.avatar_url = professional.avatar_url;
        if (professional.work_start_time !== undefined) payload.work_start_time = professional.work_start_time;
        if (professional.work_end_time !== undefined) payload.work_end_time = professional.work_end_time;
        if (professional.work_days !== undefined) payload.work_days = professional.work_days;
        if (professional.service_ids !== undefined) payload.service_ids = professional.service_ids;
        if (professional.user_id !== undefined) payload.user_id = professional.user_id || null;

        const { data, error } = await supabase.from('professionals').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase updateProfessional fallido, usando local:', err);
      }
    }
    const list: Professional[] = JSON.parse(localStorage.getItem('db_professionals') || '[]');
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Profesional no encontrado');
    
    const updated = { ...list[index], ...professional };
    list[index] = updated;
    localStorage.setItem('db_professionals', JSON.stringify(list));
    return updated;
  },

  async deleteProfessional(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      try {
        // En Supabase, el trigger SECURITY DEFINER 'trigger_before_delete_professional' se encarga automáticamente
        // de desvincular historiales clínicos, eliminar citas y restablecer el rol del usuario vinculado a 'client'
        // con privilegios de sistema, superando cualquier restricción de RLS del cliente sobre las tablas secundarias.
        const { data, error: deleteProfErr } = await supabase.from('professionals').delete().eq('id', id).select();
        if (deleteProfErr) throw deleteProfErr;
        
        // Si no se devolvieron filas afectadas, la eliminación falló por políticas RLS o ID inexistente.
        if (!data || data.length === 0) {
          throw new Error('No se encontró el profesional o no tienes permisos de Administrador del negocio para eliminarlo.');
        }
        return;
      } catch (err: any) {
        console.error('Error al eliminar profesional en Supabase:', err);
        const errMsg = err?.message || err;
        throw new Error(
          `No se pudo eliminar el profesional. Detalle: ${errMsg}. ` +
          `Verifique que su cuenta tenga asignado el negocio correspondiente o ejecute el script supabase_schema.sql actualizado en el SQL Editor de Supabase para activar los triggers de eliminación.`
        );
      }
    }
    // LocalStorage fallback
    let list: Professional[] = JSON.parse(localStorage.getItem('db_professionals') || '[]');
    const profToDelete = list.find(p => p.id === id);
    list = list.filter(p => p.id !== id);
    localStorage.setItem('db_professionals', JSON.stringify(list));

    // Restablecer el rol en perfiles de local si había un usuario vinculado
    if (profToDelete && profToDelete.user_id) {
      let profiles: Profile[] = JSON.parse(localStorage.getItem('db_profiles') || '[]');
      profiles = profiles.map(p => {
        if (p.id === profToDelete.user_id) {
          return { ...p, role: 'client', business_id: undefined };
        }
        return p;
      });
      localStorage.setItem('db_profiles', JSON.stringify(profiles));
    }
  },

  // --- PERFILES (USUARIOS) ---
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getProfiles fallido, usando local:', err);
        return JSON.parse(localStorage.getItem('db_profiles') || '[]');
      }
    } else {
      return JSON.parse(localStorage.getItem('db_profiles') || '[]');
    }
  },

  async getProfile(id: string): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase getProfile fallido, usando local:', err);
      }
    }
    const list: Profile[] = JSON.parse(localStorage.getItem('db_profiles') || '[]');
    return list.find(p => p.id === id) || null;
  },

  async updateProfileRole(userId: string, role: UserRole, businessId?: string): Promise<Profile> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && (!businessId || isValidUUID(businessId))) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ role, business_id: businessId || null })
          .eq('id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error('Error al actualizar rol de perfil en Supabase:', err);
        throw new Error(`No se pudo actualizar el rol del usuario. Detalle: ${err.message || err}`);
      }
    }
    const list: Profile[] = JSON.parse(localStorage.getItem('db_profiles') || '[]');
    const index = list.findIndex(p => p.id === userId);
    if (index === -1) throw new Error('Usuario no encontrado');
    
    const updated = { ...list[index], role, business_id: businessId };
    list[index] = updated;
    localStorage.setItem('db_profiles', JSON.stringify(list));
    return updated;
  },

  async createProfile(profile: Profile): Promise<Profile> {
    if (isSupabaseConfigured && supabase && isValidUUID(profile.id)) {
      try {
        const { data, error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' }).select().single();
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error('Error al crear perfil en Supabase:', err);
        throw new Error(`No se pudo registrar el perfil en Supabase. Detalle: ${err.message || err}`);
      }
    }
    const list = JSON.parse(localStorage.getItem('db_profiles') || '[]');
    if (list.some((p: Profile) => p.id === profile.id)) {
      return profile;
    }
    list.push(profile);
    localStorage.setItem('db_profiles', JSON.stringify(list));
    return profile;
  },

  // --- CITAS ---
  async getAppointments(userId?: string, role?: UserRole, businessId?: string): Promise<Appointment[]> {
    const now = new Date();
    
    if (isSupabaseConfigured && supabase && (!userId || isValidUUID(userId)) && (!businessId || isValidUUID(businessId))) {
      try {
        let query = supabase.from('appointments').select(`
          *,
          client:profiles(full_name),
          service:services(name, price),
          professional:professionals(name),
          business:businesses(name)
        `);
        
        if (role === 'client' && userId) {
          query = query.eq('client_id', userId);
        } else if (role === 'admin' && businessId) {
          query = query.eq('business_id', businessId);
        } else if (role === 'professional' && businessId) {
          query = query.eq('business_id', businessId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Transformar para aplanar el join
        const aplanados = (data || []).map(item => ({
          ...item,
          client_name: item.client?.full_name,
          service_name: item.service?.name,
          professional_name: item.professional?.name,
          business_name: item.business?.name
        }));

        // Auto-cancelación automática para reservas 'pending' de más de 24 horas
        const procesados = await Promise.all(aplanados.map(async (apt) => {
          if (apt.status === 'pending') {
            const createdAt = new Date(apt.created_at);
            const diffHrs = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            if (diffHrs >= 24) {
              apt.status = 'cancelled';
              try {
                await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
              } catch (e) {
                console.error('Error al auto-cancelar cita en Supabase:', e);
              }
            }
          }
          return apt;
        }));

        if (role === 'professional' && businessId && userId) {
          const professionals = await this.getProfessionals(businessId);
          const profiles = await this.getProfiles();
          const userProfile = profiles.find(u => u.id === userId);
          let userProf = professionals.find(p => p.user_id === userId);
          if (!userProf && userProfile) {
            userProf = professionals.find(p => p.email && p.email.toLowerCase() === userProfile.email.toLowerCase());
          }
          if (userProf) {
            return procesados.filter(apt => apt.professional_id === userProf.id);
          }
        }

        return procesados;
      } catch (err) {
        console.warn('Supabase getAppointments fallido, usando local:', err);
      }
    }

    const list: Appointment[] = JSON.parse(localStorage.getItem('db_appointments') || '[]');
    const services = await this.getServices();
    const professionals = await this.getProfessionals();
    const profiles = await this.getProfiles();
    const businesses = await this.getBusinesses();

    // Enriquecer datos locales
    const enriched = list.map(apt => {
      const s = services.find(srv => srv.id === apt.service_id);
      const p = professionals.find(prof => prof.id === apt.professional_id);
      const u = profiles.find(usr => usr.id === apt.client_id);
      const b = businesses.find(biz => biz.id === apt.business_id);
      return {
        ...apt,
        service_name: s ? s.name : 'Servicio Desconocido',
        professional_name: p ? p.name : 'Profesional Desconocido',
        client_name: u ? u.full_name : 'Cliente Desconocido',
        business_name: b ? b.name : 'Negocio Desconocido'
      };
    });

    // Auto-cancelación local
    let changedLocal = false;
    const procesados = enriched.map(apt => {
      if (apt.status === 'pending') {
        const createdAt = new Date(apt.created_at);
        const diffHrs = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (diffHrs >= 24) {
          apt.status = 'cancelled';
          changedLocal = true;
        }
      }
      return apt;
    });

    if (changedLocal) {
      // Guardar de vuelta en localStorage los datos originales con el estatus actualizado
      const allLocal = JSON.parse(localStorage.getItem('db_appointments') || '[]');
      const updatedLocal = allLocal.map((localApt: any) => {
        const found = procesados.find(a => a.id === localApt.id);
        return found ? { ...localApt, status: found.status } : localApt;
      });
      localStorage.setItem('db_appointments', JSON.stringify(updatedLocal));
    }

    if (role === 'client' && userId) {
      return procesados.filter(apt => apt.client_id === userId);
    }
    if (role === 'admin' && businessId) {
      return procesados.filter(apt => apt.business_id === businessId);
    }
    if (role === 'professional' && businessId && userId) {
      const profilesList = await this.getProfiles();
      const userProfile = profilesList.find(u => u.id === userId);
      const professionalsList = await this.getProfessionals(businessId);
      let userProf = professionalsList.find(p => p.user_id === userId);
      if (!userProf && userProfile) {
        userProf = professionalsList.find(p => p.email && p.email.toLowerCase() === userProfile.email.toLowerCase());
      }
      
      if (userProf) {
        return procesados.filter(apt => apt.business_id === businessId && apt.professional_id === userProf.id);
      } else {
        // Fallback: si no coincide por email o user_id, mostramos todos los del negocio para que pueda atenderlos
        return procesados.filter(apt => apt.business_id === businessId);
      }
    }
    return procesados;
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      created_at: new Date().toISOString(),
      ...appointment
    };

    if (isSupabaseConfigured && supabase && isValidUUID(appointment.business_id) && isValidUUID(appointment.client_id) && isValidUUID(appointment.service_id) && isValidUUID(appointment.professional_id)) {
      try {
        const payload = {
          business_id: appointment.business_id,
          client_id: appointment.client_id,
          service_id: appointment.service_id,
          professional_id: appointment.professional_id,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          notes: appointment.notes,
          status: appointment.status
        };
        const { data, error } = await supabase.from('appointments').insert(payload).select().single();
        if (error) throw error;
        
        // Enviar correo de notificación (servidor)
        try {
          await fetch('/api/notify-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId: data.id })
          });
        } catch (e) {
          console.error('Error enviando notificación:', e);
        }
        
        return data;
      } catch (err) {
        console.warn('Supabase createAppointment fallido, usando local:', err);
      }
    }

    const list = JSON.parse(localStorage.getItem('db_appointments') || '[]');
    list.push(newApt);
    localStorage.setItem('db_appointments', JSON.stringify(list));

    // Simulamos la llamada al endpoint de correo en el frontend para logging
    try {
      await fetch('/api/notify-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment: newApt, isLocalFallback: true })
      });
    } catch (e) {
      console.error('Error llamando notificación de correo fallback:', e);
    }

    return newApt;
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        
        // Enviar correo de confirmación de estatus
        try {
          await fetch('/api/notify-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId: id, statusUpdate: status })
          });
        } catch (e) {
          console.error('Error enviando notificación de estatus:', e);
        }
        
        return data;
      } catch (err) {
        console.warn('Supabase updateAppointmentStatus fallido, usando local:', err);
      }
    }

    const list: Appointment[] = JSON.parse(localStorage.getItem('db_appointments') || '[]');
    const index = list.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Cita no encontrada');
    
    const updated = { ...list[index], status };
    list[index] = updated;
    localStorage.setItem('db_appointments', JSON.stringify(list));

    // Avisar al endpoint para el log
    try {
      await fetch('/api/notify-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment: updated, isLocalFallback: true, statusUpdate: status })
      });
    } catch (e) {
      console.error('Error llamando notificación de correo fallback:', e);
    }

    return updated;
  },

  // --- RESEÑAS ---
  async getReviews(businessId: string): Promise<Review[]> {
    if (isSupabaseConfigured && supabase && isValidUUID(businessId)) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, client:profiles(full_name)')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        
        return (data || []).map(item => ({
          ...item,
          client_name: item.client?.full_name || 'Cliente Verificado'
        }));
      } catch (err) {
        console.warn('Supabase getReviews fallido, usando local:', err);
      }
    }
    const list: Review[] = JSON.parse(localStorage.getItem('db_reviews') || '[]');
    return list.filter(r => r.business_id === businessId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createReview(review: Omit<Review, 'id' | 'created_at' | 'is_verified'>): Promise<Review> {
    const newReview: Review = {
      id: 'rev-' + Date.now(),
      created_at: new Date().toISOString(),
      is_verified: true,
      ...review
    };

    if (isSupabaseConfigured && supabase && isValidUUID(review.business_id) && isValidUUID(review.client_id)) {
      try {
        const payload = {
          business_id: review.business_id,
          client_id: review.client_id,
          client_name: review.client_name,
          rating: review.rating,
          comment: review.comment,
          is_verified: true
        };
        const { data, error } = await supabase.from('reviews').insert(payload).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase createReview fallido, usando local:', err);
      }
    }
    const list = JSON.parse(localStorage.getItem('db_reviews') || '[]');
    list.unshift(newReview);
    localStorage.setItem('db_reviews', JSON.stringify(list));
    return newReview;
  },

  // --- ANALÍTICAS DE NEGOCIO ---
  async getAnalytics(businessId: string): Promise<BusinessAnalytics> {
    try {
      // Al recopilar estadísticas, las calculamos en tiempo real con seguridad
      const appointments = (await this.getAppointments(undefined, undefined, undefined)) || [];
      const bizApts = appointments.filter(a => a && a.business_id === businessId);
      
      const services = (await this.getServices(businessId)) || [];
      const professionals = (await this.getProfessionals(businessId)) || [];
      const reviews = (await this.getReviews(businessId)) || [];

      const totalAppointments = bizApts.length;
      const completedAppointments = bizApts.filter(a => 
        a && (a.status === 'completed' || a.status === 'attended')
      ).length;
      const cancelledAppointments = bizApts.filter(a => a && a.status === 'cancelled').length;

      // Calcular ingresos basados en el precio del servicio contratado cuando se ha completado o atendido
      let totalRevenue = 0;
      bizApts.forEach(a => {
        if (a && (a.status === 'completed' || a.status === 'attended')) {
          const s = services.find(srv => srv && srv.id === a.service_id);
          if (s) {
            totalRevenue += Number(s.price);
          }
        }
      });

      // Calificación promedio
      const avgRating = reviews.length > 0 
        ? Number((reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviews.length).toFixed(1))
        : 5.0;

      // Servicios más populares
      const serviceCounts: Record<string, { count: number; revenue: number }> = {};
      bizApts.forEach(a => {
        if (a) {
          const s = services.find(srv => srv && srv.id === a.service_id);
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

      // Carga de profesionales
      const profCounts: Record<string, number> = {};
      bizApts.forEach(a => {
        if (a) {
          const p = professionals.find(prof => prof && prof.id === a.professional_id);
          if (p) {
            profCounts[p.name] = (profCounts[p.name] || 0) + 1;
          }
        }
      });
      const professionalLoad = Object.entries(profCounts).map(([professionalName, count]) => ({
        professionalName,
        count
      })).sort((a, b) => b.count - a.count);

      // Estado de citas (incluyendo reservado y atendido)
      const statusCounts: Record<string, number> = { pending: 0, reserved: 0, attended: 0, cancelled: 0 };
      bizApts.forEach(a => {
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

  // --- HISTORIAL CLÍNICO / FICHA DEL CLIENTE ---
  async getClientHistory(clientId: string, businessId?: string): Promise<ClientHistoryRecord[]> {
    if (isSupabaseConfigured && supabase && isValidUUID(clientId)) {
      try {
        let query = supabase.from('client_histories').select('*').eq('client_id', clientId).order('consultation_date', { ascending: false });
        if (businessId && isValidUUID(businessId)) {
          query = query.eq('business_id', businessId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getClientHistory fallido, usando local:', err);
      }
    }
    const list: ClientHistoryRecord[] = JSON.parse(localStorage.getItem('db_client_histories') || '[]');
    let filtered = list.filter(item => item.client_id === clientId);
    if (businessId) {
      filtered = filtered.filter(item => item.business_id === businessId);
    }
    return filtered.sort((a, b) => new Date(b.consultation_date).getTime() - new Date(a.consultation_date).getTime());
  },

  async createClientHistory(record: Omit<ClientHistoryRecord, 'id' | 'created_at'>): Promise<ClientHistoryRecord> {
    const newRecord: ClientHistoryRecord = {
      id: 'hist-' + Date.now(),
      created_at: new Date().toISOString(),
      ...record
    };

    if (isSupabaseConfigured && supabase && isValidUUID(record.business_id) && isValidUUID(record.client_id)) {
      try {
        const payload = {
          business_id: record.business_id,
          client_id: record.client_id,
          client_name: record.client_name,
          appointment_id: record.appointment_id && isValidUUID(record.appointment_id) ? record.appointment_id : null,
          consultation_date: record.consultation_date,
          reason: record.reason,
          clinical_picture: record.clinical_picture,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          prescription: record.prescription,
          created_by_name: record.created_by_name
        };
        const { data, error } = await supabase.from('client_histories').insert(payload).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase createClientHistory fallido, usando local:', err);
      }
    }

    const list = JSON.parse(localStorage.getItem('db_client_histories') || '[]');
    list.unshift(newRecord);
    localStorage.setItem('db_client_histories', JSON.stringify(list));
    return newRecord;
  }
};;
