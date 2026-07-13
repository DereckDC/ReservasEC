import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, User, LogOut, Shield, Briefcase, ChevronDown, Check, Sparkles, Menu, X, Building, TrendingUp, ClipboardList, Settings, Users, FolderTree, Eye, EyeOff } from 'lucide-react';
import { Profile, UserRole, Business } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { db, isSupabaseConfigured, supabase } from '../lib/db';

interface HeaderProps {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  businesses: Business[];
  onNavigate: (view: 'catalog' | 'admin' | 'superadmin' | 'my-appointments' | string) => void;
  currentView: string;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  adminTab: 'analytics' | 'appointments' | 'services' | 'professionals' | 'info';
  setAdminTab: (tab: 'analytics' | 'appointments' | 'services' | 'professionals' | 'info') => void;
  superadminTab: 'dashboard' | 'users' | 'categories' | 'businesses';
  setSuperadminTab: (tab: 'dashboard' | 'users' | 'categories' | 'businesses') => void;
}

export default function Header({ 
  currentUser, 
  setCurrentUser, 
  businesses, 
  onNavigate, 
  currentView,
  showSidebar,
  setShowSidebar,
  adminTab,
  setAdminTab,
  superadminTab,
  setSuperadminTab
}: HeaderProps) {
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedBizForAdmin, setSelectedBizForAdmin] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!showAuthModal) {
      setAuthError(null);
    }
  }, [showAuthModal]);

  // Perfiles de prueba preestablecidos para facilitar la evaluación
  const demoUsers: Profile[] = [
    { id: 'user-super', email: 'super@citas.com', full_name: 'Super Administrador Global', role: 'superadmin', created_at: new Date().toISOString() },
    { id: 'user-admin-1', email: 'admin1@citas.com', full_name: 'Admin Peluquería', role: 'admin', business_id: 'biz-1', created_at: new Date().toISOString() },
    { id: 'user-admin-2', email: 'admin2@citas.com', full_name: 'Admin FisioVital', role: 'admin', business_id: 'biz-2', created_at: new Date().toISOString() },
    { id: 'user-client-1', email: 'roomia.admincontact@gmail.com', full_name: 'Usuario Cliente Demo', role: 'client', created_at: new Date().toISOString() }
  ];

  const handleSwitchRole = (user: Profile) => {
    setCurrentUser(user);
    setShowRoleSwitcher(false);
    
    // Redirigir a vista adecuada según rol
    if (user.role === 'superadmin') {
      onNavigate('superadmin');
    } else if (user.role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('catalog');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setAuthError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        if (authMode === 'login') {
          // Intentar iniciar sesión real en Supabase Auth
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput
          });

          if (authErr) {
            throw authErr;
          }

          if (authData.user) {
            // Obtener el perfil real de public.profiles
            const { data: profile, error: profError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .maybeSingle();

            if (profile) {
              setCurrentUser(profile);
            } else {
              // Si no existe perfil en public.profiles, crearlo ahora con rol cliente por defecto
              const newProfile: Profile = {
                id: authData.user.id,
                email: authData.user.email || emailInput,
                full_name: emailInput.split('@')[0],
                role: 'client',
                created_at: new Date().toISOString()
              };
              const created = await db.createProfile(newProfile);
              setCurrentUser(created);
            }
          }
        } else {
          // Registro en Supabase Auth (Crea nuevo usuario con rol por defecto 'client')
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: emailInput,
            password: passwordInput,
            options: {
              data: {
                full_name: nameInput || emailInput.split('@')[0]
              }
            }
          });

          if (authErr) throw authErr;

          if (authData.user) {
            // El trigger de base de datos 'on_auth_user_created' ya insertó el perfil en public.profiles automáticamente.
            // Para evitar conflictos de RLS o claves duplicadas, consultamos el perfil recién creado o construimos el objeto localmente.
            let profile: Profile | null = null;
            try {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();
              profile = data;
            } catch (fetchErr) {
              console.error('Error al obtener perfil recién creado:', fetchErr);
            }

            const activeProfile: Profile = profile || {
              id: authData.user.id,
              email: emailInput,
              full_name: nameInput || emailInput.split('@')[0],
              role: 'client',
              created_at: new Date().toISOString()
            };

            setCurrentUser(activeProfile);

            // Correo de bienvenida
            try {
              fetch('/api/notify-welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, full_name: activeProfile.full_name, role: 'client' })
              }).catch(errWelcome => console.error('Error enviando correo de bienvenida:', errWelcome));
            } catch (errWelcome) {
              console.error('Error enviando correo de bienvenida:', errWelcome);
            }
          }
        }
        setShowAuthModal(false);
        setEmailInput('');
        setNameInput('');
      } catch (err: any) {
        console.error('Error de autenticación con Supabase:', err);
        setAuthError(err.message || 'Error al autenticar con el servidor');
        return;
      }
    } else {
      setAuthError('Supabase no está configurado correctamente en el entorno.');
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error al cerrar sesión en Supabase:', err);
      }
    }
    setCurrentUser(null);
    onNavigate('catalog');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f1115]/95 backdrop-blur-md border-b border-[#2d333b] shadow-lg" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Botón de Hamburguesa */}
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 -ml-2 rounded-lg text-[#e2e8f0]/80 hover:text-[#c5a059] hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-[#2d333b]"
              title="Abrir Menú de Navegación"
              id="hamburger-menu-btn"
            >
              <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            </button>

            {/* Logo */}
            <div 
              className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer" 
              onClick={() => onNavigate('catalog')}
              id="header-logo-container"
            >
              <div className="bg-[#c5a059] text-[#0f1115] p-1.5 sm:p-2 rounded-lg flex items-center justify-center shadow-md shrink-0">
                <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-display italic font-bold text-base sm:text-xl tracking-tight text-[#c5a059] block">AgendaEC</span>
              </div>
            </div>
          </div>

          {/* Indicador de Usuario o Botón Ingresar (Derecha del Header) */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <button 
                onClick={() => setShowSidebar(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2d333b] hover:border-[#c5a059]/40 bg-white/5 text-xs text-[#e2e8f0]/80 hover:text-[#c5a059] transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#c5a059]/20 flex items-center justify-center text-[#c5a059] font-bold text-[10px] font-mono shrink-0">
                  {currentUser.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-semibold text-[#e2e8f0]/90 truncate max-w-[120px]">{currentUser.full_name}</span>
              </button>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="flex items-center gap-1.5 bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all shadow-md cursor-pointer"
                id="login-trigger-btn"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MENÚ HAMBURGUESA LATERAL (SOBREPUESTO A TODO RENDERIZADO EN PORTAL) */}
      {createPortal(
        <AnimatePresence>
          {showSidebar && (
            <>
              {/* Fondo oscuro overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/75 z-[9998] backdrop-blur-xs cursor-pointer"
                onClick={() => setShowSidebar(false)}
                id="sidebar-overlay"
              />

              {/* Contenedor del Sidebar */}
              <motion.div 
                initial={isMobile ? { y: '-100%', x: 0 } : { x: '-100%', y: 0 }}
                animate={isMobile ? { y: 0, x: 0 } : { x: 0, y: 0 }}
                exit={isMobile ? { y: '-100%', x: 0 } : { x: '-100%', y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className={
                  isMobile 
                    ? "fixed top-0 inset-x-0 w-full max-h-[92vh] bg-[#0f1115] border-b border-[#2d333b] z-[9999] shadow-2xl flex flex-col justify-between rounded-b-2xl overflow-hidden"
                    : "fixed inset-y-0 left-0 w-[320px] h-screen bg-[#0f1115] border-r border-[#2d333b]/80 z-[9999] shadow-2xl flex flex-col justify-between"
                }
                id="sidebar-menu-container"
              >
                {/* Sección Superior: Logo y Botón Cerrar */}
                <div className="p-4 sm:p-5 border-b border-[#2d333b]/80 flex justify-between items-center bg-[#13161c]/30">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#c5a059] text-[#0f1115] p-1.5 rounded-lg flex items-center justify-center shadow-sm">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-display italic font-bold text-lg text-[#c5a059] block">AgendaEC</span>
                      <span className="block text-[8px] font-mono font-bold tracking-widest text-[#c5a059]/60 uppercase">Navegación</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1.5 rounded-lg text-[#e2e8f0]/50 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#2d333b]"
                    title="Cerrar menú"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

              {/* Cuerpo del Sidebar */}
              <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-5 sm:space-y-6 scrollbar-none">
                {/* Card de Usuario Activo o Prompt de Ingreso */}
                {currentUser ? (
                  <div className="bg-[#16191f] border border-[#2d333b]/80 rounded-xl p-3.5 sm:p-4 text-center space-y-1.5 shadow-lg">
                    <span className="block text-xs font-bold text-[#e2e8f0] truncate">{currentUser.full_name}</span>
                    <span className="inline-block bg-[#c5a059]/10 text-[#c5a059] text-[9px] font-bold px-2.5 py-0.5 rounded border border-[#c5a059]/20 uppercase tracking-wide">
                      {currentUser.role}
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#16191f] border border-[#2d333b]/80 rounded-xl p-3.5 sm:p-4 text-center space-y-2.5 shadow-lg">
                    <p className="text-[11px] text-[#e2e8f0]/50">Inicia sesión para gestionar tus citas.</p>
                    <button
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); setShowSidebar(false); }}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all cursor-pointer shadow-md"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Iniciar Sesión</span>
                    </button>
                  </div>
                )}

                {/* Enlaces de Navegación */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[#e2e8f0]/40 uppercase tracking-wider block mb-1 px-1">Navegación Principal</span>
                    
                    <button
                      onClick={() => { onNavigate('catalog'); setShowSidebar(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                        currentView === 'catalog' || currentView.startsWith('business:')
                          ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                          : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <Building className="w-4 h-4 shrink-0 text-[#c5a059]" />
                      <span>Catálogo de Empresas</span>
                    </button>

                    {currentUser && currentUser.role === 'client' && (
                      <button
                        onClick={() => { onNavigate('my-appointments'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'my-appointments'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <Calendar className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Mis Reservas</span>
                      </button>
                    )}
                  </div>

                  {/* Panel de Control de Negocio (Admin) */}
                  {currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                    <div className="space-y-1 pt-3 border-t border-[#2d333b]/40">
                      <span className="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Panel de Negocio</span>
                      </span>

                      <button
                        onClick={() => { onNavigate('admin'); setAdminTab('analytics'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'admin' && adminTab === 'analytics'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Analíticas & Métricas</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('admin'); setAdminTab('appointments'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'admin' && adminTab === 'appointments'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <ClipboardList className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Control de Agenda</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('admin'); setAdminTab('services'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'admin' && adminTab === 'services'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <Briefcase className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Servicios</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('admin'); setAdminTab('professionals'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'admin' && adminTab === 'professionals'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <Users className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Profesionales</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('admin'); setAdminTab('info'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'admin' && adminTab === 'info'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <Settings className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Perfil & Certificados</span>
                      </button>
                    </div>
                  )}

                  {/* Panel Súper Administrador Global */}
                  {currentUser && currentUser.role === 'superadmin' && (
                    <div className="space-y-1 pt-3 border-t border-[#2d333b]/40">
                      <span className="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Administración Global</span>
                      </span>

                      <button
                        onClick={() => { onNavigate('superadmin'); setSuperadminTab('dashboard'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'superadmin' && superadminTab === 'dashboard'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Dashboard General</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('superadmin'); setSuperadminTab('users'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'superadmin' && superadminTab === 'users'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <Users className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Gestión de Roles</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('superadmin'); setSuperadminTab('categories'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'superadmin' && superadminTab === 'categories'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <FolderTree className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Categorías Globales</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('superadmin'); setSuperadminTab('businesses'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-left ${
                          currentView === 'superadmin' && superadminTab === 'businesses'
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-sm'
                            : 'text-[#e2e8f0]/70 hover:text-[#c5a059] hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <Building className="w-4 h-4 shrink-0 text-[#c5a059]" />
                        <span>Alta de Negocios</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer del Sidebar: Botón de Cerrar Sesión abajo del todo */}
              <div className="p-4 border-t border-[#2d333b]/80 bg-[#13161c]/30 text-center">
                {currentUser ? (
                  <button
                    onClick={() => { handleLogout(); setShowSidebar(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-[#e2e8f0]/30 block">AgendaEC Sincronizada</span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Modal de Autenticación Integrado (Formulario Real de Ingreso / Registro) */}
      {showAuthModal && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#16191f] rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-[#2d333b] animate-in zoom-in-95 duration-200">
            <div className="bg-[#0f1115] border-b border-[#2d333b] p-6 text-white">
              <h3 className="font-display italic font-bold text-xl text-[#c5a059]">
                {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h3>
              <p className="text-[#e2e8f0]/60 text-xs mt-1">
                {authMode === 'login' 
                  ? 'Ingresa tu correo para administrar o agendar tus citas.' 
                  : 'Regístrate para mantener un historial seguro de tus reservas.'}
              </p>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-xs text-red-200 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-red-400">
                    <span>⚠️ Error de Autenticación Supabase</span>
                  </p>
                  <p className="font-mono text-[11px] bg-red-950/40 p-2 rounded border border-red-500/20 text-red-300">
                    {authError}
                  </p>
                  
                  {authError.includes('Email not confirmed') && (
                    <div className="pt-2 text-gray-300 space-y-1.5 border-t border-red-500/20">
                      <p className="font-semibold text-amber-400">¿Cómo solucionar esto?</p>
                      <p>
                        Tu proyecto de Supabase tiene activada la confirmación por correo. Puedes:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-gray-300">
                        <li>Ir al panel de tu proyecto de Supabase.</li>
                        <li>Navegar a <strong className="text-white">Authentication &gt; Providers &gt; Email</strong>.</li>
                        <li>Desactivar la opción <strong className="text-white">"Confirm Email"</strong> (Confirmar Correo).</li>
                        <li>O bien, ejecutar el script SQL para crear un Super Admin ya pre-confirmado.</li>
                      </ol>
                    </div>
                  )}

                  {(authError.toLowerCase().includes('invalid login credentials') || authError.toLowerCase().includes('invalid credentials')) && (
                    <div className="pt-2 text-gray-300 space-y-1.5 border-t border-red-500/20">
                      <p className="font-semibold text-amber-400">¿Cómo ingresar por primera vez?</p>
                      <p>
                        Si no has ejecutado el script SQL <strong className="text-white">"supabase_schema.sql"</strong> en el editor de SQL de tu consola de Supabase, las credenciales por defecto no funcionarán.
                      </p>
                      <p className="text-xs text-amber-500/90 font-medium">
                        💡 Solución rápida: Haz clic abajo en <strong className="text-white font-semibold">"Crear Cuenta"</strong> para registrar un usuario de forma instantánea. El rol asignado por defecto será de Cliente.
                      </p>
                    </div>
                  )}

                  {(authError.includes('security purposes') || authError.includes('seconds')) && (
                    <div className="pt-2 text-gray-300 space-y-1 border-t border-red-500/20">
                      <p className="font-semibold text-amber-400">Límite de velocidad de Supabase</p>
                      <p>
                        Has realizado demasiados intentos seguidos. Por favor, espera unos segundos antes de intentar de nuevo.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-[#0f1115] border border-[#2d333b] rounded-lg p-2.5 text-sm text-[#e2e8f0] focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#2d333b] rounded-lg p-2.5 text-sm text-[#e2e8f0] focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#e2e8f0]/80 uppercase mb-1">Contraseña (Mínimo 6 caracteres)</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[#0f1115] border border-[#2d333b] rounded-lg p-2.5 pr-10 text-sm text-[#e2e8f0] focus:ring-2 focus:ring-[#c5a059] focus:outline-none placeholder-[#e2e8f0]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer select-none"
                    id="toggle-password-visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-[#e2e8f0]/50 hover:text-[#c5a059]" />
                    ) : (
                      <Eye className="w-4 h-4 text-[#e2e8f0]/50 hover:text-[#c5a059]" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#c5a059] hover:bg-[#b08d4a] text-[#0f1115] font-bold uppercase tracking-wider text-xs py-2.5 rounded-lg transition-colors mt-2 shadow-md"
              >
                {authMode === 'login' ? 'Entrar' : 'Registrar Cuenta'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-[#c5a059] hover:underline font-medium"
                >
                  {authMode === 'login' 
                    ? '¿No tienes cuenta? Regístrate aquí' 
                    : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>
            </form>
            
            <div className="bg-[#0f1115] px-6 py-3.5 border-t border-[#2d333b] flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs font-semibold text-[#e2e8f0]/60 hover:text-[#e2e8f0] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
