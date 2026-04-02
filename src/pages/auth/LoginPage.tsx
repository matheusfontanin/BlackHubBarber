import React, { useState } from 'react';
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

    // Dev bypass: Admin / S1234
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
      const error = err instanceof Error ? err : new Error(String(err));
      let message = 'Ocorreu um erro ao acessar sua conta. Tente novamente.';
      if (error.message === 'Invalid login credentials') {
        message = 'Usuário ou senha incorretos. Verifique seus dados e tente novamente.';
      } else if (error.message === 'Email not confirmed') {
        message = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
      } else if ('status' in error && (error as { status: number }).status === 429) {
        message = 'Muitas tentativas de login. Por favor, aguarde um momento.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-appbg flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Scissors size={24} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-heading font-bold text-white mb-1">BlackHub</h1>
          <p className="text-xs text-white/40">Acesse seu painel de controle</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden">
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <User size={12} /> Email ou Usuário
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-primary/8 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm font-medium"
                  placeholder="Admin"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Lock size={12} /> Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-bg border border-primary/8 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm font-medium pr-12"
                    placeholder="••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/20 hover:text-secondary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Entrar <ArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-xs text-primary/30 pt-1">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-secondary font-semibold hover:underline">
                Cadastre sua barbearia
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6 uppercase tracking-[0.15em] font-medium">
          BlackHub Barber &mdash; Powered by AI
        </p>
      </motion.div>
    </div>
  );
}
