import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Loader2, Wifi, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { CalendarStepData } from '@/types/onboarding';

interface CalendarStepProps {
  onNext: (data?: CalendarStepData) => void;
  onBack: () => void;
}

export default function CalendarStep({ onNext, onBack }: CalendarStepProps) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detecta retorno do OAuth via query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_success') === '1') {
      setConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('calendar_error') === '1') {
      setError('Erro ao conectar com o Google. Tente novamente.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/google-calendar-oauth?action=auth-url`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();
      if (!data.url) throw new Error(data.error || 'Erro ao gerar URL de autorização');

      // Redireciona para o Google OAuth
      window.location.href = data.url;
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Erro ao conectar com o Google Calendar.';
      setError(error);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-serif text-primary">Sincronizar Agenda</h2>
        <p className="text-primary/60">Conecte seu Google Calendar para evitar conflitos de horário.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <p className="text-sm text-primary/70 leading-relaxed">
            O BlackHub Barber lê sua disponibilidade em tempo real e insere novos agendamentos automaticamente na sua agenda pessoal ou profissional.
          </p>

          <div className="space-y-3">
            {[
              'Sincronização bidirecional',
              'Bloqueio automático de horários ocupados',
              'Notificações de novos agendamentos',
            ].map(benefit => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-primary/80">
                <CheckCircle2 size={18} className="text-secondary shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-10 bg-white border border-primary/10 rounded-2xl shadow-sm space-y-6">
          {connected ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Wifi className="text-green-600" size={32} />
              </div>
              <p className="font-bold text-green-700">Google Calendar conectado!</p>
              <p className="text-xs text-primary/50">Seus agendamentos serão sincronizados automaticamente.</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-primary/[0.02] border border-primary/5 rounded-2xl flex items-center justify-center text-primary/20">
                <Calendar size={40} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-primary/10 text-primary font-bold py-4 rounded-lg hover:bg-primary/[0.02] transition-all shadow-sm disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="animate-spin" size={18} />
                  : <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                }
                {loading ? 'Aguardando...' : 'Conectar com Google'}
              </button>

              <p className="text-[10px] text-center text-primary/40 leading-tight">
                Ao conectar, você concorda com nossos termos de serviço e política de privacidade.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="pt-8 flex items-center justify-between">
        <button onClick={onBack} className="text-primary/50 font-bold hover:text-primary transition-colors">
          Voltar
        </button>
        <div className="flex items-center gap-4">
          {!connected && (
            <button onClick={() => onNext()} className="text-primary/30 text-xs font-bold hover:text-primary transition-colors">
              Pular por enquanto
            </button>
          )}
          <button
            onClick={() => onNext({ googleCalendarConnected: connected })}
            className="bg-secondary text-primary font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95"
          >
            Continuar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
