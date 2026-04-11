import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CalendarPage from '@/pages/calendar/CalendarPage';
import AppointmentsPage from '@/pages/appointments/AppointmentsPage';
import ServicesPage from '@/pages/services/ServicesPage';
import CustomersPage from '@/pages/customers/CustomersPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import ChatPage from '@/pages/chat/ChatPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardLayout from '@/layouts/DashboardLayout';

// Rota protegida: exige autenticação
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isDev } = useAuth();
  if (loading) return null;
  if (!user && !isDev) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Rota protegida que também verifica se o tenant foi criado
function TenantRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isDev } = useAuth();
  const [hasTenant, setHasTenant] = useState<boolean | null>(null);

  useEffect(() => {
    if (isDev) { setHasTenant(true); return; }
    if (!user) { setHasTenant(false); return; }

    supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setHasTenant(!!data?.tenant_id));
  }, [user, isDev]);

  if (loading || hasTenant === null) return null;
  if (!user && !isDev) return <Navigate to="/login" replace />;
  if (!hasTenant) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Onboarding: autenticado mas sem tenant */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Dashboard: autenticado e com tenant */}
          <Route element={<TenantRoute><DashboardLayout /></TenantRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/finance" element={<div className="p-8"><h1 className="text-4xl font-heading font-medium tracking-tight">Financeiro (Em breve)</h1></div>} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
