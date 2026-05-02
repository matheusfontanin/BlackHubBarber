import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Scissors,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { getTenantLogo } from '@/services/settingsService';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { user, signOut, isDev } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    getTenantLogo(tenantId).then(url => { if (active) setLogoUrl(url); }).catch(() => {});
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setLogoUrl(detail ?? null);
    };
    window.addEventListener('tenant-logo-updated', handler);
    return () => {
      active = false;
      window.removeEventListener('tenant-logo-updated', handler);
    };
  }, [tenantId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = user?.user_metadata?.full_name ?? (isDev ? 'Admin' : 'Usuário');
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Agenda', path: '/calendar' },
    { icon: ClipboardList, label: 'Atendim.', path: '/appointments' },
    { icon: Users, label: 'Clientes', path: '/customers' },
    { icon: Scissors, label: 'Serviços', path: '/services' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Config', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-app font-sans text-ink">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar px-4 flex items-center justify-between z-[60] border-b border-[#201B17]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#BE9B64]/15 border border-[#BE9B64]/30 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Scissors size={14} className="text-[#BE9B64]" />
            )}
          </div>
          <span className="font-semibold text-base text-white">BlackHub</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#A39F9D] hover:text-white rounded-lg transition-colors"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#12100D]/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar flex flex-col z-50 transition-transform duration-300 lg:translate-x-0',
          'w-[88px] pt-14 lg:pt-0',
          'border-r border-[#201B17]',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="hidden lg:flex h-[72px] items-center justify-center shrink-0 border-b border-[#201B17]">
          <div className="w-11 h-11 rounded-xl bg-[#BE9B64]/15 border border-[#BE9B64]/30 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Scissors size={18} className="text-[#BE9B64]" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-5 px-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full"
            >
              {({ isActive }) => (
                <div
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 rounded-xl w-full transition-colors',
                    isActive ? 'bg-[#1B1815]' : 'hover:bg-white/[0.04]'
                  )}
                >
                  <item.icon
                    size={20}
                    className={cn('transition-colors', isActive ? 'text-[#BE9B64]' : 'text-[#A39F9D]')}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-colors',
                      isActive ? 'text-white' : 'text-[#A39F9D]'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-1 px-3 pb-5 border-t border-[#201B17] pt-4">
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full"
            >
              {({ isActive }) => (
                <div
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 rounded-xl w-full transition-colors',
                    isActive ? 'bg-[#1B1815]' : 'hover:bg-white/[0.04]'
                  )}
                >
                  <item.icon
                    size={20}
                    className={cn(isActive ? 'text-[#BE9B64]' : 'text-[#A39F9D]')}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      isActive ? 'text-white' : 'text-[#A39F9D]'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}

          {/* User avatar */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#BE9B64]/20 text-[#BE9B64] flex items-center justify-center text-[11px] font-semibold">
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              title="Sair"
              aria-label="Sair"
              className="text-[#A39F9D] hover:text-white transition-colors p-1.5"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-14 lg:pt-0 min-h-screen lg:pl-[88px] bg-app">
        <Outlet />
      </main>
    </div>
  );
}
