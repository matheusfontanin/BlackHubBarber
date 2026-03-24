import { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (signUpError) throw signUpError;

      // Se confirmação de email desabilitada no Supabase, redireciona direto
      if (data.session) {
        navigate('/onboarding');
        return;
      }

      // Senão, mostra mensagem de confirmação
      setSuccess(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      let message = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
      if (error.includes('already registered')) {
        message = 'Este e-mail já está cadastrado. Tente fazer login.';
      } else if (error.includes('Password should be')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#141414]/5 overflow-hidden text-center"
        >
          <div className="bg-[#141414] p-8 space-y-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-[#141414]">
              <Mail size={32} />
            </div>
            <h1 className="text-2xl font-serif italic text-[#E4E3E0]">Confirme seu e-mail</h1>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-primary/70 text-sm leading-relaxed">
              Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta e ser redirecionado para o onboarding.
            </p>
            <Link
              to="/login"
              className="block text-xs font-bold text-secondary hover:underline uppercase tracking-widest mt-4"
            >
              Voltar para o login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
            Cadastre sua barbearia
          </p>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-6">
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
                <User size={12} /> Seu Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                placeholder="ex: João Silva"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                <Mail size={12} /> E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                placeholder="ex: joao@barbearia.com"
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
                  placeholder="mínimo 6 caracteres"
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
                Criar conta gratuita
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <p className="text-[10px] opacity-30 uppercase tracking-widest font-bold">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-secondary cursor-pointer hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
