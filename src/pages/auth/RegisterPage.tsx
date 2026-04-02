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

      if (data.session) {
        navigate('/onboarding');
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      let message = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
      if (error.includes('already registered')) {
        message = 'Este e-mail ja esta cadastrado. Tente fazer login.';
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
      <div className="min-h-screen bg-primary flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-serif italic text-primary mb-2">Confirme seu e-mail</h1>
              <p className="text-primary/50 text-sm leading-relaxed">
                Enviamos um link de confirmacao para <strong className="text-primary">{email}</strong>. Clique no link para ativar sua conta.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
            >
              Voltar para o login <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-secondary/20"
          >
            <Scissors size={28} className="text-primary" />
          </motion.div>
          <h1 className="text-3xl font-serif italic text-white mb-2">BlackHub</h1>
          <p className="text-sm text-white/30">Cadastre sua barbearia</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          <form onSubmit={handleRegister} className="p-7 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-primary/40 flex items-center gap-1.5 mb-2">
                  <User size={13} /> Seu Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-primary/[0.03] border border-primary/10 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm"
                  placeholder="Joao Silva"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-primary/40 flex items-center gap-1.5 mb-2">
                  <Mail size={13} /> E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-primary/[0.03] border border-primary/10 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm"
                  placeholder="joao@barbearia.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-primary/40 flex items-center gap-1.5 mb-2">
                  <Lock size={13} /> Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-primary/[0.03] border border-primary/10 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm pr-12"
                    placeholder="Minimo 6 caracteres"
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
                <>Criar conta gratuita <ArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-xs text-primary/30 pt-1">
              Ja tem uma conta?{' '}
              <Link to="/login" className="text-secondary font-semibold hover:underline">
                Faca login
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/15 mt-8 uppercase tracking-[0.2em] font-medium">
          BlackHub Barber &mdash; Powered by AI
        </p>
      </motion.div>
    </div>
  );
}
