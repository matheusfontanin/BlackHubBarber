import { useState } from 'react';
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
  ChevronLeft,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut, isDev } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = user?.user_metadata?.full_name ?? (isDev ? 'Admin Dev' : 'Usuário');
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
    { icon: MessageSquare, label: 'Atendimento IA', path: '/ia' },
    { icon: DollarSign, label: 'Financeiro', path: '/finance' },
  ];

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-72';
  const mainPadding = isCollapsed ? 'lg:pl-20' : 'lg:pl-72';

  return (
    <div className="min-h-screen bg-bg font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-primary/5 px-6 flex items-center justify-between z-[60]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Scissors className="text-secondary" size={16} />
          </div>
          <span className="font-serif italic text-lg text-primary">BlackHub</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-primary/5 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-primary/40 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-primary/5 flex flex-col z-50 transition-all duration-300 lg:translate-x-0",
        sidebarWidth,
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-primary/5 shrink-0",
          isCollapsed ? "justify-center px-2" : "px-6 justify-between"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Scissors className="text-secondary" size={18} />
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-serif italic text-lg text-primary leading-none">BlackHub</span>
                <p className="text-[9px] uppercase tracking-[0.15em] text-primary/40 font-bold">Barber</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:flex p-1.5 hover:bg-primary/5 rounded-lg transition-colors text-primary/30 hover:text-primary/60"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="hidden lg:flex mx-auto mb-3 p-1.5 hover:bg-primary/5 rounded-lg transition-colors text-primary/30 hover:text-primary/60"
            >
              <ChevronLeft size={16} className="rotate-180" />
            </button>
          )}
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl text-sm font-semibold transition-all group relative",
                isCollapsed ? "justify-center p-3" : "px-4 py-3",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-primary/50 hover:text-primary hover:bg-primary/5"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!isCollapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={cn("border-t border-primary/5 p-3 space-y-2", isCollapsed && "px-2")}>
          {/* Settings link */}
          <button className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-semibold text-primary/40 hover:text-primary hover:bg-primary/5 transition-all w-full",
            isCollapsed ? "justify-center p-3" : "px-4 py-2.5"
          )}>
            <Settings size={18} className="shrink-0" />
            {!isCollapsed && 'Configurações'}
          </button>

          {/* User profile */}
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-primary/[0.03]",
            isCollapsed && "justify-center"
          )}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary truncate">{displayName}</p>
                <p className="text-[10px] text-primary/40 truncate">
                  {user?.email ?? 'dev@blackhub.com'}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleSignOut}
                title="Sair"
                className="p-1.5 text-primary/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("pt-16 lg:pt-0 min-h-screen transition-all duration-300", mainPadding)}>
        {/* Top bar */}
        <div className="hidden lg:flex h-16 items-center justify-end gap-3 px-8 border-b border-primary/5 bg-white/60 backdrop-blur-md sticky top-0 z-30">
          <button className="relative p-2.5 hover:bg-primary/5 rounded-xl transition-colors text-primary/40 hover:text-primary">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
          </button>
          <div className="w-px h-6 bg-primary/10" />
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-semibold text-primary">{displayName}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
