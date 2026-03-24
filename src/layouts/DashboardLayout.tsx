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
  X
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

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#141414] text-[#E4E3E0] px-6 flex items-center justify-between z-[60]">
        <div className="flex items-center gap-2">
          <Scissors className="text-secondary" size={20} />
          <span className="font-serif italic text-lg">BarberFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-[#141414] text-[#E4E3E0] p-6 flex flex-col gap-8 z-50 transition-transform lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2">
          <Scissors className="text-secondary" size={24} />
          <span className="font-serif italic text-xl">BarberFlow</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all",
                isActive ? "bg-secondary text-[#141414]" : "hover:bg-[#E4E3E0]/10 opacity-60 hover:opacity-100"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-[#E4E3E0]/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-[#141414] font-bold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold">{displayName}</p>
              <p className="text-[10px] opacity-50 uppercase tracking-widest">
                {user?.email ?? 'dev@barberflow.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
