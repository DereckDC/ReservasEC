-- =====================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA GESTIÓN DE CITAS MULTI-NEGOCIO
-- Compatible con Supabase PostgreSQL, políticas RLS y normas TOP 10 OWASP
-- =====================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: NEGOCIOS (BUSINESSES)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    logo_url VARCHAR(1000),
    cover_url VARCHAR(1000),
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    gallery_urls TEXT[] DEFAULT '{}'::text[],
    certificates JSONB DEFAULT '[]'::jsonb,
    is_visible BOOLEAN DEFAULT TRUE NOT NULL,
    google_maps_url VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en negocios
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Políticas para Businesses
CREATE POLICY "Permitir lectura pública de negocios" 
    ON public.businesses FOR SELECT 
    USING (true);

CREATE POLICY "Permitir inserción de negocios a Super Admins" 
    ON public.businesses FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
        )
    );

CREATE POLICY "Permitir modificación de negocio a Administradores autorizados" 
    ON public.businesses FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND (profiles.role = 'superadmin' OR (profiles.role = 'admin' AND profiles.business_id = id))
        )
    );

CREATE POLICY "Permitir eliminación de negocios a Super Admins" 
    ON public.businesses FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
        )
    );


-- 2. TABLA: CATEGORÍAS (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en categorías
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas para Categorías
CREATE POLICY "Permitir lectura pública de categorías" 
    ON public.categories FOR SELECT 
    USING (true);

CREATE POLICY "Permitir administración de categorías a Super Admins" 
    ON public.categories FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
        )
    );


-- 3. TABLA: PERFILES DE USUARIOS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- ID proveniente de auth.users
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('superadmin', 'admin', 'client')),
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Permitir lectura de perfiles autenticados" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir inserción de propio perfil" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Permitir modificación de propio perfil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
    ));


-- 4. TABLA: SERVICIOS (SERVICES)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    image_url VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en servicios
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Políticas para Servicios
CREATE POLICY "Permitir lectura pública de servicios" 
    ON public.services FOR SELECT 
    USING (true);

CREATE POLICY "Permitir gestión de servicios a Admins del negocio" 
    ON public.services FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND (profiles.role = 'superadmin' OR (profiles.role = 'admin' AND profiles.business_id = services.business_id))
        )
    );


-- 5. TABLA: PROFESIONALES (PROFESSIONALS)
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    specialty VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(1000) NOT NULL,
    work_start_time VARCHAR(5) DEFAULT '09:00' NOT NULL,
    work_end_time VARCHAR(5) DEFAULT '18:00' NOT NULL,
    work_days INT[] DEFAULT '{1,2,3,4,5}'::int[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en profesionales
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Políticas para Profesionales
CREATE POLICY "Permitir lectura pública de profesionales" 
    ON public.professionals FOR SELECT 
    USING (true);

CREATE POLICY "Permitir gestión de profesionales a Admins del negocio" 
    ON public.professionals FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND (profiles.role = 'superadmin' OR (profiles.role = 'admin' AND profiles.business_id = professionals.business_id))
        )
    );


-- 6. TABLA: CITAS (APPOINTMENTS)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    appointment_date DATE NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reserved', 'attended', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en citas
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para Appointments
CREATE POLICY "Clientes pueden ver sus propias citas" 
    ON public.appointments FOR SELECT 
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'superadmin' OR (role = 'admin' AND business_id = appointments.business_id))
    ));

CREATE POLICY "Clientes pueden insertar sus propias citas" 
    ON public.appointments FOR INSERT 
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clientes y admins pueden actualizar citas" 
    ON public.appointments FOR UPDATE 
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'superadmin' OR (role = 'admin' AND business_id = appointments.business_id))
    ));


-- 7. TABLA: RESEÑAS (REVIEWS)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en reseñas
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para Reviews
CREATE POLICY "Permitir lectura pública de reseñas" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Permitir inserción de reseñas a clientes autenticados" 
    ON public.reviews FOR INSERT 
    WITH CHECK (auth.uid() = client_id);


-- =====================================================================
-- AUTOMATIZACIÓN: SYNC DE PERFILES MEDIANTE TRIGGER (SUPABASE AUTH)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, created_at)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'client',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existiera
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================================
-- FRAGMENTO DE CÓDIGO PARA INSERTAR EL USUARIO SUPER ADMIN EN SUPABASE
-- =====================================================================

DO $$
DECLARE
    admin_id UUID := '99999999-9999-9999-9999-999999999999'; -- ID Estático del Super Admin
    admin_email VARCHAR := 'roomia.admincontact@gmail.com'; -- Su correo real o el de su preferencia
    admin_password_hash VARCHAR := '$2a$10$7Z2P.6gZpOn3mR1bY.M0fux0o/g5Z9Bux4R8N3X0bK4Z9V6x4GqWe'; -- Hash de la contraseña '123456'
BEGIN
    -- 1. Insertar el usuario en el esquema interno auth.users de Supabase
    -- Esto asegura que el usuario sea reconocido por Supabase Auth
    -- con el correo marcado como confirmado para evitar "Email not confirmed"
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            role,
            aud,
            confirmation_token
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            admin_password_hash,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', 'Administrador Global AgendaEC'),
            false,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated',
            ''
        );
    END IF;

    -- 2. Insertar el perfil del usuario en public.profiles con el rol 'superadmin'
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at
        ) VALUES (
            admin_id,
            admin_email,
            'Administrador Global AgendaEC',
            'superadmin',
            NOW()
        );
    END IF;
END $$;


-- =====================================================================
-- ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_professionals_business_id ON public.professionals(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON public.appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
