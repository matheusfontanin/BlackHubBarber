import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  DollarSign,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, isDev } = useAuth();
  const navigate = useNavigate();

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
    { icon: Users, label: 'Clientes', path: '/customers' },
    { icon: Scissors, label: 'Serviços', path: '/services' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Config', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-appbg font-sans text-primary">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar px-4 flex items-center justify-between z-[60] border-b border-border">
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Scissors size={13} className="text-gold" />
          </div>
          <span className="font-heading font-bold text-base text-primary italic">BlackHub</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-muted hover:text-primary rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-sidebar flex flex-col z-50 transition-all duration-300 lg:translate-x-0",
        "w-[88px] pt-14 lg:pt-0",
        "border-r border-border",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="hidden lg:flex h-[72px] items-center justify-center shrink-0 border-b border-border">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center shadow-[0_0_12px_rgba(201,168,76,0.15)]">
              <Scissors size={16} className="text-gold" />
            </div>
            <span className="text-[9px] font-heading font-bold text-gold/70 uppercase tracking-[0.18em]">
              BlackHub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 py-4 px-2.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl w-full transition-all duration-200 group relative",
                isActive
                  ? "text-sidebar"
                  : "text-muted hover:text-primary"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-gold text-sidebar shadow-[0_2px_12px_rgba(201,168,76,0.4)]"
                      : "group-hover:bg-white/[0.06]"
                  )}>
                    <item.icon size={18} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors",
                    isActive ? "text-gold" : "text-muted group-hover:text-primary/70"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-0.5 px-2.5 pb-4 border-t border-border pt-4">
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl w-full transition-all duration-200 group",
                isActive ? "text-sidebar" : "text-muted hover:text-primary"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-gold text-sidebar shadow-[0_2px_12px_rgba(201,168,76,0.4)]"
                      : "group-hover:bg-white/[0.06]"
                  )}>
                    <item.icon size={18} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors",
                    isActive ? "text-gold" : "text-muted group-hover:text-primary/70"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* User avatar */}
          <div className="mt-2 flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center text-[11px] font-bold text-gold">
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              title="Sair"
              className="text-[9px] uppercase tracking-[0.1em] font-semibold text-faint hover:text-error transition-all flex items-center gap-1"
            >
              <LogOut size={10} /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-14 lg:pt-0 min-h-screen lg:pl-[88px] flex flex-col">
        <div className="flex-1 bg-bg overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
