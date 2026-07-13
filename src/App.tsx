import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Catalog from './components/Catalog';
import BusinessDetail from './components/BusinessDetail';
import AdminPanel from './components/AdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import ClientAppointments from './components/ClientAppointments';
import { db, isSupabaseConfigured } from './lib/db';
import { Profile, Business } from './types';
import { AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<string>('catalog');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [superadminSelectedBusinessId, setSuperadminSelectedBusinessId] = useState<string>('biz-1');

  // Estados de Navegación del Sidebar y Tablas Internas
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'analytics' | 'appointments' | 'services' | 'professionals' | 'info'>('analytics');
  const [superadminTab, setSuperadminTab] = useState<'dashboard' | 'users' | 'categories' | 'businesses'>('dashboard');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const syncRoute = (bizList: Business[]) => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    
    if (!path || path === 'catalog') {
      setCurrentView('catalog');
      return;
    }
    
    if (path === 'admin') {
      setCurrentView('admin');
      return;
    }
    
    if (path === 'superadmin') {
      setCurrentView('superadmin');
      return;
    }
    
    if (path === 'my-appointments') {
      setCurrentView('my-appointments');
      return;
    }

    // Is it a business slug?
    const found = bizList.find(b => b.slug === path);
    if (found) {
      setCurrentView(`business:${found.slug}`);
    } else {
      // Not a valid business slug
      alert(`¡Establecimiento no encontrado!\nEl negocio con el identificador "${path}" no existe en nuestra red. Serás redireccionado al catálogo principal.`);
      window.history.replaceState({ view: 'catalog' }, '', '/');
      setCurrentView('catalog');
    }
  };

  // Inicializar cargando negocios para la cabecera / ruteo general
  const loadInitialState = async () => {
    try {
      setLoading(true);
      const bizList = await db.getBusinesses();
      setBusinesses(bizList);

      // Asignar un usuario por defecto si no hay ninguno activo para facilitar la navegación del evaluador
      const savedUser = localStorage.getItem('sincrocitas_current_user');
      const wasLoggedOut = localStorage.getItem('sincrocitas_logged_out') === 'true';
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else if (!wasLoggedOut) {
        // Por defecto, cliente demo para iniciar de inmediato de forma interactiva (solo si no cerró sesión explícitamente)
        const profiles = await db.getProfiles();
        const demoClient = profiles.find(p => p.role === 'client');
        if (demoClient) {
          setCurrentUser(demoClient);
        }
      }

      // Sincronizar ruta inicial con la lista cargada
      syncRoute(bizList);
    } catch (err) {
      console.error('Error al inicializar aplicación:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialState();
  }, []);

  // Escuchar el evento popstate para la navegación con botones atrás/adelante del navegador
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        syncRoute(businesses);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [businesses]);

  // Guardar usuario activo en localstorage para persistencia de sesión ligera
  const handleSetCurrentUser = (user: Profile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('sincrocitas_current_user', JSON.stringify(user));
      localStorage.removeItem('sincrocitas_logged_out');
    } else {
      localStorage.removeItem('sincrocitas_current_user');
      localStorage.setItem('sincrocitas_logged_out', 'true');
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sincronizar URL del navegador
    let newPath = '/';
    if (view === 'catalog') {
      newPath = '/';
    } else if (view === 'admin') {
      newPath = '/admin';
    } else if (view === 'superadmin') {
      newPath = '/superadmin';
    } else if (view === 'my-appointments') {
      newPath = '/my-appointments';
    } else if (view.startsWith('business:')) {
      const slug = view.split(':')[1];
      newPath = `/${slug}`;
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState({ view }, '', newPath);
    }
  };

  const sidebarOpenOffsetClass = (showSidebar && !isMobile) ? "sm:pl-[320px]" : "pl-0";

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans antialiased transition-all duration-300 ease-in-out ${sidebarOpenOffsetClass}`} id="app-root-container">
      {/* Header General */}
      <Header 
        currentUser={currentUser}
        setCurrentUser={handleSetCurrentUser}
        businesses={businesses}
        onNavigate={handleNavigate}
        currentView={currentView}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        superadminTab={superadminTab}
        setSuperadminTab={setSuperadminTab}
      />

      {/* Enrutador de Contenido Principal */}
      <main className="flex-grow pb-16">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 py-24 text-center">
            <span className="font-mono text-xs text-slate-400">Iniciando motor de sincronización de citas...</span>
          </div>
        ) : (
          <>
            {/* VISTA: CATÁLOGO / DIRECTORIO */}
            {currentView === 'catalog' && (
              <Catalog 
                onSelectBusiness={(slug) => handleNavigate(`business:${slug}`)}
              />
            )}

            {/* VISTA: DETALLES DE UN NEGOCIO */}
            {currentView.startsWith('business:') && (
              <BusinessDetail 
                slug={currentView.split(':')[1]}
                currentUser={currentUser}
                onBack={() => handleNavigate('catalog')}
                onRequireAuth={() => {
                  // Forzar el click en el botón de login del header abriendo el modal integrado
                  const loginBtn = document.getElementById('login-trigger-btn');
                  if (loginBtn) {
                    loginBtn.click();
                  } else {
                    alert('Por favor, inicia sesión o crea una cuenta en la esquina superior derecha para agendar tu cita.');
                  }
                }}
                onSuccessBooking={() => handleNavigate('my-appointments')}
              />
            )}

            {/* VISTA: MIS RESERVAS (CLIENTE) */}
            {currentView === 'my-appointments' && currentUser && (
              <ClientAppointments 
                currentUser={currentUser}
                onNavigateBack={() => handleNavigate('catalog')}
              />
            )}

            {/* VISTA: PANEL DE ADMINISTRADOR DE NEGOCIO */}
            {currentView === 'admin' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
              <AdminPanel 
                businessId={currentUser.role === 'superadmin' ? superadminSelectedBusinessId : (currentUser.business_id || 'biz-1')}
                currentUser={currentUser}
                onNavigateBack={() => handleNavigate('catalog')}
                activeTab={adminTab}
                setActiveTab={setAdminTab}
                onChangeBusinessId={(id) => setSuperadminSelectedBusinessId(id)}
              />
            )}

            {/* CONTROL DE SEGURIDAD EXCESO DE PRIVILEGIO */}
            {currentView === 'admin' && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) && (
              <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
                <h2 className="font-display font-bold text-xl text-slate-900">Acceso Denegado</h2>
                <p className="text-xs text-slate-500">No cuentas con privilegios de Administrador de Negocio ni Súper Administrador. Usa el simulador en la cabecera para cambiar tu rol.</p>
                <button onClick={() => handleNavigate('catalog')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                  Ir al Inicio
                </button>
              </div>
            )}

            {/* VISTA: SUPER ADMINISTRADOR GLOBAL */}
            {currentView === 'superadmin' && currentUser && currentUser.role === 'superadmin' && (
              <SuperAdminPanel 
                onNavigateBack={() => handleNavigate('catalog')}
                activeTab={superadminTab}
                setActiveTab={setSuperadminTab}
              />
            )}

            {/* CONTROL DE SEGURIDAD EXCESO DE PRIVILEGIO SUPERADMIN */}
            {currentView === 'superadmin' && (!currentUser || currentUser.role !== 'superadmin') && (
              <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
                <h2 className="font-display font-bold text-xl text-slate-900">Acceso Denegado</h2>
                <p className="text-xs text-slate-500">No cuentas con privilegios de Súper Administrador Global. Usa el simulador en la cabecera para cambiar tu rol.</p>
                <button onClick={() => handleNavigate('catalog')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                  Ir al Inicio
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer Minimalista */}
      <footer className="bg-white border-t border-slate-200 py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
          <p className="text-xs text-black font-bold text-center">
            &copy; 2026 AgendaEC - Maqyasoft
          </p>
        </div>
      </footer>
    </div>
  );
}
