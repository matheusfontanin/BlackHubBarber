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

    // Dev Login Bypass (apenas em desenvolvimento local)
    if (import.meta.env.DEV && email === 'admin' && password === '1234') {
      setDevMode(true);
      navigate('/dashboard');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Login error:', error);
      
      // Improved error messages in Portuguese
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
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#141414]/5 overflow-hidden"
      >
        <div className="bg-[#141414] p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-[#141414]">
            <Scissors size={32} />
          </div>
          <h1 className="text-2xl font-serif italic text-[#E4E3E0]">BarberFlow</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E4E3E0]/50 font-bold">
            Acesse seu painel de controle
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                <User size={12} /> Email ou Usuário
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                placeholder="ex: admin"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                <Lock size={12} /> Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono pr-12"
                  placeholder="••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/30 hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#141414] text-[#E4E3E0] rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Entrar no Sistema
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[10px] opacity-30 uppercase tracking-widest font-bold">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-secondary cursor-pointer hover:underline">
                Cadastre sua barbearia
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
