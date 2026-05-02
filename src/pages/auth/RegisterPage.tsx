import { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
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
      if (data.session) { navigate('/onboarding'); return; }
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      let message = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
      if (msg.includes('already registered')) message = 'Este e-mail já está cadastrado. Tente fazer login.';
      else if (msg.includes('Password should be')) message = 'A senha deve ter pelo menos 6 caracteres.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <div className="card p-8 text-center space-y-5">
            <div className="w-14 h-14 bg-[#E8F6F0] rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle size={26} className="text-[#11895C]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink mb-2">Confirme seu e-mail</h2>
              <p className="text-sm text-ink-soft leading-relaxed">
                Enviamos um link de confirmação para{' '}
                <strong className="text-ink">{email}</strong>.
                Clique no link para ativar sua conta.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#BE9B64] hover:text-[#9C7B47] transition-colors"
            >
              Voltar para o login <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <p className="text-sm text-ink-soft mt-1">Cadastre sua barbearia</p>
        </div>

        <div className="card overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#BE9B64] to-transparent" />
          <form onSubmit={handleRegister} className="p-7 space-y-5">
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
                <label className="label"><User size={12} /> Seu nome</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="João Silva" required />
              </div>
              <div>
                <label className="label"><Mail size={12} /> E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="joao@barbearia.com" required />
              </div>
              <div>
                <label className="label"><Lock size={12} /> Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="Mínimo 6 caracteres"
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
                : <><span>Criar conta gratuita</span><ArrowRight size={15} /></>
              }
            </button>

            <p className="text-center text-[13px] text-ink-soft pt-1">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-[#BE9B64] font-semibold hover:text-[#9C7B47] transition-colors">
                Faça login
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
