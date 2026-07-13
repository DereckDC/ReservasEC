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
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<string>('catalog');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [superadminSelectedBusinessId, setSuperadminSelectedBusinessId] = useState<string>('biz-1');
  const [routeError, setRouteError] = useState<string | null>(null);

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
    // Intentar leer primero el pathname convencional para URLs limpias (/nombredelnegocio)
    let path = window.location.pathname.replace(/^\/|\/$/g, '');
    
    // Si no hay pathname convencional, caer en el hash para compatibilidad
    if (!path) {
      path = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
    }
    
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

    // Comprobar si es un slug de negocio válido
    const found = bizList.find(b => b.slug === path);
    if (found) {
      setCurrentView(`business:${found.slug}`);
    } else {
      // No es un slug de negocio válido. Abrir el modal de error y redireccionar limpiamente.
      setRouteError(path);
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

  // Escuchar eventos popstate y hashchange para una navegación totalmente sincronizada y fluida
  useEffect(() => {
    const handleNavigationEvent = () => {
      syncRoute(businesses);
    };
    window.addEventListener('popstate', handleNavigationEvent);
    window.addEventListener('hashchange', handleNavigationEvent);
    return () => {
      window.removeEventListener('popstate', handleNavigationEvent);
      window.removeEventListener('hashchange', handleNavigationEvent);
    };
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

    // Sincronizar URL del navegador usando rutas limpias convencionales (sin /#/)
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

      {/* Modal de Alerta de Ruta de Establecimiento Inexistente */}
      <AnimatePresence>
        {routeError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="route-error-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0f1115] border border-[#2d333b] rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-base text-white">Establecimiento No Encontrado</h3>
                <p className="text-xs text-[#e2e8f0]/60 leading-relaxed">
                  El negocio con el identificador <span className="font-mono text-[#c5a059] bg-[#1c2128] px-1.5 py-0.5 rounded border border-[#2d333b]">"{routeError}"</span> no está registrado o no se encuentra activo.
                </p>
              </div>

              <p className="text-[10px] text-[#e2e8f0]/40 bg-[#1c2128]/50 p-2.5 rounded-lg border border-[#2d333b]/50">
                Al presionar aceptar, serás redireccionado al catálogo de negocios de AgendaEC para explorar todos nuestros establecimientos y servicios.
              </p>

              <button
                onClick={() => {
                  setRouteError(null);
                  handleNavigate('catalog');
                }}
                className="w-full bg-[#c5a059] hover:bg-[#b08d4a] active:bg-[#9c7d41] text-[#0f1115] font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[#c5a059]/10"
              >
                Aceptar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
