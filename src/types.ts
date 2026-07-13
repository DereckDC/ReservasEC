// Definiciones de tipos para la plataforma de gestión de citas

export type UserRole = 'superadmin' | 'admin' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  business_id?: string; // Solo si es admin de un negocio
  phone?: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  logo_url: string;
  cover_url: string;
  phone: string;
  address: string;
  gallery_urls: string[];
  certificates: Certificate[];
  is_visible?: boolean; // Campo para ocultar/mostrar al público la empresa
  google_maps_url?: string; // Enlace a Google Maps para la ubicación
  created_at: string;
}

export interface Certificate {
  title: string;
  institution: string;
  year: string;
  file_url?: string; // Base64 o URL local para PDF/Imagen del certificado
  file_name?: string; // Nombre de archivo original
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  category_id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url?: string;
  image_urls?: string[]; // Hasta 5 fotos del servicio para el catálogo
  created_at: string;
}

export interface Professional {
  id: string;
  business_id: string;
  name: string;
  email?: string;
  specialty: string;
  avatar_url: string;
  work_start_time: string; // "HH:MM"
  work_end_time: string;   // "HH:MM"
  work_days: number[];     // Array de días, ej. [1, 2, 3, 4, 5] (Lunes a Viernes)
  service_ids?: string[];  // IDs de servicios habilitados para este profesional
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  client_id: string;
  service_id: string;
  professional_id: string;
  appointment_date: string; // "YYYY-MM-DD"
  start_time: string;       // "HH:MM"
  end_time: string;         // "HH:MM"
  status: 'pending' | 'reserved' | 'attended' | 'cancelled' | 'confirmed' | 'completed';
  notes?: string;
  created_at: string;
  // Campos cruzados (opcionales para el frontend)
  client_name?: string;
  service_name?: string;
  professional_name?: string;
  business_name?: string;
}

export interface Review {
  id: string;
  business_id: string;
  client_id: string;
  client_name: string;
  rating: number; // 1 to 5
  comment: string;
  is_verified: boolean;
  created_at: string;
}

export interface BusinessAnalytics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  averageRating: number;
  popularServices: { serviceName: string; count: number; revenue: number }[];
  professionalLoad: { professionalName: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
}
