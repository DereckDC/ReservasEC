import { createClient } from '@supabase/supabase-js';
import { 
  Business, Profile, Service, Category, Professional, Appointment, Review, BusinessAnalytics, UserRole, Certificate 
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

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Estética y Barbería', description: 'Cuidado personal, cortes, tintes y tratamientos capilares.', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Salud y Bienestar', description: 'Consultas de nutrición, fisioterapia y masajes.', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Asesoría Profesional', description: 'Servicios de consultoría legal, contable y mentoría.', created_at: new Date().toISOString() }
];

const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz-1',
    name: 'Peluquería Estilo & Arte',
    slug: 'estilo-y-arte',
    description: 'Salón de estilismo profesional especializado en cortes modernos, colorimetría y tratamientos capilares de alta calidad.',
    category: 'Estética y Barbería',
    logo_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&h=150&fit=crop',
    cover_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=400&fit=crop',
    phone: '+34 600 123 456',
    address: 'Gran Vía 45, Madrid',
    gallery_urls: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&fit=crop',
      'https://images.unsplash.com/photo-1605497746444-ac9da58480a8?w=500&fit=crop'
    ],
    certificates: [
      { title: 'Master en Estilismo Avanzado', institution: "Academia L'Oréal", year: '2024' },
      { title: 'Diploma de Higiene y Salud Capilar', institution: 'Instituto de Cosmetología', year: '2023' }
    ],
    google_maps_url: 'https://maps.google.com/?q=Gran+Via+45+Madrid',
    created_at: new Date().toISOString()
  },
  {
    id: 'biz-2',
    name: 'FisioVital Clínica',
    slug: 'fisiovital',
    description: 'Clínica especializada en fisioterapia deportiva, rehabilitation y masajes descontracturantes para el bienestar integral.',
    category: 'Salud y Bienestar',
    logo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&h=150&fit=crop',
    cover_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
    phone: '+34 611 987 654',
    address: 'Calle Alcala 120, Madrid',
    gallery_urls: [
      'https://images.unsplash.com/photo-1519826314690-e2213e2f5b8c?w=500&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&fit=crop'
    ],
    certificates: [
      { title: 'Licenciatura en Fisioterapia', institution: 'Universidad Complutense', year: '2021' },
      { title: 'Certificado de Punción Seca', institution: 'Colegio de Fisioterapeutas', year: '2022' }
    ],
    google_maps_url: 'https://maps.google.com/?q=Calle+Alcala+120+Madrid',
    created_at: new Date().toISOString()
  }
];

