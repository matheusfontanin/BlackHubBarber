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
    <div className="min-h-screen bg-appbg font-sans text-primary">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-appbg border-b border-white/10 px-6 flex items-center justify-between z-[60]">
        <div className="flex items-center gap-3 text-white">
          <div className="w-8 h-8 rounded-full border-2 border-white flex flex-wrap gap-0.5 items-center justify-center p-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
          </div>
          <span className="font-heading font-bold text-lg tracking-wide">Circle</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-primary/40 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-appbg flex flex-col z-50 transition-all duration-300 lg:translate-x-0 pt-16 lg:pt-0",
        sidebarWidth,
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className={cn(
          "hidden lg:flex h-24 items-center shrink-0",
          isCollapsed ? "justify-center px-2" : "px-8 justify-between"
        )}>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full border-2 border-white flex flex-wrap gap-0.5 items-center justify-center p-1.5 shrink-0">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
              <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            </div>
            {!isCollapsed && (
              <span className="font-heading font-bold text-xl tracking-wide">Circle</span>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-2 overflow-y-auto">
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="hidden lg:flex mx-auto mb-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
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
                "flex flex-col items-center justify-center gap-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all group relative",
                isCollapsed ? "p-3" : "py-4",
                isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn("p-2.5 rounded-full transition-all", isActive ? "bg-white text-appbg" : "text-white group-hover:bg-white/10")}>
                    <item.icon size={20} className="shrink-0" />
                  </div>
                  {!isCollapsed && item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={cn("p-3 space-y-4 pb-6", isCollapsed && "px-2 flex flex-col items-center")}>
          {/* Settings link */}
          <NavLink
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all w-full group",
              isCollapsed ? "p-3" : "py-2.5",
              isActive ? "text-white" : "text-white/40 hover:text-white"
            )}
          >
             {({ isActive }) => (
                <>
                  <div className={cn("p-2.5 rounded-full transition-all", isActive ? "bg-white text-appbg" : "text-white group-hover:bg-white/10")}>
                    <Settings size={20} className="shrink-0" />
                  </div>
                  {!isCollapsed && 'Config'}
                </>
              )}
          </NavLink>

          {/* User profile */}
          <div className={cn(
            "flex flex-col items-center gap-2",
            isCollapsed && "justify-center"
          )}>
            <div className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center font-bold shrink-0">
              {initials}
            </div>
            {!isCollapsed && (
              <button
                onClick={handleSignOut}
                title="Sair"
                className="mt-2 text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-all flex items-center gap-1"
              >
                <LogOut size={12} /> Sair
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area in an inner container */}
      <main className={cn("pt-16 lg:pt-0 min-h-screen transition-all duration-300 flex flex-col", mainPadding)}>
        {/* Top bar (Like the reference INSIGHTS, CHANNELS) */}
        <div className="hidden lg:flex shrink-0 h-24 items-center gap-8 px-10 text-white">
           <button className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-full bg-white text-appbg flex items-center justify-center">
                 <ChevronLeft size={16} />
              </div>
              Back
           </button>
           <nav className="flex-1 flex justify-center gap-10">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase">Dashboard</span>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 cursor-pointer transition-opacity">Insights</span>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 cursor-pointer transition-opacity">Channels</span>
           </nav>
           <div className="flex items-center gap-4 border-l border-white/20 pl-8">
              <div className="flex -space-x-2">
                 <div className="w-8 h-8 rounded-full border-2 border-appbg bg-secondary flex items-center justify-center text-[10px] font-bold">1</div>
                 <div className="w-8 h-8 rounded-full border-2 border-appbg bg-teal-400 flex items-center justify-center text-[10px] font-bold">2</div>
                 <div className="w-8 h-8 rounded-full border-2 border-appbg bg-amber-400 flex items-center justify-center text-[10px] font-bold">3</div>
              </div>
              <span className="text-xs font-semibold">12 members</span>
           </div>
        </div>
        
        {/* White Rounded Container for Outlet */}
        <div className="flex-1 bg-bg rounded-tl-3xl lg:rounded-tr-3xl lg:mr-6 lg:mb-6 overflow-hidden flex flex-col shadow-2xl relative">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
