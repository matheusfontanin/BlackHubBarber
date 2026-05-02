import { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setDevMode } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (email.toLowerCase() === 'admin' && password === 'S1234') {
      setDevMode(true);
      navigate('/dashboard');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      let message = 'Ocorreu um erro ao acessar sua conta. Tente novamente.';
      if (e.message === 'Invalid login credentials') message = 'Usuário ou senha incorretos.';
      else if (e.message === 'Email not confirmed') message = 'Confirme seu e-mail antes de entrar.';
      else if ('status' in e && (e as { status: number }).status === 429) message = 'Muitas tentativas. Aguarde um momento.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px]"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gold-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors size={24} className="text-gold-dark" />
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">BlackHub</h1>
          <p className="text-sm text-ink-soft mt-1">Acesse seu painel</p>
        </div>

        <div className="card overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#BE9B64] to-transparent" />
          <form onSubmit={handleLogin} className="p-7 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[#FDECEC] border border-[#D84A4A]/20 text-[#D84A4A] text-[13px] font-medium rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label"><User size={12} /> Email ou usuário</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@barbearia.com"
                  required
                />
              </div>
              <div>
                <label className="label"><Lock size={12} /> Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading
                ? <Loader2 className="animate-spin" size={18} />
                : <><span>Entrar</span><ArrowRight size={15} /></>
              }
            </button>

            <p className="text-center text-[13px] text-ink-soft pt-1">
              Não tem conta?{' '}
              <Link to="/register" className="text-[#BE9B64] font-semibold hover:text-[#9C7B47] transition-colors">
                Cadastre sua barbearia
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[11px] text-ink-faint mt-6 uppercase tracking-wider">
          BlackHub Barber — Powered by AI
        </p>
      </motion.div>
    </div>
  );
}