const INITIAL_SERVICES: Service[] = [
  // Peluquería Estilo & Arte
  { id: 'srv-1', business_id: 'biz-1', category_id: 'cat-1', name: 'Corte de Pelo & Peinado', description: 'Corte personalizado adaptado a tus facciones, lavado con masaje y peinado con acabados profesionales.', duration_minutes: 45, price: 25.00, image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&fit=crop', created_at: new Date().toISOString() },
  { id: 'srv-2', business_id: 'biz-1', category_id: 'cat-1', name: 'Coloración Completa (Tintura)', description: 'Tinte de raíces o completo con productos de alta gama que respetan tu fibra capilar.', duration_minutes: 90, price: 45.00, image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&fit=crop', created_at: new Date().toISOString() },
  { id: 'srv-3', business_id: 'biz-1', category_id: 'cat-1', name: 'Tratamiento de Hidratación Profunda', description: 'Mascarilla intensiva de queratina para devolverle el brillo y la suavidad a tu cabello.', duration_minutes: 30, price: 15.00, image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&fit=crop', created_at: new Date().toISOString() },
  
  // FisioVital
  { id: 'srv-4', business_id: 'biz-2', category_id: 'cat-2', name: 'Sesión de Fisioterapia General', description: 'Evaluación inicial, diagnóstico y tratamiento personalizado de lesiones, contracturas o dolores crónicos.', duration_minutes: 50, price: 40.00, image_url: 'https://images.unsplash.com/photo-1519826314690-e2213e2f5b8c?w=400&fit=crop', created_at: new Date().toISOString() },
  { id: 'srv-5', business_id: 'biz-2', category_id: 'cat-2', name: 'Masaje Descontracturante', description: 'Masaje de espalda y cuello enfocado en aliviar tensiones acumuladas por estrés o posturas.', duration_minutes: 40, price: 35.00, image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&fit=crop', created_at: new Date().toISOString() }
];

const INITIAL_PROFESSIONALS: Professional[] = [
  // Peluquería
  { id: 'prof-1', business_id: 'biz-1', name: 'Carlos Mendoza', email: 'carlos@estiloyarte.com', specialty: 'Estilista Master & Colorista', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', work_start_time: '09:00', work_end_time: '18:00', work_days: [1, 2, 3, 4, 5], service_ids: ['srv-1', 'srv-2', 'srv-3'], created_at: new Date().toISOString() },
  { id: 'prof-2', business_id: 'biz-1', name: 'Ana Gómez', email: 'ana@estiloyarte.com', specialty: 'Cortes Unisex & Barbería', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', work_start_time: '10:00', work_end_time: '20:00', work_days: [2, 3, 4, 5, 6], service_ids: ['srv-1', 'srv-3'], created_at: new Date().toISOString() },
  
  // FisioVital
  { id: 'prof-3', business_id: 'biz-2', name: 'Dra. Elena Ruiz', email: 'elena@fisiovital.com', specialty: 'Fisioterapeuta Osteópata', avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop', work_start_time: '08:00', work_end_time: '16:00', work_days: [1, 2, 3, 4], service_ids: ['srv-4'], created_at: new Date().toISOString() },
  { id: 'prof-4', business_id: 'biz-2', name: 'Lic. Javier Sanz', email: 'javier@fisiovital.com', specialty: 'Masajista & Terapia Deportiva', avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop', work_start_time: '12:00', work_end_time: '21:00', work_days: [1, 2, 3, 4, 5], service_ids: ['srv-4', 'srv-5'], created_at: new Date().toISOString() }
];

const INITIAL_PROFILES: Profile[] = [
  { id: 'user-super', email: 'super@citas.com', full_name: 'Super Administrador Global', role: 'superadmin', created_at: new Date().toISOString() },
  { id: 'user-admin-1', email: 'admin1@citas.com', full_name: 'Admin Peluquería', role: 'admin', business_id: 'biz-1', created_at: new Date().toISOString() },
  { id: 'user-admin-2', email: 'admin2@citas.com', full_name: 'Admin FisioVital', role: 'admin', business_id: 'biz-2', created_at: new Date().toISOString() },
  { id: 'user-client-1', email: 'roomia.admincontact@gmail.com', full_name: 'Usuario Cliente Demo', role: 'client', created_at: new Date().toISOString() }
];

const INITIAL_REVIEWS: Review[] = [
  { id: 'rev-1', business_id: 'biz-1', client_id: 'user-client-1', client_name: 'Usuario Cliente Demo', rating: 5, comment: 'Excelente servicio, muy puntuales y profesionales en su trabajo. Recomiendo el corte de Carlos.', is_verified: true, created_at: new Date().toISOString() },
  { id: 'rev-2', business_id: 'biz-1', client_id: 'user-client-1', client_name: 'Laura Gutiérrez', rating: 4, comment: 'Me encantó el color, muy buena asesoría aunque se demoró un poco más de lo esperado.', is_verified: true, created_at: new Date().toISOString() }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    business_id: 'biz-1',
    client_id: 'user-client-1',
    service_id: 'srv-1',
    professional_id: 'prof-1',
    appointment_date: '2026-07-10',
    start_time: '10:00',
    end_time: '10:45',
    status: 'confirmed',
    notes: 'Corte de puntas solamente.',
    created_at: new Date().toISOString(),
    client_name: 'Usuario Cliente Demo',
    service_name: 'Corte de Pelo & Peinado',
    professional_name: 'Carlos Mendoza',
    business_name: 'Peluquería Estilo & Arte'
  },
  {
    id: 'apt-2',
    business_id: 'biz-2',
    client_id: 'user-client-1',
    service_id: 'srv-4',
    professional_id: 'prof-3',
    appointment_date: '2026-07-12',
    start_time: '11:00',
    end_time: '11:50',
    status: 'pending',
    notes: 'Dolor lumbar severo.',
    created_at: new Date().toISOString(),
    client_name: 'Usuario Cliente Demo',
    service_name: 'Sesión de Fisioterapia General',
    professional_name: 'Dra. Elena Ruiz',
    business_name: 'FisioVital Clínica'
  }
];

// Helper para inicializar el LocalStorage
const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;
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

// ==========================================
// MÉTODOS DE ACCESO A DATOS (SOPORTAN AMBOS MODOS)
// ==========================================

export const db = {
  // --- CATEGORÍAS ---
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
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
      const { data, error } = await supabase.from('categories').insert(category).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = JSON.parse(localStorage.getItem('db_categories') || '[]');
      list.push(newCategory);
      localStorage.setItem('db_categories', JSON.stringify(list));
      return newCategory;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    } else {
      let list: Category[] = JSON.parse(localStorage.getItem('db_categories') || '[]');
      list = list.filter(item => item.id !== id);
      localStorage.setItem('db_categories', JSON.stringify(list));
    }
  },

  // --- NEGOCIOS ---
  async getBusinesses(): Promise<Business[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('businesses').select('*').order('name');
      if (error) throw error;
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('db_businesses') || '[]');
    }
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase.from('businesses').insert(business).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = JSON.parse(localStorage.getItem('db_businesses') || '[]');
      list.push(newBiz);
      localStorage.setItem('db_businesses', JSON.stringify(list));
      return newBiz;
    }
  },

  async updateBusiness(id: string, business: Partial<Business>): Promise<Business> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('businesses').update(business).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const list: Business[] = JSON.parse(localStorage.getItem('db_businesses') || '[]');
      const index = list.findIndex(b => b.id === id);
      if (index === -1) throw new Error('Negocio no encontrado');
      
      const updated = { ...list[index], ...business };
      list[index] = updated;
      localStorage.setItem('db_businesses', JSON.stringify(list));
      return updated;
    }
  },

  async deleteBusiness(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('businesses').delete().eq('id', id);
      if (error) throw error;
    } else {
      const list: Business[] = JSON.parse(localStorage.getItem('db_businesses') || '[]');
      const filtered = list.filter(b => b.id !== id);
      localStorage.setItem('db_businesses', JSON.stringify(filtered));
    }
  },

  // --- SERVICIOS ---
  async getServices(businessId?: string): Promise<Service[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('services').select('*');
      if (businessId) {
        query = query.eq('business_id', businessId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const list: Service[] = JSON.parse(localStorage.getItem('db_services') || '[]');
      if (businessId) {
        return list.filter(s => s.business_id === businessId);
      }
      return list;
    }
  },

  async createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    const newSrv: Service = {
      id: 'srv-' + Date.now(),
      created_at: new Date().toISOString(),
      ...service
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('services').insert(service).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = JSON.parse(localStorage.getItem('db_services') || '[]');
      list.push(newSrv);
      localStorage.setItem('db_services', JSON.stringify(list));
      return newSrv;
    }
  },

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('services').update(service).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const list: Service[] = JSON.parse(localStorage.getItem('db_services') || '[]');
      const index = list.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Servicio no encontrado');
      
      const updated = { ...list[index], ...service };
      list[index] = updated;
      localStorage.setItem('db_services', JSON.stringify(list));
      return updated;
    }
  },

  async deleteService(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    } else {
      let list: Service[] = JSON.parse(localStorage.getItem('db_services') || '[]');
      list = list.filter(s => s.id !== id);
      localStorage.setItem('db_services', JSON.stringify(list));
    }
  },

  // --- PROFESIONALES ---
  async getProfessionals(businessId?: string): Promise<Professional[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('professionals').select('*');
      if (businessId) {
        query = query.eq('business_id', businessId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const list: Professional[] = JSON.parse(localStorage.getItem('db_professionals') || '[]');
      if (businessId) {
        return list.filter(p => p.business_id === businessId);
      }
      return list;
    }
  },

  async createProfessional(professional: Omit<Professional, 'id' | 'created_at'>): Promise<Professional> {
    const newProf: Professional = {
      id: 'prof-' + Date.now(),
      created_at: new Date().toISOString(),
      ...professional
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('professionals').insert(professional).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = JSON.parse(localStorage.getItem('db_professionals') || '[]');
      list.push(newProf);
      localStorage.setItem('db_professionals', JSON.stringify(list));
      return newProf;
    }
  },

  async updateProfessional(id: string, professional: Partial<Professional>): Promise<Professional> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('professionals').update(professional).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const list: Professional[] = JSON.parse(localStorage.getItem('db_professionals') || '[]');
      const index = list.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Profesional no encontrado');
      
      const updated = { ...list[index], ...professional };
      list[index] = updated;
      localStorage.setItem('db_professionals', JSON.stringify(list));
      return updated;
    }
  },

  async deleteProfessional(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
    } else {
      let list: Professional[] = JSON.parse(localStorage.getItem('db_professionals') || '[]');
      list = list.filter(p => p.id !== id);
      localStorage.setItem('db_professionals', JSON.stringify(list));
    }
  },

  // --- PERFILES (USUARIOS) ---
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('db_profiles') || '[]');
    }
  },

  async getProfile(id: string): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const list: Profile[] = JSON.parse(localStorage.getItem('db_profiles') || '[]');
      return list.find(p => p.id === id) || null;
    }
  },

  async updateProfileRole(userId: string, role: UserRole, businessId?: string): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, business_id: businessId || null })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const list: Profile[] = JSON.parse(localStorage.getItem('db_profiles') || '[]');
      const index = list.findIndex(p => p.id === userId);
      if (index === -1) throw new Error('Usuario no encontrado');
      
      const updated = { ...list[index], role, business_id: businessId };
      list[index] = updated;
      localStorage.setItem('db_profiles', JSON.stringify(list));
      return updated;
    }
  },

  async createProfile(profile: Profile): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' }).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = JSON.parse(localStorage.getItem('db_profiles') || '[]');
      if (list.some((p: Profile) => p.id === profile.id)) {
        return profile;
      }
      list.push(profile);
      localStorage.setItem('db_profiles', JSON.stringify(list));
      return profile;
    }
  },

  // --- CITAS ---
  async getAppointments(userId?: string, role?: UserRole, businessId?: string): Promise<Appointment[]> {
    const now = new Date();
    
    if (isSupabaseConfigured && supabase) {
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

      return procesados;
    } else {
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
      return procesados;
    }
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      created_at: new Date().toISOString(),
      ...appointment
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
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
    } else {
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
    }
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    if (isSupabaseConfigured && supabase) {
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
    } else {
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
    }
  },

  // --- RESEÑAS ---
  async getReviews(businessId: string): Promise<Review[]> {
    if (isSupabaseConfigured && supabase) {
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
    } else {
      const list: Review[] = JSON.parse(localStorage.getItem('db_reviews') || '[]');
      return list.filter(r => r.business_id === businessId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createReview(review: Omit<Review, 'id' | 'created_at' | 'is_verified'>): Promise<Review> {
    const newReview: Review = {
      id: 'rev-' + Date.now(),
      created_at: new Date().toISOString(),
      is_verified: true,
      ...review
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('reviews').insert(review).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = JSON.parse(localStorage.getItem('db_reviews') || '[]');
      list.unshift(newReview);
      localStorage.setItem('db_reviews', JSON.stringify(list));
      return newReview;
    }
  },

  // --- ANALÍTICAS DE NEGOCIO ---
  async getAnalytics(businessId: string): Promise<BusinessAnalytics> {
    // Al recopilar estadísticas, las calculamos en tiempo real con seguridad
    const appointments = await this.getAppointments(undefined, undefined, undefined);
    const bizApts = appointments.filter(a => a.business_id === businessId);
    
    const services = await this.getServices(businessId);
    const professionals = await this.getProfessionals(businessId);
    const reviews = await this.getReviews(businessId);

    const totalAppointments = bizApts.length;
    const completedAppointments = bizApts.filter(a => 
      a.status === 'completed' || a.status === 'confirmed' || a.status === 'reserved' || a.status === 'attended'
    ).length;
    const cancelledAppointments = bizApts.filter(a => a.status === 'cancelled').length;

    // Calcular ingresos basados en el precio del servicio contratado
    let totalRevenue = 0;
    bizApts.forEach(a => {
      if (a.status !== 'cancelled') {
        const s = services.find(srv => srv.id === a.service_id);
        if (s) {
          totalRevenue += Number(s.price);
        }
      }
    });

    // Calificación promedio
    const avgRating = reviews.length > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    // Servicios más populares
    const serviceCounts: Record<string, { count: number; revenue: number }> = {};
    bizApts.forEach(a => {
      const s = services.find(srv => srv.id === a.service_id);
      if (s) {
        if (!serviceCounts[s.name]) {
          serviceCounts[s.name] = { count: 0, revenue: 0 };
        }
        serviceCounts[s.name].count += 1;
        if (a.status !== 'cancelled') {
          serviceCounts[s.name].revenue += Number(s.price);
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
      const p = professionals.find(prof => prof.id === a.professional_id);
      if (p) {
        profCounts[p.name] = (profCounts[p.name] || 0) + 1;
      }
    });
    const professionalLoad = Object.entries(profCounts).map(([professionalName, count]) => ({
      professionalName,
      count
    })).sort((a, b) => b.count - a.count);

    // Estado de citas (incluyendo reservado y atendido)
    const statusCounts: Record<string, number> = { pending: 0, reserved: 0, attended: 0, cancelled: 0 };
    bizApts.forEach(a => {
      const mappedStatus = 
        a.status === 'confirmed' ? 'reserved' : 
        a.status === 'completed' ? 'attended' : 
        a.status;
      if (mappedStatus in statusCounts) {
        statusCounts[mappedStatus] = (statusCounts[mappedStatus] || 0) + 1;
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
  }
};
